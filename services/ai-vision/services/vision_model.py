import io
import os
import threading
import time
from pathlib import Path
from typing import Final

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms
from torchvision.models import (
    MobileNet_V3_Large_Weights,
    mobilenet_v3_large,
    mobilenet_v3_small,
)

CATEGORY_LABELS: Final[tuple[str, ...]] = (
    "DEPOT_SAUVAGE",
    "ENCOMBRANTS",
    "DECHETS_VERTS",
    "GRAVATS_CHANTIER",
)
WEIGHTS_ENV_VAR: Final[str] = "AI_VISION_WEIGHTS"
IMAGE_SIZE: Final[int] = 224
MAX_IMAGE_PIXELS: Final[int] = 20_000_000
TOP_PREDICTIONS_COUNT: Final[int] = 3

_PREPROCESS = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        ),
    ]
)
_MODEL_LOCK = threading.Lock()
_MODEL: torch.nn.Module | None = None
_MODEL_PATH: Path | None = None


class InvalidImageError(ValueError):
    """Raised when the uploaded bytes cannot be decoded as an image."""


class ModelNotConfiguredError(RuntimeError):
    """Raised when no trained classifier checkpoint is configured."""


def _get_model() -> torch.nn.Module:
    global _MODEL, _MODEL_PATH

    configured_path = os.environ.get(WEIGHTS_ENV_VAR, "").strip()
    if not configured_path:
        raise ModelNotConfiguredError(
            f"No trained classifier is configured. Set {WEIGHTS_ENV_VAR} to a checkpoint."
        )

    weights_path = Path(configured_path).expanduser().resolve()
    if not weights_path.is_file():
        raise ModelNotConfiguredError(
            f"The configured classifier checkpoint does not exist: {WEIGHTS_ENV_VAR}."
        )

    if _MODEL is not None and _MODEL_PATH == weights_path:
        return _MODEL

    with _MODEL_LOCK:
        if _MODEL is not None and _MODEL_PATH == weights_path:
            return _MODEL

        model = mobilenet_v3_small(weights=None)
        model.classifier[3] = torch.nn.Linear(
            model.classifier[3].in_features,
            len(CATEGORY_LABELS),
        )
        try:
            checkpoint = torch.load(
                weights_path,
                map_location="cpu",
                weights_only=True,
            )
            if not isinstance(checkpoint, dict):
                raise TypeError("Checkpoint must contain a state dictionary.")
            state_dict = checkpoint.get("state_dict", checkpoint)
            if not isinstance(state_dict, dict):
                raise TypeError("Checkpoint must contain a state dictionary.")
            model.load_state_dict(state_dict)
        except (OSError, RuntimeError, TypeError, ValueError) as exc:
            raise ModelNotConfiguredError(
                f"The configured {WEIGHTS_ENV_VAR} checkpoint is invalid."
            ) from exc

        model.eval()
        model.to("cuda" if torch.cuda.is_available() else "cpu")
        _MODEL = model
        _MODEL_PATH = weights_path
        return model


def _preprocess_image(image_bytes: bytes) -> torch.Tensor:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise ValueError("Image dimensions exceed the supported limit.")
            image.load()
            return _PREPROCESS(image.convert("RGB")).unsqueeze(0)
    except (Image.DecompressionBombError, OSError, UnidentifiedImageError, ValueError) as exc:
        raise InvalidImageError("The uploaded file is not a valid supported image.") from exc


def predict(image_bytes: bytes) -> dict[str, object]:
    image_tensor = _preprocess_image(image_bytes)
    model = _get_model()
    device = next(model.parameters()).device

    started_at = time.perf_counter()
    with torch.inference_mode():
        logits = model(image_tensor.to(device))
        if logits.ndim != 2 or logits.shape[0] != 1 or logits.shape[1] != len(CATEGORY_LABELS):
            raise RuntimeError("The classifier must return one score per configured category.")
        if not torch.isfinite(logits).all():
            raise RuntimeError("The classifier returned non-finite scores.")
        probabilities = torch.nn.functional.softmax(logits, dim=1)[0].cpu()
    inference_ms = (time.perf_counter() - started_at) * 1000

    top_scores, top_indices = torch.topk(
        probabilities,
        k=min(TOP_PREDICTIONS_COUNT, len(CATEGORY_LABELS)),
    )
    top_predictions = [
        {"label": CATEGORY_LABELS[index], "score": float(score)}
        for score, index in zip(top_scores.tolist(), top_indices.tolist())
    ]
    best_prediction = top_predictions[0]

    return {
        "suggestedCategory": best_prediction["label"],
        "confidence": best_prediction["score"],
        "inferenceMs": round(inference_ms, 2),
        "topPredictions": top_predictions,
    }


_IMAGENET_LOCK = threading.Lock()
_IMAGENET_MODEL: torch.nn.Module | None = None
_IMAGENET_LABELS: list[str] = []
_IMAGENET_PREPROCESS = None

_WASTE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "DECHETS_DANGEREUX": (
        "gasmask",
        "syringe",
        "pill bottle",
        "medicine chest",
        "oil filter",
        "barrel",
        "drum",
        "lighter",
        "matchstick",
        "ashcan",
    ),
    "DEPOT_SAUVAGE": (
        "ashcan",
        "trash",
        "garbage",
        "plastic bag",
        "water bottle",
        "pop bottle",
        "beer bottle",
        "wine bottle",
        "beer glass",
        "milk can",
        "carton",
        "crate",
        "bucket",
        "paper towel",
        "toilet tissue",
        "shopping basket",
        "shopping cart",
        "tin can",
        "packet",
    ),
    "ENCOMBRANTS": (
        "sofa",
        "couch",
        "folding chair",
        "rocking chair",
        "wardrobe",
        "mattress",
        "refrigerator",
        "washer",
        "dishwasher",
        "microwave",
        "bicycle",
        "tricycle",
        "tire",
        "wheel",
    ),
    "VEGETAUX": (
        "hay",
        "straw",
        "leaf",
        "stump",
        "log",
        "lumber",
        "lawn",
        "hedge",
        "acorn",
    ),
    "GRAVATS_CHANTIER": (
        "brick",
        "stone wall",
        "tile",
        "wheelbarrow",
        "shovel",
        "wreck",
        "sandbar",
    ),
}


def _get_imagenet_analyzer():
    global _IMAGENET_MODEL, _IMAGENET_LABELS, _IMAGENET_PREPROCESS
    if _IMAGENET_MODEL is not None:
        return _IMAGENET_MODEL, _IMAGENET_LABELS, _IMAGENET_PREPROCESS
    with _IMAGENET_LOCK:
        if _IMAGENET_MODEL is None:
            weights = MobileNet_V3_Large_Weights.DEFAULT
            model = mobilenet_v3_large(weights=weights)
            model.eval()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model.to(device)
            _IMAGENET_MODEL = model
            _IMAGENET_LABELS = list(weights.meta["categories"])
            _IMAGENET_PREPROCESS = weights.transforms()
    return _IMAGENET_MODEL, _IMAGENET_LABELS, _IMAGENET_PREPROCESS


def analyze_photo_bytes(
    image_bytes: bytes,
    claimed_category: str | None = None,
) -> dict[str, object]:
    """Analyse réelle d'une photo via MobileNetV3-Large (ImageNet-1K) pour vérifier la présence de déchets."""
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise ValueError("Image dimensions exceed the supported limit.")
            image.load()
            rgb = image.convert("RGB")
    except (Image.DecompressionBombError, OSError, UnidentifiedImageError, ValueError) as exc:
        raise InvalidImageError("The uploaded file is not a valid supported image.") from exc

    model, labels, preprocess = _get_imagenet_analyzer()
    device = next(model.parameters()).device
    tensor = preprocess(rgb).unsqueeze(0).to(device)

    started_at = time.perf_counter()
    with torch.inference_mode():
        logits = model(tensor)
        probs = torch.nn.functional.softmax(logits, dim=1)[0].cpu()
    inference_ms = (time.perf_counter() - started_at) * 1000

    top_scores, top_indices = torch.topk(probs, k=10)
    top_objects = [
        {"label": labels[idx], "score": round(float(score), 4)}
        for score, idx in zip(top_scores.tolist(), top_indices.tolist())
    ]

    cat_scores: dict[str, float] = {k: 0.0 for k in _WASTE_KEYWORDS}
    matched_items: list[str] = []
    for obj in top_objects:
        lbl = str(obj["label"]).lower()
        sc = float(obj["score"])
        for cat, keywords in _WASTE_KEYWORDS.items():
            if any(kw in lbl for kw in keywords):
                cat_scores[cat] += sc
                matched_items.append(f"{obj['label']} ({round(sc * 100)}%)")

    waste_prob = min(1.0, sum(cat_scores.values()))
    best_cat = max(cat_scores, key=lambda k: cat_scores[k])
    top3_summary = ", ".join(
        f"{o['label']} ({round(float(o['score']) * 100)}%)" for o in top_objects[:3]
    )

    if waste_prob < 0.15:
        confidence = round(max(0.05, min(0.45, waste_prob * 1.5)), 4)
        return {
            "suggestedCategory": claimed_category or "AUTRE",
            "confidence": confidence,
            "isWasteDetected": False,
            "detectedObjects": top_objects[:5],
            "inferenceMs": round(inference_ms, 2),
            "justification": (
                f"Alerte IA Vision : aucune preuve de déchet ou d'anomalie urbaine détectée sur la photo "
                f"(objets identifiés : {top3_summary}). Vérification manuelle ou rejet recommandé."
            ),
        }

    # Si des indices de déchets existent mais ne correspondent pas à une catégorie dangereuse déclarée
    claimed_norm = (claimed_category or "").upper().strip()
    if claimed_norm == "DECHETS_DANGEREUX" and cat_scores["DECHETS_DANGEREUX"] < 0.12:
        confidence = round(max(0.30, min(0.58, waste_prob)), 4)
        justification = (
            f"Attention : la photo montre des indices visuels ({', '.join(matched_items[:3]) or top3_summary}), "
            f"mais aucun déchet dangereux confirmé. Catégorie probable : {best_cat}."
        )
        suggested = best_cat
    else:
        confidence = round(max(0.55, min(0.95, 0.45 + waste_prob * 0.65)), 4)
        suggested = best_cat
        justification = (
            f"IA Vision (MobileNetV3) : indices détectés ({', '.join(matched_items[:3]) or top3_summary}) "
            f"→ catégorie {suggested}."
        )

    return {
        "suggestedCategory": suggested,
        "confidence": confidence,
        "isWasteDetected": True,
        "detectedObjects": top_objects[:5],
        "inferenceMs": round(inference_ms, 2),
        "justification": justification,
    }

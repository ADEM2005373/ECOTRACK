import io
import os
import threading
import time
from pathlib import Path
from typing import Final

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms
from torchvision.models import mobilenet_v3_small

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

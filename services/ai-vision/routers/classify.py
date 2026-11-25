import base64
import urllib.request
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from services.vision_model import (
    CATEGORY_LABELS,
    InvalidImageError,
    ModelNotConfiguredError,
    analyze_photo_bytes,
    predict,
)

router = APIRouter(tags=["classification"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024


class TopPrediction(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)


class ClassificationResponse(BaseModel):
    suggestedCategory: str
    confidence: float = Field(ge=0, le=1)
    inferenceMs: float = Field(ge=0)
    topPredictions: list[TopPrediction]


class IncidentClassificationResponse(BaseModel):
    category: str
    confidence: float = Field(ge=0, le=1)
    model: str
    is_confident: bool


async def _classify_upload(file: UploadFile) -> dict[str, object]:
    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    if not image_bytes:
        raise HTTPException(status_code=422, detail="The uploaded image is empty.")

    try:
        return await run_in_threadpool(predict, image_bytes)
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ModelNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/v1/classify", response_model=ClassificationResponse)
async def classify_image(file: UploadFile = File(...)) -> dict[str, object]:
    return await _classify_upload(file)


@router.post(
    "/api/v1/vision/classify",
    response_model=IncidentClassificationResponse,
)
async def classify_incident_photo(file: UploadFile = File(...)) -> dict[str, object]:
    prediction = await _classify_upload(file)
    category = prediction["suggestedCategory"]
    confidence = prediction["confidence"]
    if not isinstance(category, str) or category not in CATEGORY_LABELS:
        raise RuntimeError("The classifier returned an unknown incident category.")
    if not isinstance(confidence, (int, float)):
        raise RuntimeError("The classifier returned an invalid confidence score.")

    return {
        "category": category,
        "confidence": round(float(confidence), 4),
        "model": "mobilenet_v3_small",
        "is_confident": confidence >= 0.65,
    }


class AnalyzePhotoRequest(BaseModel):
    imageUrl: str
    claimedCategory: str | None = None


def _decode_image_url(image_url: str) -> bytes:
    raw = image_url.strip()
    if raw.startswith("data:image/") and ";base64," in raw:
        b64_part = raw.split(";base64,", 1)[1]
        return base64.b64decode(b64_part)
    if raw.startswith(("http://", "https://")):
        req = urllib.request.Request(raw, headers={"User-Agent": "EcoTrack-AI-Vision/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            return resp.read(MAX_IMAGE_BYTES + 1)
    raise InvalidImageError("Unsupported imageUrl format (expected data:image base64 or http/https URL).")


@router.post("/api/v1/vision/analyze")
async def analyze_photo_endpoint(payload: AnalyzePhotoRequest) -> dict[str, object]:
    try:
        image_bytes = await run_in_threadpool(_decode_image_url, payload.imageUrl)
        if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
            raise InvalidImageError("Image is empty or exceeds 10 MB.")
        return await run_in_threadpool(analyze_photo_bytes, image_bytes, payload.claimedCategory)
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {exc}") from exc

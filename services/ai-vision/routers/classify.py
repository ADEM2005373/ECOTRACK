from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from services.vision_model import (
    CATEGORY_LABELS,
    InvalidImageError,
    ModelNotConfiguredError,
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

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from services.vision_model import InvalidImageError, ModelNotConfiguredError, predict

router = APIRouter(prefix="/v1", tags=["classification"])

MAX_IMAGE_BYTES = 10 * 1024 * 1024


class TopPrediction(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)


class ClassificationResponse(BaseModel):
    suggestedCategory: str
    confidence: float = Field(ge=0, le=1)
    inferenceMs: float = Field(ge=0)
    topPredictions: list[TopPrediction]


@router.post("/classify", response_model=ClassificationResponse)
async def classify_image(file: UploadFile = File(...)) -> dict[str, object]:
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

import io
import unittest
from unittest.mock import patch

import torch
from fastapi import HTTPException, UploadFile
from PIL import Image

import routers.classify as classify_router
import services.vision_model as vision_model
from main import app


def make_test_image() -> bytes:
    image = Image.new("RGB", (32, 32), color=(80, 120, 160))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class FakeClassifier(torch.nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.marker = torch.nn.Parameter(torch.zeros(1))

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        return torch.tensor([[0.1, 0.2, 2.0, 0.3]], device=image.device)


class VisionModelTests(unittest.TestCase):
    def test_predict_returns_categories_and_probabilities(self) -> None:
        with patch.object(vision_model, "_get_model", return_value=FakeClassifier()):
            result = vision_model.predict(make_test_image())

        self.assertEqual(result["suggestedCategory"], "ECLAIRAGE_PUBLIC")
        self.assertGreaterEqual(result["confidence"], 0.0)
        self.assertLessEqual(result["confidence"], 1.0)
        self.assertEqual(len(result["topPredictions"]), 3)
        self.assertGreaterEqual(result["inferenceMs"], 0.0)

    def test_predict_rejects_non_image_bytes(self) -> None:
        with self.assertRaises(vision_model.InvalidImageError):
            vision_model._preprocess_image(b"not an image")


class ClassifyRouteTests(unittest.IsolatedAsyncioTestCase):
    def test_classify_route_is_documented(self) -> None:
        schema = app.openapi()

        self.assertIn("/v1/classify", schema["paths"])
        self.assertIn("post", schema["paths"]["/v1/classify"])
        self.assertEqual(
            schema["paths"]["/v1/classify"]["post"]["responses"]["200"]["content"][
                "application/json"
            ]["schema"]["$ref"],
            "#/components/schemas/ClassificationResponse",
        )

    async def test_classify_returns_prediction(self) -> None:
        expected = {
            "suggestedCategory": "DEPOT_SAUVAGE",
            "confidence": 0.9,
            "inferenceMs": 12.5,
            "topPredictions": [{"label": "DEPOT_SAUVAGE", "score": 0.9}],
        }
        upload = UploadFile(file=io.BytesIO(make_test_image()), filename="incident.png")
        with patch.object(classify_router, "predict", return_value=expected):
            result = await classify_router.classify_image(upload)

        self.assertEqual(result, expected)

    async def test_classify_returns_503_without_trained_weights(self) -> None:
        upload = UploadFile(file=io.BytesIO(make_test_image()), filename="incident.png")
        with patch.dict("os.environ", {"AI_VISION_WEIGHTS": ""}):
            with self.assertRaises(HTTPException) as error:
                await classify_router.classify_image(upload)

        self.assertEqual(error.exception.status_code, 503)
        self.assertIn("AI_VISION_WEIGHTS", error.exception.detail)

    async def test_classify_rejects_empty_file(self) -> None:
        upload = UploadFile(file=io.BytesIO(b""), filename="empty.png")
        with self.assertRaises(HTTPException) as error:
            await classify_router.classify_image(upload)

        self.assertEqual(error.exception.status_code, 422)

    async def test_classify_rejects_invalid_image(self) -> None:
        upload = UploadFile(file=io.BytesIO(b"not an image"), filename="incident.png")
        with self.assertRaises(HTTPException) as error:
            await classify_router.classify_image(upload)

        self.assertEqual(error.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()

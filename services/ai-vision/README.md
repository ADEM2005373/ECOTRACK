# EcoTrack AI Vision Service

## Classifier checkpoint

The service needs a trained MobileNetV3 Small checkpoint for the four output
classes. It does not use random or ImageNet labels as incident categories.
Set `AI_VISION_WEIGHTS` to the checkpoint path before starting the service.
The checkpoint can be a raw PyTorch state dictionary or a dictionary with a
`state_dict` entry. Its classifier must have been trained with this output order:

1. `DEPOT_SAUVAGE`
2. `ENCOMBRANTS`
3. `DECHETS_VERTS`
4. `GRAVATS_CHANTIER`

Images are converted to RGB, resized to 224 × 224, and normalized with the
standard ImageNet mean and standard deviation. Without a usable trained
checkpoint, classification endpoints return HTTP 503 rather than a misleading
prediction. ImageNet output indices are not incident categories and are never
mapped to them by index arithmetic.

## Run locally

From this directory, install `requirements.txt` and start the API:

```powershell
$env:AI_VISION_WEIGHTS = "weights\mobilenet_v3_small_eco.pth"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://localhost:8000/docs` to try either classification route:

- `POST /api/v1/vision/classify` returns `category`, `confidence`, `model`, and
  `is_confident` (threshold: 0.65).
- `POST /v1/classify` returns the suggested category, confidence, inference
  time in milliseconds, and the three highest predictions.

Uploads are limited to 10 MB and 20 megapixels.

Run the unit tests from this directory with:

```powershell
python -m unittest discover -s tests
```

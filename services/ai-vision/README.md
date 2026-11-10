# EcoTrack AI Vision Service

## Classifier checkpoint

The service needs a trained MobileNetV3 Small checkpoint for the four output
classes. It does not use random or ImageNet labels as incident categories.
Set `AI_VISION_WEIGHTS` to the checkpoint path before starting the service.
The checkpoint can be a raw PyTorch state dictionary or a dictionary with a
`state_dict` entry. Its classifier must have been trained with this output order:

1. `DEPOT_SAUVAGE`
2. `NID_DE_POULE`
3. `ECLAIRAGE_PUBLIC`
4. `ENCOMBRANT`

Images are converted to RGB, resized to 224 × 224, and normalized with the
standard ImageNet mean and standard deviation. Without a usable trained
checkpoint, `POST /v1/classify` returns HTTP 503 rather than a misleading
prediction.

## Run locally

From this directory, install `requirements.txt` and start the API:

```powershell
$env:AI_VISION_WEIGHTS = "C:\path\to\mobilenet_v3_small.pth"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://localhost:8000/docs` to upload an image to `POST /v1/classify`.
Uploads are limited to 10 MB and 20 megapixels. The response includes the
suggested category, its confidence from 0 to 1, elapsed inference time in
milliseconds, and the three highest predictions.

Run the unit tests from this directory with:

```powershell
python -m unittest discover -s tests
```

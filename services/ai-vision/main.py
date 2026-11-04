import torch
from fastapi import FastAPI

app = FastAPI(title="AI Vision Service")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": "gpu" if torch.cuda.is_available() else "cpu",
    }
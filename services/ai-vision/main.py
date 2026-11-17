import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.classify import router as classify_router

app = FastAPI(
    title="EcoTrack AI Vision Service",
    description="Microservice IA pour la classification d'incidents et de déchets urbains",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify_router)

@app.get("/health")
def health():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    return {
        "status": "ok",
        "service": "ai-vision",
        "version": "1.0.0",
        "device": device,
        "torch_version": torch.__version__,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

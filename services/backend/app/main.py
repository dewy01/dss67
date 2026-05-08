from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .controllers.dataset_controller import router as dataset_router
from .controllers.classification_controller import router as classification_router
from .controllers.hyperplane_controller import router as hyperplane_router


def create_app() -> FastAPI:
    app = FastAPI(title="Decision Support Backend", version="0.1.67")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/info")
    def info() -> dict:
        return {"name": "decision-support-backend", "version": "0.1.67"}

    app.include_router(dataset_router)
    app.include_router(classification_router)
    app.include_router(hyperplane_router)

    return app


app = create_app()

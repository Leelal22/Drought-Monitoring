
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import check_database
from app.routes.drought import router as drought_router

app = FastAPI(
    title="AP Drought Monitoring API",
    description=(
        "Andhra Pradesh drought monitoring "
        "using synthetic development data."
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": "AP Drought Monitoring API is running",
        "version": "1.0.0",
        "data_type": "synthetic"
    }


@app.get("/api/v1/health")
def health():
    try:
        check_database()
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"MongoDB connection failed: {exc}"
        )


app.include_router(drought_router)

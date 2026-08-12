from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import ai, complaints
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            {"detail": exc.errors(), "message": "Validation error"}
        ),
    )


@app.exception_handler(SQLAlchemyError)
async def db_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "Database error occurred. Please check connection.",
            "detail": str(exc),
        },
    )


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.app_name}


# Mount routers
app.include_router(complaints.router, prefix="/api/complaints", tags=["complaints"])
app.include_router(complaints.router, prefix="/complaints", tags=["complaints-legacy"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai.router, prefix="/ai", tags=["ai-legacy"])

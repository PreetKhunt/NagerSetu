from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ai import (
    ClusterListResponse,
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    TextAnalysisRequest,
    TextAnalysisResponse,
)
from app.services.ai_service import (
    analyze_image_service,
    analyze_text_service,
    get_complaint_clusters_service,
)

router = APIRouter()


@router.post("/analyze-text", response_model=TextAnalysisResponse)
def analyze_text_endpoint(payload: TextAnalysisRequest):
    return analyze_text_service(payload.text, payload.location)


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image_endpoint(payload: ImageAnalysisRequest):
    return analyze_image_service(
        image_data=payload.image_data,
        mime_type=payload.mime_type,
        selected_category=payload.selected_category,
    )


@router.get("/clusters", response_model=ClusterListResponse)
def get_clusters_endpoint(db: Session = Depends(get_db)):
    clusters = get_complaint_clusters_service(db)
    total_grouped = sum(c.complaint_count for c in clusters if c.complaint_count > 1)
    return {
        "clusters": clusters,
        "total_clusters": len(clusters),
        "total_grouped_complaints": total_grouped,
    }

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCreate,
    ComplaintListResponse,
    ComplaintResponse,
    ComplaintStatsResponse,
    ComplaintStatusUpdate,
    ComplaintTimelineResponse,
)

from app.services.complaint_service import (
    assign_complaint,
    create_complaint,
    get_complaint_by_id,
    get_complaint_stats,
    get_complaint_timeline,
    get_complaints,
    update_complaint_status,
)

router = APIRouter()


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_complaint_endpoint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
):
    return create_complaint(db, payload)


@router.get("", response_model=ComplaintListResponse)
def get_complaints_endpoint(
    search: str | None = None,
    status: str | None = None,
    department: str | None = None,
    priority: str | None = None,
    assigned_officer: str | None = None,
    user_id: str | None = None,
    sort: Literal["recent", "oldest", "updated", "priority"] = "recent",
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = get_complaints(
        db,
        search=search,
        status=status,
        department=department,
        priority=priority,
        assigned_officer=assigned_officer,
        user_id=user_id,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/stats", response_model=ComplaintStatsResponse)
def get_complaint_stats_endpoint(db: Session = Depends(get_db)):
    return get_complaint_stats(db)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_endpoint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    complaint = get_complaint_by_id(db, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return complaint


@router.get(
    "/{complaint_id}/timeline",
    response_model=list[ComplaintTimelineResponse],
)
def get_complaint_timeline_endpoint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    complaint = get_complaint_by_id(db, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return get_complaint_timeline(db, complaint_id)


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status_endpoint(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
):
    complaint = get_complaint_by_id(db, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return update_complaint_status(db, complaint, payload)


@router.patch("/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_complaint_endpoint(
    complaint_id: str,
    payload: ComplaintAssign,
    db: Session = Depends(get_db),
):
    complaint = get_complaint_by_id(db, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return assign_complaint(db, complaint, payload)

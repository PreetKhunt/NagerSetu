import secrets
from datetime import UTC, datetime

from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.models.complaint import Complaint, ComplaintTimeline
from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCreate,
    ComplaintStatusUpdate,
)


def generate_complaint_id(db: Session) -> str:
    """Generate a collision-proof unique complaint ID (e.g., GRV-20260811-9F2A)."""
    date_str = datetime.now(UTC).strftime("%Y%m%d")
    random_suffix = secrets.token_hex(2).upper()
    complaint_id = f"GRV-{date_str}-{random_suffix}"

    while db.query(Complaint).filter(Complaint.id == complaint_id).first() is not None:
        random_suffix = secrets.token_hex(2).upper()
        complaint_id = f"GRV-{date_str}-{random_suffix}"

    return complaint_id


def add_timeline_event(
    db: Session,
    complaint_id: str,
    status: str,
    note: str | None = None,
    actor: str | None = None,
) -> ComplaintTimeline:
    event = ComplaintTimeline(
        complaint_id=complaint_id,
        status=status,
        note=note,
        actor=actor,
        created_at=datetime.now(UTC),
    )
    db.add(event)
    return event


def create_complaint(db: Session, payload: ComplaintCreate) -> Complaint:
    now = datetime.now(UTC)
    c_id = generate_complaint_id(db)

    complaint = Complaint(
        id=c_id,
        user_id=payload.user_id,
        citizen_name=payload.citizen_name,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        category_label=payload.category_label,
        department=payload.department,
        priority=str(payload.priority),
        status="registered",
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        is_voice=payload.is_voice,
        voice_transcript=payload.voice_transcript,
        ai_confidence=payload.ai_confidence,
        created_at=now,
        updated_at=now,
    )
    db.add(complaint)
    add_timeline_event(
        db,
        c_id,
        "registered",
        "Complaint registered",
        payload.citizen_name,
    )
    db.commit()
    db.refresh(complaint)
    return complaint


def get_complaints(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    department: str | None = None,
    priority: str | None = None,
    assigned_officer: str | None = None,
    user_id: str | None = None,
    sort: str = "recent",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Complaint], int]:
    query = db.query(Complaint)

    if search is not None:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.id.ilike(term),
                Complaint.title.ilike(term),
                Complaint.description.ilike(term),
                Complaint.location.ilike(term),
            )
        )
    if status is not None:
        query = query.filter(Complaint.status == status)
    if department is not None:
        query = query.filter(Complaint.department == department)
    if priority is not None:
        query = query.filter(Complaint.priority == priority)
    if assigned_officer is not None:
        query = query.filter(Complaint.assigned_officer == assigned_officer)
    if user_id is not None:
        query = query.filter(Complaint.user_id == user_id)

    total = query.count()
    if sort == "oldest":
        query = query.order_by(Complaint.created_at.asc())
    elif sort == "updated":
        query = query.order_by(Complaint.updated_at.desc())
    elif sort == "priority":
        priority_rank = case(
            (Complaint.priority == "critical", 4),
            (Complaint.priority == "high", 3),
            (Complaint.priority == "medium", 2),
            (Complaint.priority == "low", 1),
            else_=0,
        )
        query = query.order_by(priority_rank.desc(), Complaint.created_at.desc())
    else:
        query = query.order_by(Complaint.created_at.desc())

    items = query.offset(offset).limit(limit).all()
    return items, total


def get_complaint_stats(db: Session) -> dict[str, int]:
    raw_status_counts = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    status_counts = {str(st): count for st, count in raw_status_counts}
    high_priority = (
        db.query(Complaint)
        .filter(Complaint.priority.in_(["critical", "high"]))
        .count()
    )

    return {
        "total": db.query(Complaint).count(),
        "registered": status_counts.get("registered", 0),
        "assigned": status_counts.get("assigned", 0),
        "in_progress": status_counts.get("in_progress", 0),
        "resolved": status_counts.get("resolved", 0),
        "rejected": status_counts.get("rejected", 0),
        "reopened": status_counts.get("reopened", 0),
        "high_priority": high_priority,
    }


def get_complaint_by_id(db: Session, complaint_id: str) -> Complaint | None:
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()


def get_complaint_timeline(
    db: Session,
    complaint_id: str,
) -> list[ComplaintTimeline]:
    return (
        db.query(ComplaintTimeline)
        .filter(ComplaintTimeline.complaint_id == complaint_id)
        .order_by(ComplaintTimeline.created_at.asc())
        .all()
    )


def update_complaint_status(
    db: Session,
    complaint: Complaint,
    payload: ComplaintStatusUpdate,
) -> Complaint:
    c_id = str(complaint.id)
    st_val = str(payload.status)
    setattr(complaint, "status", st_val)

    if payload.resolution_note is not None:
        setattr(complaint, "resolution_note", payload.resolution_note)
    if payload.resolution_image_url is not None:
        setattr(complaint, "resolution_image_url", payload.resolution_image_url)

    now = datetime.now(UTC)
    setattr(complaint, "updated_at", now)

    add_timeline_event(
        db,
        c_id,
        st_val,
        payload.note or payload.resolution_note or "Status updated",
        payload.actor or "Officer",
    )

    db.commit()
    db.refresh(complaint)

    return complaint


def assign_complaint(
    db: Session,
    complaint: Complaint,
    payload: ComplaintAssign,
) -> Complaint:
    c_id = str(complaint.id)
    setattr(complaint, "assigned_officer", payload.officer_name)
    setattr(complaint, "status", "assigned")
    now = datetime.now(UTC)
    setattr(complaint, "updated_at", now)

    add_timeline_event(
        db,
        c_id,
        "assigned",
        f"Complaint assigned to {payload.officer_name}",
        payload.actor or "Officer",
    )

    db.commit()
    db.refresh(complaint)

    return complaint

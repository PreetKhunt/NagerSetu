from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ComplaintPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ComplaintStatus(StrEnum):
    registered = "registered"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"
    reopened = "reopened"


class ComplaintCreate(BaseModel):
    user_id: str | None = None
    citizen_name: str = Field(default="Anonymous Citizen", min_length=1, max_length=100)
    title: str = Field(default="Civic issue reported", min_length=1, max_length=200)
    description: str = Field(default="No detailed description provided.", min_length=1, max_length=3000)
    category: str = Field(default="infrastructure", min_length=1, max_length=50)
    category_label: str | None = None
    department: str = Field(default="Urban Development", min_length=1, max_length=100)
    priority: ComplaintPriority = ComplaintPriority.medium
    location: str = Field(default="Location not specified", min_length=1, max_length=200)
    latitude: float | None = None
    longitude: float | None = None
    image_url: str | None = None
    is_voice: bool = False
    voice_transcript: str | None = None
    ai_confidence: float = 0.80


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    citizen_name: str
    title: str
    description: str
    category: str
    category_label: str | None = None
    department: str
    priority: ComplaintPriority
    status: ComplaintStatus
    location: str
    latitude: float | None = None
    longitude: float | None = None
    image_url: str | None = None
    is_voice: bool = False
    voice_transcript: str | None = None
    ai_confidence: float = 0.80
    created_at: datetime
    updated_at: datetime
    resolution_note: str | None = None
    resolution_image_url: str | None = None
    assigned_officer: str | None = None


class ComplaintListResponse(BaseModel):
    items: list[ComplaintResponse]
    total: int
    limit: int
    offset: int


class ComplaintStatsResponse(BaseModel):
    total: int
    registered: int
    assigned: int
    in_progress: int
    resolved: int
    rejected: int
    reopened: int
    high_priority: int


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    resolution_note: str | None = None
    resolution_image_url: str | None = None
    note: str | None = None
    actor: str | None = None


class ComplaintAssign(BaseModel):
    officer_name: str = Field(min_length=1, max_length=100)
    actor: str | None = None


class ComplaintTimelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    status: ComplaintStatus
    note: str | None = None
    actor: str | None = None
    created_at: datetime

from pydantic import BaseModel, Field


class TextAnalysisRequest(BaseModel):
    text: str = Field(min_length=3, max_length=4000)
    location: str | None = None


class TextAnalysisResponse(BaseModel):
    category: str
    category_label: str
    issue: str
    priority: str
    priority_rank: int
    department: str
    confidence: float
    language: str
    location: str | None = None
    summary: str
    escalated: bool
    matched_keywords: list[str]


class ImageAnalysisRequest(BaseModel):
    image_data: str = Field(description="Base64-encoded image data (without data:... prefix)")
    mime_type: str = Field(default="image/jpeg", description="MIME type of the image")
    selected_category: str | None = None


class ImageAnalysisResponse(BaseModel):
    is_civic_issue: bool
    is_relevant: bool
    category: str
    category_label: str
    issue: str
    description: str
    confidence: float
    severity: str | None = None
    department: str
    suggested_priority: str
    tags: list[str]
    reason: str | None = None


class ComplaintCluster(BaseModel):
    cluster_id: str
    title: str
    category: str
    department: str
    location: str
    complaint_count: int
    complaint_ids: list[str]
    highest_priority: str


class ClusterListResponse(BaseModel):
    clusters: list[ComplaintCluster]
    total_clusters: int
    total_grouped_complaints: int

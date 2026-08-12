import math
from collections import defaultdict
from typing import Any
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.schemas.ai import (
    ComplaintCluster,
    ImageAnalysisResponse,
    TextAnalysisResponse,
)

AI_RULES: list[dict[str, Any]] = [
    {
        "category": "sanitation",
        "category_label": "Sanitation & Waste Management",
        "dept": "Solid Waste Management",
        "match": ["garbage", "trash", "waste", "dump", "dirty", "smell", "kachra", "safai", "overflow"],
        "issue": "Uncleared Waste Dump",
        "priority": "medium",
    },
    {
        "category": "water",
        "category_label": "Water Supply & Drainage",
        "dept": "Water Supply Department",
        "match": ["water", "leak", "pipe", "drain", "sewage", "paani", "nalla", "contamination", "pipeline"],
        "issue": "Water Pipeline Leakage",
        "priority": "high",
    },
    {
        "category": "roads",
        "category_label": "Roads & Infrastructure",
        "dept": "Public Works Department (PWD)",
        "match": ["pothole", "road", "crack", "asphalt", "bridge", "rasta", "gaddha", "pavement"],
        "issue": "Road Damage & Potholes",
        "priority": "medium",
    },
    {
        "category": "electricity",
        "category_label": "Electricity & Street Lighting",
        "dept": "Electrical & Street Lighting Dept",
        "match": ["light", "street light", "wire", "power", "blackout", "bijli", "transformer", "pole"],
        "issue": "Streetlight Malfunction",
        "priority": "medium",
    },
    {
        "category": "safety",
        "category_label": "Public Safety & Hazards",
        "dept": "Disaster Management & Safety",
        "match": ["hazard", "tree", "fire", "danger", "accident", "open manhole", "khantara"],
        "issue": "Hazardous Condition",
        "priority": "high",
    },
]

PRIORITY_RANK: dict[str, int] = {"low": 1, "medium": 2, "high": 3, "critical": 4}
URGENCY_WORDS: list[str] = ["urgent", "emergency", "immediately", "critical", "danger", "fire", "accident", "turant"]


def detect_language(text: str) -> str:
    if any("\u0900" <= char <= "\u097F" for char in text):
        if any(word in text.lower() for word in ["आहे", "नाही", "रस्ता", "पाणी"]):
            return "Marathi"
        return "Hindi"
    return "English"


def analyze_text_service(text: str, location: str | None = None) -> TextAnalysisResponse:
    text_lower = text.lower()
    matched_rule: dict[str, Any] | None = None
    matched_keywords: list[str] = []

    for rule in AI_RULES:
        keywords: list[str] = rule["match"]
        matches = [kw for kw in keywords if kw in text_lower]
        if matches:
            matched_rule = rule
            matched_keywords = matches[:3]
            break

    if not matched_rule:
        matched_rule = {
            "category": "infrastructure",
            "category_label": "General Infrastructure",
            "dept": "Urban Development",
            "issue": "Civic Issue Reported",
            "priority": "medium",
        }

    category_val = str(matched_rule["category"])
    category_label_val = str(matched_rule["category_label"])
    issue_val = str(matched_rule["issue"])
    dept_val = str(matched_rule["dept"])
    base_priority = str(matched_rule["priority"])

    is_urgent = any(word in text_lower for word in URGENCY_WORDS)
    priority = "critical" if is_urgent and base_priority == "high" else ("high" if is_urgent else base_priority)

    confidence = min(0.85 + len(text) / 2000.0, 0.98)

    return TextAnalysisResponse(
        category=category_val,
        category_label=category_label_val,
        issue=issue_val,
        priority=priority,
        priority_rank=PRIORITY_RANK.get(priority, 2),
        department=dept_val,
        confidence=round(confidence, 2),
        language=detect_language(text),
        location=location,
        summary=f"Automated AI classification: {issue_val} reported in {dept_val}.",
        escalated=is_urgent,
        matched_keywords=matched_keywords,
    )


def analyze_image_service(
    image_data: str,
    mime_type: str = "image/jpeg",
    selected_category: str | None = None,
) -> ImageAnalysisResponse:
    """Analyze an uploaded image using Google Gemini Vision API."""
    from app.core.config import get_settings

    settings = get_settings()
    api_key = settings.gemini_api_key

    if not api_key:
        return ImageAnalysisResponse(
            is_civic_issue=False,
            is_relevant=False,
            category="unknown",
            category_label="Unknown",
            issue="API key not configured",
            description="Image analysis is unavailable. GEMINI_API_KEY is not set in backend/.env.",
            confidence=0.0,
            severity=None,
            department="Unknown",
            suggested_priority="medium",
            tags=[],
            reason="GEMINI_API_KEY is not configured on the server.",
        )

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        category_hint = (
            f'The user pre-selected the category "{selected_category}". '
            "Check if the image matches. If it's a completely different civic "
            "issue, set is_relevant to false."
            if selected_category
            else ""
        )

        prompt = f"""Analyze this image for civic/municipal issues (pothole, garbage, water leakage, broken streetlight, drainage, road damage, etc.).

If it is NOT a civic issue (movie poster, selfie, advertisement, landscape without issues), set is_civic_issue to false.
{category_hint}

Return a VALID JSON object strictly in this format:
{{
  "is_civic_issue": true/false,
  "is_relevant": true/false,
  "category": "e.g. roads, water, sanitation, electricity, safety, drainage, infrastructure",
  "category_label": "e.g. Roads & Infrastructure, Water Supply & Drainage",
  "issue": "Short issue title, e.g. Deep Pothole Detected",
  "description": "Detailed 2-3 sentence description of what the image shows as a civic complaint. Write it as if a citizen is reporting it. Example: A large pothole approximately 2 feet wide is visible on the road surface near a residential area. The pothole appears deep enough to cause damage to vehicles and poses a safety risk to two-wheelers. Water accumulation is visible inside the pothole.",
  "confidence": 0.0 to 1.0,
  "severity": "Low/Medium/High/Critical",
  "department": "e.g. Public Works Department, Water Supply Department",
  "suggested_priority": "low/medium/high/critical",
  "tags": ["tag1", "tag2"],
  "reason": "Brief explanation of the classification"
}}"""

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_data,
                            }
                        },
                    ],
                }
            ],
            config={"response_mime_type": "application/json"},
        )

        import json

        raw_text = response.text.strip()
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.lstrip("`").removeprefix("json").strip()
            if raw_text.endswith("```"):
                raw_text = raw_text[: -3].strip()

        parsed = json.loads(raw_text)

        return ImageAnalysisResponse(
            is_civic_issue=bool(parsed.get("is_civic_issue", False)),
            is_relevant=bool(parsed.get("is_relevant", False)),
            category=str(parsed.get("category", "infrastructure")),
            category_label=str(parsed.get("category_label", "General Infrastructure")),
            issue=str(parsed.get("issue", "Civic Issue Detected")),
            description=str(parsed.get("description", "Civic issue detected in the uploaded image.")),
            confidence=float(parsed.get("confidence", 0.85)),
            severity=parsed.get("severity"),
            department=str(parsed.get("department", "Urban Development")),
            suggested_priority=str(parsed.get("suggested_priority", "medium")),
            tags=list(parsed.get("tags", [])),
            reason=parsed.get("reason"),
        )

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return ImageAnalysisResponse(
            is_civic_issue=False,
            is_relevant=False,
            category="unknown",
            category_label="Unknown",
            issue="Analysis failed",
            description=f"Image analysis failed: {exc}",
            confidence=0.0,
            severity=None,
            department="Unknown",
            suggested_priority="medium",
            tags=[],
            reason=f"Error during analysis: {exc}",
        )


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_complaint_clusters_service(db: Session) -> list[ComplaintCluster]:
    complaints = db.query(Complaint).all()
    if not complaints:
        return []

    groups: dict[tuple[str, str], list[Complaint]] = defaultdict(list)
    for c in complaints:
        cat_str = str(c.category)
        loc_str = str(c.location).strip().lower()
        groups[(cat_str, loc_str)].append(c)

    clusters: list[ComplaintCluster] = []
    cluster_seq = 1

    for (cat, loc), items in groups.items():
        if len(items) >= 1:
            highest_prio = max(items, key=lambda x: PRIORITY_RANK.get(str(x.priority), 1)).priority
            clusters.append(
                ComplaintCluster(
                    cluster_id=f"CLUST-{cluster_seq:03d}",
                    title=f"{len(items)} reports: {items[0].title}",
                    category=cat,
                    department=str(items[0].department),
                    location=str(items[0].location),
                    complaint_count=len(items),
                    complaint_ids=[str(i.id) for i in items],
                    highest_priority=str(highest_prio),
                )
            )
            cluster_seq += 1

    return sorted(clusters, key=lambda x: x.complaint_count, reverse=True)

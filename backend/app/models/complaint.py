from sqlalchemy import BigInteger, Boolean, Column, DateTime, Float, ForeignKey, Text

from app.core.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=True)
    citizen_name = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    category_label = Column(Text, nullable=True)
    department = Column(Text, nullable=False)
    priority = Column(Text, nullable=False, default="medium")
    status = Column(Text, nullable=False, default="registered")
    location = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(Text, nullable=True)
    is_voice = Column(Boolean, default=False)
    voice_transcript = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=0.8)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    resolution_note = Column(Text, nullable=True)
    resolution_image_url = Column(Text, nullable=True)
    assigned_officer = Column(Text, nullable=True)


class ComplaintTimeline(Base):
    __tablename__ = "complaint_timeline"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    complaint_id = Column(
        Text,
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    actor = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.feedback.models import FeedbackStatus


class FeedbackRequest(BaseModel):
    page_url: str = Field(max_length=500)
    message: str = Field(min_length=1, max_length=5000)
    honeypot: str = Field(default="")


class FeedbackResponse(BaseModel):
    ok: bool


class FeedbackReportAdmin(BaseModel):
    id: UUID
    page_url: str
    message: str
    ip_hash: str
    user_agent: str | None
    status: FeedbackStatus
    submitted_at: datetime

    model_config = {"from_attributes": True}


class FeedbackStatusUpdate(BaseModel):
    status: FeedbackStatus


class FeedbackListResponse(BaseModel):
    items: list[FeedbackReportAdmin]
    total: int
    page: int
    per_page: int

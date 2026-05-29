from pydantic import BaseModel, Field


class PageviewRequest(BaseModel):
    path: str = Field(max_length=500)
    referrer: str | None = Field(default=None, max_length=500)
    session_id: str | None = Field(default=None, min_length=16, max_length=16)


class PageviewResponse(BaseModel):
    ok: bool


class TopPage(BaseModel):
    path: str
    views: int


class DailyViews(BaseModel):
    date: str
    views: int


class PageviewStats(BaseModel):
    top_pages: list[TopPage]
    daily: list[DailyViews]

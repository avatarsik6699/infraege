"""Aggregator for all v1 module routers. Imported once by `app.main`."""

from fastapi import APIRouter

from app.api.v1.admin.analytics import router as admin_analytics_router
from app.api.v1.admin.feedback import router as admin_feedback_router
from app.api.v1.public.events import router as events_router
from app.core.constants import API_V1_PREFIX
from app.modules.auth.api import router as auth_router
from app.modules.feedback.api import router as feedback_router
from app.modules.health.api import router as health_router
from app.modules.tasks.api import router as tasks_router
from app.modules.users.api import router as progress_router

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(progress_router)
api_v1_router.include_router(feedback_router)
api_v1_router.include_router(admin_feedback_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(admin_analytics_router)

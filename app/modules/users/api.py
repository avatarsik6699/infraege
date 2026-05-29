from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import get_current_user
from app.modules.users.dependencies import get_progress_service
from app.modules.users.models import User
from app.modules.users.schemas import ProfileMe, ProgressSyncRequest, ProgressSyncResponse
from app.modules.users.service import ProgressService

router = APIRouter(prefix="/public/progress", tags=["progress"])


@router.post(
    "/sync",
    response_model=ProgressSyncResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_progress(
    body: ProgressSyncRequest,
    current_user: User = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
) -> ProgressSyncResponse:
    return await service.sync(current_user.id, body)


@router.get("/me", response_model=ProfileMe)
async def get_progress_me(
    current_user: User = Depends(get_current_user),
    service: ProgressService = Depends(get_progress_service),
) -> ProfileMe:
    return await service.get_profile_me(current_user.id)

from app.seeders.base import BaseSeeder
from app.seeders.feedback import FeedbackSeeder
from app.seeders.users import UserSeeder

# Execution order matters: users must exist before feedback (no FK, but logical dependency).
ALL_SEEDERS: list[type[BaseSeeder]] = [UserSeeder, FeedbackSeeder]
REFERENCE_SEEDERS: list[str] = ["users", "feedback"]

__all__ = ["ALL_SEEDERS", "BaseSeeder", "FeedbackSeeder", "REFERENCE_SEEDERS", "UserSeeder"]

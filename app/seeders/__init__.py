from app.seeders.base import BaseSeeder

# Register project seeders here. The list order is the execution order.
ALL_SEEDERS: list[type[BaseSeeder]] = []
REFERENCE_SEEDERS: list[str] = []

__all__ = ["ALL_SEEDERS", "BaseSeeder", "REFERENCE_SEEDERS"]

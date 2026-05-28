{
  "_meta": {
    "format": "SDD CONTEXT.md — Single Source of Truth for AI agent",
    "update_rule": "Append contracts after each phase via /context-update. Never remove existing entries."
  },

  "captured_at": "2026-05-28",
  "phase_completed": "01",
  "phase_in_progress": "02",

  "product": {
    "name": "infraege",
    "production_domain": "infraege.ru",
    "spec_version": "v2.1",
    "status": "phase_01_complete"
  },

  "stack": {
    "summary": "See docs/STACK.md for the full set of technologies and version pins."
  },

  "core_models": [
    "users",
    "UserRole",
    "User",
    "AuthUser",
    "AuthTokens",
    "RegisterRequest",
    "LoginRequest",
    "HealthResponse"
  ],

  "planned_contract": {
    "core_models": [
      "tasks",
      "practice_items",
      "users",
      "user_attempts",
      "feedback_reports"
    ],
    "content_source": {
      "task_files": "content/tasks/ege-01.md through content/tasks/ege-27.md",
      "asset_dirs": "content/assets/<task-slug>/",
      "source_of_truth": "repository Markdown/frontmatter and local assets",
      "seed_policy": "dev/test fixtures only; not production content source"
    },
    "content_tooling": {
      "check": "uv run python -m app.content check",
      "import": "uv run python -m app.content import",
      "http_import_endpoint": "out_of_scope_for_mvp"
    },
    "notes": "MVP is task-first; no required backend topics table."
  },

  "endpoints_active": [
    {
      "method": "GET",
      "path": "/api/v1/health",
      "auth": "none",
      "contract": "Health status and database connectivity."
    },
    {
      "method": "POST",
      "path": "/api/v1/public/auth/register",
      "auth": "none",
      "contract": "Email, password, consent_152fz=true; returns tokens and user."
    },
    {
      "method": "POST",
      "path": "/api/v1/public/auth/login",
      "auth": "none",
      "contract": "Email/password login; returns tokens and user."
    },
    {
      "method": "POST",
      "path": "/api/v1/public/auth/refresh",
      "auth": "refresh_token",
      "contract": "Returns a new access token."
    },
    {
      "method": "POST",
      "path": "/api/v1/public/auth/logout",
      "auth": "user",
      "contract": "Stateless logout response."
    },
    {
      "method": "GET",
      "path": "/api/v1/public/auth/me",
      "auth": "user",
      "contract": "Current public user profile."
    }
  ],

  "db_schema": {
    "tables": [
      {
        "name": "users",
        "columns": [
          "id UUID PRIMARY KEY",
          "email CITEXT UNIQUE NOT NULL",
          "hashed_password VARCHAR(100) NOT NULL",
          "role user_role NOT NULL DEFAULT 'user'",
          "consent_152fz BOOLEAN NOT NULL DEFAULT false",
          "consent_at TIMESTAMPTZ",
          "is_active BOOLEAN NOT NULL DEFAULT true",
          "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
          "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()"
        ],
        "notes": "Requires PostgreSQL citext extension and user_role enum with user/admin values."
      }
    ],
    "source": "alembic",
    "current_head": "0001_users_table"
  },

  "ui_pages_active": [
    "/",
    "/topics",
    "/tasks/:slug",
    "/practice/:id",
    "/login",
    "/register",
    "/profile",
    "/privacy",
    "/terms",
    "/admin/feedback"
  ],

  "env_config": {
    "keys": [
      "DATABASE_URL",
      "POSTGRES_USER",
      "POSTGRES_PASSWORD",
      "POSTGRES_DB",
      "REDIS_URL",
      "SECRET_KEY",
      "ALGORITHM",
      "ACCESS_TOKEN_EXPIRE_MINUTES",
      "REFRESH_TOKEN_EXPIRE_DAYS",
      "CORS_ORIGINS",
      "APP_ENV",
      "LOG_LEVEL",
      "AUTH_RATE_LIMIT",
      "API_BASE_URL",
      "API_BASE_INTERNAL_URL",
      "VITE_API_BASE_URL",
      "VITE_PUBLIC_SITE_URL",
      "VITE_PUBLIC_APP_NAME"
    ]
  },

  "db_seeds": {},

  "notes": "Phase 01 complete. Added runnable foundation, health endpoint, auth shell, users persistence, route placeholders, design tokens, Docker Compose development stack, and Phase 01 environment contract."
}

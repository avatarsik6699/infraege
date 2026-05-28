{
  "_meta": {
    "format": "SDD CONTEXT.md — Single Source of Truth for AI agent",
    "update_rule": "Append contracts after each phase via /context-update. Never remove existing entries."
  },

  "captured_at": "2026-05-29",
  "phase_completed": "04",
  "phase_in_progress": null,

  "product": {
    "name": "infraege",
    "production_domain": "infraege.ru",
    "spec_version": "v2.1",
    "status": "phase_04_complete"
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
    "HealthResponse",
    "tasks",
    "practice_items",
    "TaskDifficulty",
    "ContentStatus",
    "Task",
    "PracticeItem",
    "CodeBlock",
    "AssetManifestItem",
    "ContentTaskDocument",
    "ContentValidationError",
    "PublicTaskSummary",
    "PublicTaskDetail",
    "TheoryTocItem",
    "PublicPracticePreview",
    "CatalogFilters",
    "PublicPracticeItem",
    "PracticeValidationRequest",
    "PracticeValidationResponse",
    "GuestProgressAttempt",
    "GuestProgressState",
    "PracticeTrainerState"
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
    },
    {
      "method": "GET",
      "path": "/api/v1/public/tasks",
      "auth": "none",
      "contract": "Published-only 27-task public catalog with optional search and difficulty filters; response excludes answer internals."
    },
    {
      "method": "GET",
      "path": "/api/v1/public/tasks/{slug}",
      "auth": "none",
      "contract": "Published-only public task theory detail with metadata, TOC, asset manifest, and practice CTA preview data; response excludes expected_value, answer patterns, validation results, and draft tasks."
    },
    {
      "method": "GET",
      "path": "/api/v1/public/practice/{task_id}",
      "auth": "none",
      "contract": "Published-only practice items for a task without expected_value internals; draft tasks return 404."
    },
    {
      "method": "POST",
      "path": "/api/v1/public/validate",
      "auth": "none",
      "contract": "{item_id, answer} -> {correct, expected_value?, explanation_html?}; input length capped, regex execution hard-timeout, no raw answers logged."
    }
  ],

  "cli_contracts_active": [
    {
      "command": "uv run python -m app.content check",
      "contract": "Dry-run validation of repository-authored content without database writes."
    },
    {
      "command": "uv run python -m app.content import",
      "contract": "Validate, render, sanitize, prepare assets, and upsert task/practice content into the database."
    }
  ],

  "content_source_active": {
    "task_files": "content/tasks/ege-01.md through content/tasks/ege-27.md",
    "asset_dirs": "content/assets/ege-01/ through content/assets/ege-27/",
    "source_of_truth": "repository Markdown/frontmatter and local assets",
    "validation_errors": "Content validation errors include source file path and field path."
  },

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
      },
      {
        "name": "tasks",
        "columns": [
          "id UUID PRIMARY KEY",
          "ege_number SMALLINT UNIQUE NOT NULL",
          "slug VARCHAR(120) UNIQUE NOT NULL",
          "title VARCHAR(200) NOT NULL",
          "summary TEXT",
          "difficulty task_difficulty NOT NULL",
          "estimated_minutes SMALLINT",
          "theory_html TEXT NOT NULL",
          "theory_toc JSONB NOT NULL DEFAULT '[]'",
          "asset_manifest JSONB NOT NULL DEFAULT '[]'",
          "metadata JSONB NOT NULL DEFAULT '{}'",
          "status content_status NOT NULL DEFAULT 'draft'",
          "source_path VARCHAR(300) NOT NULL",
          "source_hash CHAR(64) NOT NULL",
          "published_at TIMESTAMPTZ",
          "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
          "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()"
        ],
        "notes": "Requires task_difficulty enum with basic/medium/high values and content_status enum with draft/published values."
      },
      {
        "name": "practice_items",
        "columns": [
          "id UUID PRIMARY KEY",
          "task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE",
          "source_key VARCHAR(80) NOT NULL",
          "position SMALLINT NOT NULL DEFAULT 0",
          "year SMALLINT",
          "prompt_html TEXT NOT NULL",
          "code_block JSONB",
          "answer_pattern VARCHAR(200) NOT NULL",
          "expected_value VARCHAR(80) NOT NULL",
          "explanation_html TEXT",
          "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
          "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
          "UNIQUE(task_id, source_key)"
        ],
        "notes": "Practice rows are imported from repository frontmatter and cascade when their parent task is deleted."
      }
    ],
    "source": "alembic",
    "current_head": "0002_content_model"
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

  "notes": "Phase 04 complete. Added public practice read and validation endpoints, client-side practice trainer with guest progress localStorage store."
}

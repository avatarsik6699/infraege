{
  "_meta": {
    "format": "SDD CONTEXT.md — Single Source of Truth for AI agent",
    "update_rule": "Append contracts after each phase via /context-update. Never remove existing entries."
  },

  "captured_at": "2026-05-28",
  "phase_completed": null,
  "phase_in_progress": null,

  "product": {
    "name": "infraege",
    "production_domain": "infraege.ru",
    "spec_version": "v2.1",
    "status": "specified_not_implemented"
  },

  "stack": {
    "summary": "See docs/STACK.md for the full set of technologies and version pins."
  },

  "core_models": [],

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

  "endpoints_active": [],

  "db_schema": {
    "tables": [],
    "source": null,
    "current_head": null
  },

  "ui_pages_active": [],

  "env_config": {
    "keys": []
  },

  "db_seeds": {},

  "notes": "SPEC.md v2.1 defines infraege with task-first content authoring; no implementation phases have completed yet. Run /context-update N after each phase is completed."
}

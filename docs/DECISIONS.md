# Decisions Log (ADRs)

> Architectural decisions for this project. Lightweight ADR format — capture the trade-off,
> not implementation detail. Newest entry on top.

---

### 2026-05-28 — Task-first repository content authoring

**Status**: accepted
**Context**: The MVP needs a practical content workflow without building a CMS. The human author will write theory, tasks, and assets locally, while agents implement tooling and validation.
**Decision**: Production content source of truth is one Markdown/frontmatter file per EGE task under `content/tasks/ege-01.md` through `ege-27.md`, with local assets under `content/assets/<task-slug>/`. The backend MVP uses task-first models and does not require a `topics` table. Content import is CLI-first via `content check` and `content import`; HTTP import and preview UI/API are out of MVP.
**Alternatives considered**: A full admin CMS would increase MVP scope; separate theory/practice files would add synchronization overhead; keeping `topics` as a backend entity would duplicate the fixed 27-task EGE structure.
**Consequences**: Phase 02 must implement content schema validation, deterministic import, asset preparation, and clear authoring errors before public catalog/theory work begins.

### 2026-05-28 — infraege MVP contract

**Status**: accepted
**Context**: The repository still had a Template App SPEC while product references and prior planning described an EGE computer science preparation application.
**Decision**: The product is `infraege` on `infraege.ru`. MVP is guest-first, includes a 27-task EGE catalog model, uses repository-authored content, ships auth without email verification, and defers password reset plus full content CRUD backoffice. Content authoring details are amended by the task-first repository content ADR above.
**Alternatives considered**: Keeping the old Template App placeholder would leave phases unusable; restoring the old full CMS-heavy spec would exceed the requested MVP and conflict with the chosen seed/Markdown content workflow.
**Consequences**: Future phases must be initialized from the new product SPEC and must treat `tmp/design-system-spec.md` plus `docs/assets` as design contract inputs.

<!--
### [YYYY-MM-DD] — [Short title]

**Status**: proposed | accepted | superseded | deprecated
**Context**: [What forced the decision? What constraints applied?]
**Decision**: [What was decided?]
**Alternatives considered**: [What else was on the table and why it was rejected?]
**Consequences**: [What changes because of this — good and bad?]
**Links**: [optional — PR, issue, external reference]
-->

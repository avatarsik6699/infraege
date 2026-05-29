# PHASE 07 — Agent Execution Memory

<!--
  WHAT to build -> docs/PHASE_07.md
  HOW it was built -> this file

  This file is agent-owned execution memory. It is not intended for human review or manual edits.
  The agent updates it during /impl-assist and /impl-review-notes so future sessions can resume
  without reconstructing context from chat history.

  Sync rule: task IDs (B1, F1, I1, D1, T1) must match the Scope checklist in PHASE_07.md.
  To mark a removed task: prefix its heading with ~~, e.g. ## ~~I4~~ (removed). Do not delete
  historical execution memory unless the phase file explicitly removes the task.
-->

_Phase:_ `07` · _Generated:_ `2026-05-29`

---

## B1 — verify and harden request ID propagation and sensitive value scrubbing in middleware

**Status:** open
**Depends on:** —

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## B2 — add GET /api/v1/health/detailed endpoint (admin) with DB, Redis, disk metrics

**Status:** open
**Depends on:** B1

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## B3 — add POST /events/pageview and GET /admin/analytics/pageviews with page_events table

**Status:** open
**Depends on:** —

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## F1 — inject inline analytics client script in root.tsx firing events to POST /events/pageview

**Status:** open
**Depends on:** B3

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## F2 — admin status page /admin/status polling GET /api/v1/health/detailed

**Status:** open
**Depends on:** B2

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## F3 — admin analytics page /admin/analytics showing page view stats

**Status:** open
**Depends on:** B3

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## I1 — finalize nginx/nginx.conf: domain substitution, HSTS, CSP directives

**Status:** open
**Depends on:** —

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## I2 — verify long-lived cache headers for hashed static assets in nginx/nginx.conf

**Status:** open
**Depends on:** I1

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## I3 — finalize docker-compose.prod.yml and scripts/setup-prod.sh

**Status:** open
**Depends on:** I1

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## ~~I4~~ (removed, deferred — daily encrypted backup job → future phase)

---

## ~~I5~~ (removed, deferred — restore drill → future phase)

---

## I6 — wire up Gatus dashboard-only monitoring via docker-compose.monitoring.yml

**Status:** open
**Depends on:** I3

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## I7 — host security hardening: finalize fail2ban config, UFW rules, SSH hardening docs

**Status:** open
**Depends on:** I3

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

## T1 — verify and update docs/production-runbook.md for revised Phase 07 scope

**Status:** open
**Depends on:** I6, I7

### Contract Snapshot

### Exploration

### Plan

### Implementation Log

### Verification

### Residual Risks

None

---

<!-- /impl-review-notes appends this section when Architect Review Notes need fixes.

## Review Notes Fixes

### R1 — short note title

**Status:** open
**Source:** `docs/PHASE_07.md` § Architect Review Notes

#### Source Note

#### Safety Check

#### Exploration

#### Plan

#### Implementation Log

#### Verification

#### Residual Risks
-->

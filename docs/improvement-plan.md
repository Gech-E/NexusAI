# LMS improvement plan — October 2026

## Implemented

- Self-service registration restricted to student roles. Assign teachers/admins through authenticated admin role management; initial admin must be provisioned securely by an operator.
- Quiz answer-key detail, result lists and quiz deletion restricted to administrators and creator teachers.
- Reject default JWT secret outside development; reject malformed token subjects with HTTP 401.
- Sync requests validate bounded batches and consistent device/record schema. Frontend now sends compatible payloads.
- CI runs backend pytest and Python compile checks plus frontend typechecking, ESLint and production build.

## Critical outstanding work

**Offline sync only writes audit logs: it does not apply domain mutations.** This is not yet a functioning offline quiz submission solution. There is no reliable offline quiz-queue writer. The queue uses global localStorage, not per-user IndexedDB. Add user partitioning, durable event IDs, database uniqueness constraints and transactional domain updates before advertising offline assessments.

**Security:** audit all remaining cross-school data access, student attempts, quiz listings, courses, teacher analytics, AI tutor, proctoring WebSockets, and CV privacy/consent. Add migrations, rate limits, secrets management and secure administrator bootstrap before production use.

**Student features:** cached lessons, resumable drafts, progress tracking, accessibility, multilingual and low-bandwidth assets.

**Teacher features:** verified onboarding, classroom roster, assessment review, interventions, institution-scoped permissions.

**Reliability:** Alembic migrations, integration and end-to-end tests, background job observability, backups, staging deployments, and AI-quality evaluations.

## Target architecture

Next.js UI / per-user IndexedDB + service worker → typed API client → FastAPI authentication + tenant policy → modular course/quiz/sync services → PostgreSQL. Redis/Celery runs slow background tasks. AI inference and consent-based exam monitoring run in isolated services. Sync uses transactional idempotent events, version numbers, and conflict resolution.

## Validation commands

Backend: cd backend && pip install -r requirements.txt && pytest -q tests

Frontend: cd frontend && npm ci && npm run typecheck && npm run lint && npm run build

Run the checks before merging; this change set is not a production readiness certification.

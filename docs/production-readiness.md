# Production launch gate for NexusAI

**Status: NOT production certified.** This project is still under active security and systems development. A green build is necessary but not sufficient for launch with actual students.

## Required before real institutions use it

- [ ] Enforce school and teacher ownership for **every** API and WebSocket including analytics, AI transcripts, recommendations, exam results and administrative actions. Add negative cross-tenant integration tests.
- [ ] Implement database schema migrations (Alembic) and test forward/backward changes against real PostgreSQL with backups and recovery.
- [ ] Replace the logging-only offline-sync API with typed, transactional domain event handlers, unique event IDs, conflict policy, retry protocol and user-scoped encrypted IndexedDB. Current browser queues do not make quizzes truly offline.
- [ ] Secure browser sessions: rotate refresh credentials safely across tabs, avoid long-lived refresh tokens in localStorage, add logout/revocation, MFA for staff, audit events and IP/account throttling.
- [ ] Obtain informed consent and child-data policy review before enabling CV monitoring; never infer cheating automatically from gaze alone. Current CV WebSocket is authenticated but does not actually run proctoring inference.
- [ ] Add school onboarding, invitation-based teacher registration, and administrators scoped to each school. Platform admin should be rare.
- [ ] Ensure quizzes cannot leak answer keys or classmates' results through ancillary analytics or caching.
- [ ] Remove all fake KPI charts from student, teacher and admin pages, or prominently label them as demonstration data.
- [ ] Introduce service-worker/offline curriculum packs and mobile/keyboard/screen-reader e2e verification with slow network emulation.
- [ ] Configure TLS, CORS origins, PostgreSQL credentials, Redis auth, JWT secret, secrets vault, safe log redaction, S3-compatible storage and rate limits.
- [ ] Configure multi-worker load tests for login, quiz submissions and sync with realistic data; verify indexes, DB pooling and autoscaling thresholds.
- [ ] Enable protected main branch, review requirements, vulnerability scanning, dependency updates, observability, backups and an incident runbook.
- [ ] Obtain privacy/legal review appropriate for minors and relevant regions, including data retention/export/deletion procedures.

## Currently improved on draft PR #2

Student dashboard has course-first responsive UX with real enrollment counts and quiz metrics. Registration chooses an existing school, the exam builder uses authorized school IDs, teachers promoted by an administrator are linked to their school, and the platform-admin bootstrap is a server-only CLI. Course and assessment listings are scoped by school; quizzes require their teacher owner or admin for answer key/results/deletion. JWT and offline-sync input validation were strengthened. The CV notification WebSocket now authenticates callers and does not fabricate alerts.

## Validation and rollout procedure

1. Merge only after all PR checks pass and reviewers check security and API behavior.
2. Provision a staging PostgreSQL database and explicit secrets. Run database migrations and seed school records through authorized admin workflows.
3. Run `cd backend && python -m pytest -q tests` and frontend `npm ci && npm run typecheck && npm run lint && npm run build`.
4. Build isolated frontend/backend images, deploy to staging, exercise registration, administrator provisioning, teacher promotion, course enrollment, quiz creation/submission, analytics, offline/online switching and revocation.
5. Run negative cross-tenant tests and a load test before gradually onboarding pilot users.
6. Capture performance/error/availability signals and create a rollback path.

For the initial platform administrator, `cd backend && python -m scripts.bootstrap_admin` is available. Do not run it in public web code and do not set weak passwords.

No production go-live claim should be made until the checklist is complete.

## October 18 subsequent changes

- Teacher analytics and student roster queries have been replaced with school-scoped versions; legacy cross-school aggregates have been removed from those routes. Integration tests across two or more schools remain required.
- Learners can save an authorized course description/syllabus to user-partitioned IndexedDB and load saved course text when disconnected. Downloaded content does not yet include videos, full lesson media, or service-worker-powered offline navigation.
- The quiz screen caches a started attempt and queues answers in IndexedDB when offline. A reconnect sends its original server-issued attempt ID; the server locks the attempt and handles exact repeated submissions without issuing a new result. Multiple devices and assessment snapshot validity require further tests.
- Quiz creation rejects a course ID belonging to another school.
- These changes are in a draft PR; do not claim them production-ready until tenant isolation, end-to-end offline tests, accessibility checks, and deployment security review pass.

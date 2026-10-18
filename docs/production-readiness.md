# NexusAI production release review — 2026-10-18

**Decision: NO-GO for real student and school data.** This draft branch contains
substantial security and reliability improvements and passing CI, but still
needs deployment credentials, a database migration baseline and field
validation. A successful build or preview is not a security certification.

## Implemented in draft PR #2

- School-scoped course, quiz, offline pack, roster and teacher analytics access;
  answer keys and results require teacher ownership or platform-admin access.
- Student sign-up requires a signed email-bound, seven-day school invitation.
  Platform admins can issue it via `POST /api/v1/admin/invitations`. Self-service
  school admission is disabled by default. Role promotion remains admin-only.
- AI conversation IDs are owner-validated at the endpoint and at the message
  persistence layer. Global AI stats and unscoped narratives are admin-only.
- JWT deployment secrets are checked, refresh rotation uses a row lock and
  subject verification, and users can revoke a refresh credential at logout.
- Offline courses store permitted syllabus text in user-scoped IndexedDB.
  Existing, server-issued quiz attempts may be submitted after reconnecting;
  submitting the same answers again is idempotent.
- Bulk sync now supports only validated `course_progress` events, checks
  enrollment ownership, applies changes to domain tables and keeps the
  higher course completion percentage when an older device reconnects.
  Unsupported event types fail instead of being falsely marked synced.
- Modernized student dashboard and clearer onboarding, navigation and
  reduced-motion accessibility.
- Backend container uses Python 3.12 and runs without root; frontend uses
  a non-root user, npm ci and same-origin API routing. Internal ports are
  not published by Compose. Production API docs and Prometheus endpoint
  are disabled and a database readiness route is available.
- Automated tests cover distinct schools, protected answer keys, AI authorization,
  student roster scoping, invitations required, progress sync and quiz retries.

## Blocking go-live tasks

1. **Database migrations (P0).** The production lifespan intentionally does not
   create tables. There is no reviewed initial Alembic migration chain. Create
   a reproducible baseline and rehearse migrations against a PostgreSQL copy
   with rollback/backup before using a live database.
2. **Sessions and account safety (P0).** Browser auth still stores access and
   refresh tokens in localStorage. Replace refresh token storage with Secure,
   HttpOnly, SameSite cookies and CSRF protection; deploy MFA/SSO for staff,
   signup invitation revocation and account-level brute-force protection.
3. **Institution authorization (P0).** Negative tests cover core learning
   endpoints but are not an exhaustive audit of analytics, proctoring,
   recommendation services, every administrative route or background job.
   Remove shared-scope queries and test all cross-school access paths.
4. **Durable offline-first design (P0).** IndexedDB is only a first layer.
   Add a service worker/app shell, full lesson asset downloads, explicit cache
   eviction, encrypted storage/retention for shared devices, replay/conflict
   tests under concurrent clients, offline logout cleanup and queue diagnostics.
   Bulk sync supports course progress only; other event types are rejected.
5. **Reliable scaling (P0).** Current proctoring WebSocket manager is in-memory,
   so it does not broadcast across multiple replicas. Redis message fanout,
   a task queue, indexes, capacity/load tests, timeouts and resource limits
   are required before horizontal scale.
6. **Safety and privacy (P0).** Complete a child-data and exam-monitoring
   impact review, retention/export/deletion policies, educator approvals and
   human-review safeguards. Gaze alerts must never be treated as proof of cheating.
7. **Operations (P0).** Configure HTTPS ingress, DNS, managed PostgreSQL with
   backups/restore drills, authenticated Redis, secrets management, access logs,
   audit logging, alerts, staging, image scanning, dependency updates,
   disaster recovery and an on-call incident/rollback procedure.
8. **User acceptance (P1).** Test accessibility with keyboard/screen reader,
   low-bandwidth devices, multilingual lessons and teacher and student
   onboarding in the target schools, including exam recovery on spotty networks.

## Staging setup, not a public production deployment

The Compose example now publishes Nginx only on loopback port 8080.
A trusted separate HTTPS gateway must terminate TLS and forward requests.
Set `PUBLIC_ORIGIN=https://your-domain`, a random 32+-character
`JWT_SECRET_KEY`, `POSTGRES_PASSWORD`, and `GRAFANA_PASSWORD` in a
private Docker environment file, never in Git. Do **not** expose database,
Redis or application container ports directly on the internet.
Environment variables must be supplied before starting services; browser
API requests use the same public origin through Nginx.

The initial schema migration prerequisite means startup is **not a complete
one-command production install**. Provision the database and an operator-only
administrator carefully. Use `python -m scripts.bootstrap_admin` in the
backend container only after a database schema exists; keep admin credentials
outside logs and source control.

Useful pre-release verification:

- `cd backend && python -m pytest -q tests`
- `cd frontend && npm ci && npm run typecheck && npm run lint && npm run build`
- Test `/api/v1/health/ready` through the staging ingress.
- Test two-school isolation, invited student signup, account revocation,
  interrupted quiz submission, reconnection, course progress conflict,
  backups, and database failover on staging PostgreSQL.
- Load-test login, quiz submission and sync with realistic expected concurrency.
- Recheck the *latest PR head* GitHub Actions before a security review and merge.

## Engineering decision

Keep pull request #2 in draft. Enforce branch protection and independent
review. Production launch is an operator sign-off after remaining P0 items
have been implemented and verified; do not claim readiness solely from CI.

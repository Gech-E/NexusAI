# NexusAI API on Render

## Status
This configuration is a production **foundation** and requires staging verification and review before handling real student data. For this portfolio demo, use Render's free web and PostgreSQL plans. Free services may sleep when idle, and free PostgreSQL plans have lifecycle and retention limitations. They are unsuitable for real student records. Review Render's current free-plan terms before relying on this database.

## Setup
1. Review this pull request and merge to main after CI passes. Render builds from `backend/` and starts Uvicorn on Render's `PORT`.
2. In Render, create a Blueprint from `render.yaml`, or create the free web service and free Postgres database separately. Set auto deploy off until tested. Use the backend as a private data-processing system with student-data controls.
3. Set `CORS_ORIGINS` to the exact HTTPS origin(s), e.g. `https://nexus-ai-omega-ten.vercel.app` (comma-separated, no paths). Use the generated JWT secret and managed internal PostgreSQL URL.
4. The demo's startup command runs `alembic upgrade head` because free services cannot use a pre-deploy command. **The initial schema migration refuses a nonempty database.** For existing data, first back up and reconcile the current schema with a reviewed migration; never erase it.
5. Verify `https://<render-host>/api/v1/health` and `/api/v1/health/ready`, and test authentication/tenant boundaries from your Vercel frontend.
6. Set the frontend Vercel `NEXT_PUBLIC_API_URL` to the public HTTPS Render API URL and **redeploy frontend**. Without this variable, the browser sends `/api/v1` to the Vercel frontend, which does not run FastAPI.
7. Bootstrap the first admin with `python -m scripts.bootstrap_admin` from a controlled shell only after migration. Configure staff MFA and identity controls before school onboarding.
8. Configure backups, alerts, rate limiting, retention, data protection and load tests before production launch.

## Operational concerns
- Render Docker image runs non-root and listens on `PORT`.
- The current WebSocket connection registry lives in memory. Single-worker operation avoids inconsistent sessions within one container; for multiple replicas add Redis fanout.
- There is no Redis service in this Blueprint; background Celery tasks must be deployed and configured separately before relying on them. AI inference remains optional.
- Production access/refresh token storage remains browser localStorage and needs HttpOnly cookie migration, CSRF defense and security sign-off.
- Baseline migration creates the current ORM schema for **new installations only**; future revisions must be explicit, immutable Alembic operations.
- Run repository CI, a staging PostgreSQL upgrade and database restore rehearsal before a production approval.

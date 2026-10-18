# Nexus LearnAI

**An offline-aware learning management system for connected and low-connectivity classrooms.**

[![CI](https://github.com/Gech-E/NexusAI/actions/workflows/main.yml/badge.svg)](https://github.com/Gech-E/NexusAI/actions/workflows/main.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)

[**Live portfolio demo**](https://nexus-ai-omega-ten.vercel.app) · [**API health**](https://nexus-learnai-api-demo.onrender.com/api/v1/health) · [**Architecture and improvement plan**](docs/improvement-plan.md) · [**Release checklist**](docs/production-readiness.md)

> **Project status:** Portfolio / active development. The hosted demo runs on free-tier services and is **not approved for real student data or production school deployments**. Some advanced AI, offline, and proctoring capabilities are experimental or incomplete.

## Overview

Nexus LearnAI brings course delivery, assessments, progress tracking, and AI-assisted study tools into one responsive platform. It is designed with intermittent connectivity in mind and supports separate workflows for **students**, **teachers**, and **administrators**.

### Current capabilities

| Area | What's available |
| --- | --- |
| **Student learning** | Browse and enroll in school courses, take quizzes, review results, and view progress summaries. |
| **Teaching** | Create courses and quizzes, review assessment outcomes, and explore classroom analytics. |
| **Administration** | Manage institutions and user roles; issue school-bound student invitations. |
| **Authentication & access** | JWT-based authentication, refresh-token rotation, role checks, and institution-scoped access on core learning endpoints. |
| **Offline support** | Cache permitted course descriptions/syllabuses in IndexedDB, save started quiz attempts, and retry submissions when reconnected. |
| **Progress synchronization** | Apply validated course-progress updates with enrollment checks and duplicate handling. |
| **AI assistance** | Tutor endpoints and interface with optional configured AI-provider integration; availability depends on backend configuration. |

**In development:** complete offline course media and navigation, adaptive assessment policies, distributed exam monitoring, multilingual learning materials, and additional security and scaling controls. The current proctoring interface should not be presented as a fully validated automated cheating detector.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| API | FastAPI, Python 3.12, Pydantic 2 |
| Persistence | SQLAlchemy 2, PostgreSQL; SQLite for local development |
| Migrations | Alembic |
| Optional integrations | Google Generative AI, Redis/Celery, ONNX/C++ modules |
| Delivery | GitHub Actions, Docker, Vercel (frontend), Render (API) |

## Architecture

\`\`\`text
                     Browser / Next.js
                    (Vercel frontend)
                            |
                  HTTPS REST API requests
                            |
                     FastAPI backend
                      (Render service)
                       /          \
             JWT + school RBAC   AI integrations
                       |
                SQLAlchemy / Alembic
                       |
                     PostgreSQL

  Browser IndexedDB: cached reading content and queued quiz attempts
\`\`\`

Offline quiz answers are scored **on the server after reconnection**. Full application-wide offline operation is not yet supported.

## Run locally

### Prerequisites

- Python **3.12+**
- Node.js **22+** and npm
- Git

SQLite can be used for local development; PostgreSQL is recommended for staging and required for non-development backend configurations.

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Gech-E/NexusAI.git
cd NexusAI
\`\`\`

### 2. Start the backend

\`\`\`bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
\`\`\`

For a local-only environment, set the following values in \`backend/.env\`:

\`\`\`dotenv
APP_ENV=development
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./nexus_local.db
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=replace-with-your-own-long-random-development-secret
ALLOW_PUBLIC_REGISTRATION=false
\`\`\`

Create the **first administrator** using the interactive, local-only command:

\`\`\`bash
python -m scripts.bootstrap_admin
uvicorn app.main:app --reload
\`\`\`

The admin bootstrap is intended to be run once. Development mode initializes the local schema. Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the development API reference and [http://localhost:8000/api/v1/health/ready](http://localhost:8000/api/v1/health/ready) for database readiness.

### 3. Start the frontend

Open a second terminal from the repository root:

\`\`\`bash
cd frontend
npm ci
\`\`\`

Create \`frontend/.env.local\`:

\`\`\`dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

Then run:

\`\`\`bash
npm run dev
\`\`\`

Open **http://localhost:3000**.

### 4. Try the learning workflow

1. Sign in with the administrator account you created locally.
2. Create an institution, then issue a student invitation associated with an email address.
3. Register a student using that invitation and its matching email.
4. Assign a teacher role to an appropriate account through the administrator workflow.
5. Create a course and quiz, enroll the student, submit an assessment, and review the result.
6. Test reconnection by starting a quiz online, disconnecting, and submitting the saved attempt once the connection returns.

> New users **cannot self-assign teacher/admin roles** or join arbitrary institutions. Student registration normally requires an administrator-issued invitation.

## Tests and quality checks

\`\`\`bash
# Backend, from backend/
python -m pytest -q tests

# Frontend, from frontend/
npm run typecheck
npm run lint
npm run build
\`\`\`

GitHub Actions runs backend tests and the frontend validation/build workflow for pushes and pull requests. Green CI does **not** replace deployment or security testing.

## Hosted demo and deployment

| Component | Link |
| --- | --- |
| Web application | [nexus-ai-omega-ten.vercel.app](https://nexus-ai-omega-ten.vercel.app) |
| API | [nexus-learnai-api-demo.onrender.com](https://nexus-learnai-api-demo.onrender.com) |
| API health | [\`/api/v1/health\`](https://nexus-learnai-api-demo.onrender.com/api/v1/health) |
| Database readiness | [\`/api/v1/health/ready\`](https://nexus-learnai-api-demo.onrender.com/api/v1/health/ready) |

The frontend reads \`NEXT_PUBLIC_API_URL\` to locate the backend. Render requires \`DATABASE_URL\`, a unique \`JWT_SECRET_KEY\`, and HTTPS \`CORS_ORIGINS\` for a non-development deployment. Database migrations must run before serving learning-data requests.

See [Render deployment guidance](docs/render-deployment.md) for setup details. **Free-tier services may be slow to wake, and free database storage can expire.** Hosted links show the current portfolio environment, not a service-level availability guarantee.

## Repository structure

\`\`\`text
NexusAI/
├── frontend/         Next.js application
├── backend/          FastAPI routes, services, ORM models, migrations, tests
├── cpp-engine/       Experimental native performance modules
├── docker/           Container orchestration and proxy configuration
├── infrastructure/   Infrastructure configurations
├── docs/             Architecture, release checks, deployment guidance
├── scripts/          Project utilities
└── render.yaml       Render deployment blueprint
\`\`\`

## Security and release status

This is a portfolio implementation, **not a production-certified student information system**. Before onboarding real schools, further work is required on secure session cookies/MFA, comprehensive cross-tenant verification, data protection for minors, backups and restoration, full offline reliability, accessibility, and load testing.

- [Production readiness checklist](docs/production-readiness.md)
- [Architecture and improvement roadmap](docs/improvement-plan.md)
- [Render deployment instructions](docs/render-deployment.md)

Do not commit credentials, tokens, environment files, or real student records. Use synthetic data when testing the hosted demo.

---

**Built as an exploration of accessible, resilient digital learning infrastructure.**

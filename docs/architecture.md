# Nexus LearnAI Architecture

## 1. System Overview
Nexus LearnAI is an offline-first, AI-powered Smart Learning & Exam Analytics Platform. Designed primarily for developing regions with unstable internet connectivity, it leverages high-performance edge AI, local data persistence, and background sync to provide a seamless learning experience.

## 2. Component Architecture
The system consists of the following primary subsystems:

- **Frontend Application**
  - **Tech**: Next.js 15, React, Zustand, TailwindCSS, WebSockets.
  - **Responsibility**: Provides the UI for students, teachers, and admins. Handles local caching (IndexedDB/SQLite WASM) for offline use.

- **Backend Gateway & API**
  - **Tech**: FastAPI, Python 3.12, SQLAlchemy, PostgreSQL, Redis.
  - **Responsibility**: Manages authentication, orchestrates data sync, provides REST/WebSocket APIs, and handles background jobs via Celery.

- **High-Performance AI & Computer Vision Engine**
  - **Tech**: C++20, ONNX Runtime, OpenCV, pybind11.
  - **Responsibility**:
    - *Inference Engine*: Executes quantized LLMs for the AI tutor completely offline.
    - *Computer Vision*: Performs real-time exam monitoring (face tracking, suspicious behavior).
    - *Recommendation*: High-throughput skill estimation.

## 3. Data Flow
1. **User Interaction**: User interacts with the Next.js frontend.
2. **Offline Check**: Frontend determines connectivity.
   - *Online*: Uses TanStack Query to fetch from FastAPI.
   - *Offline*: Reads/writes from local IndexedDB wrapper.
3. **AI Execution**: Frontend requests AI help. Backend delegates complex, heavy AI tasks (like generating an embedding or CV analysis) to the bound C++ Engine via pybind11 bindings.
4. **Data Sync**: When connection is restored, frontend syncs state to the backend using conflict-free resolution strategies.

## 4. Entity Relationships
- **User** has many **Roles** (Student, Teacher, Admin).
- **School** has many **Users**.
- **Course** has many **Quizzes**.
- **Quiz** has many **Questions**.
- **Student** takes **QuizResult**, monitored by **CVAlerts**.

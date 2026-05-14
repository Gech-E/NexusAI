# 🧠 Nexus LearnAI — Intelligent Offline-First LMS

Nexus LearnAI is a state-of-the-art Learning Management System designed for the next generation of education. It features a high-performance **FastAPI** backend, a stunning **Next.js 15** frontend, and advanced **AI-powered proctoring and tutoring** capabilities.

![Nexus Student Dashboard](https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

### 👨‍🎓 For Students
- **Interactive AI Tutor**: Personalized real-time learning assistance powered by local RAG (Retrieval-Augmented Generation).
- **Offline-First Mode**: Track your progress and take assessments even without an internet connection; data syncs automatically when back online.
- **Skill Mastery Analytics**: Visualise your learning journey with dynamic charts and performance trends.
- **Smart Quizzes**: Adaptive assessments that adjust to your level.

### 👩‍🏫 For Teachers
- **Live CV Proctoring**: Real-time Computer Vision alerts for exam integrity (Gaze detection, unauthorized materials).
- **Classroom Insights**: Deep analytics on student performance and engagement.
- **Exam Builder**: Create and schedule smart assessments with customizable proctoring levels.
- **WebSocket Alert Stream**: Instant notifications for proctoring events during active exams.

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Framer Motion, Zustand |
| **Backend** | FastAPI (Python 3.12+), SQLAlchemy 2.0, Pydantic v2 |
| **Database** | PostgreSQL / SQLite (Development), Redis (Caching) |
| **AI/ML** | ONNX Runtime, Custom C++ Bindings (Optional High-Perf) |
| **DevOps** | Docker, Uvicorn, WatchFiles |

## 📦 Getting Started

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- **PostgreSQL** (Optional, SQLite works out of the box)

### 2. Backend Setup
```bash
cd nexus-learnai/backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd nexus-learnai/frontend
npm install
npm run dev
```

## 🔒 Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
APP_NAME="Nexus LearnAI"
APP_ENV=development
DATABASE_URL=sqlite+aiosqlite:///./nexus_learnai.db
JWT_SECRET_KEY=your-super-secret-key
```

## 📈 Roadmap
- [ ] Mobile App (React Native)
- [ ] Multi-Modal AI Tutor (Voice & Image)
- [ ] Advanced LTI 1.3 Integration
- [ ] Decentralized Credentialing (Blockchain)

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by the Nexus AI Team.

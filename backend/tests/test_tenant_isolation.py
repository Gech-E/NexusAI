"""API regression tests using two isolated schools and a real SQLite test database."""
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.deps import get_db
from app.core.security import create_access_token
from app.infrastructure.models.base import Base
import app.infrastructure.models  # noqa: F401
from app.infrastructure.models.academic import Course
from app.infrastructure.models.assessment import Quiz, Question
from app.infrastructure.models.institution import School
from app.infrastructure.models.profile import StudentProfile, TeacherProfile
from app.infrastructure.models.user import User, UserRoleAssignment, UserRole


@pytest.mark.asyncio
async def test_cross_school_isolation_and_ai_authorization():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:", poolclass=StaticPool, echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        alpha = School(name="School Alpha", slug="school-alpha")
        beta = School(name="School Beta", slug="school-beta")
        session.add_all([alpha, beta])
        await session.flush()

        student_a = User(email="student-alpha@test.edu", full_name="Student A", hashed_password="!")
        student_b = User(email="student-beta@test.edu", full_name="Student B", hashed_password="!")
        teacher_a = User(email="teacher-alpha@test.edu", full_name="Teacher A", hashed_password="!")
        teacher_b = User(email="teacher-beta@test.edu", full_name="Teacher B", hashed_password="!")
        session.add_all([student_a, student_b, teacher_a, teacher_b])
        await session.flush()
        session.add_all([
            StudentProfile(user_id=student_a.id, school_id=alpha.id),
            StudentProfile(user_id=student_b.id, school_id=beta.id),
            TeacherProfile(user_id=teacher_a.id, school_id=alpha.id),
            TeacherProfile(user_id=teacher_b.id, school_id=beta.id),
            UserRoleAssignment(user_id=student_a.id, role=UserRole.STUDENT),
            UserRoleAssignment(user_id=student_b.id, role=UserRole.STUDENT),
            UserRoleAssignment(user_id=teacher_a.id, role=UserRole.TEACHER),
            UserRoleAssignment(user_id=teacher_b.id, role=UserRole.TEACHER),
        ])
        course_a = Course(school_id=alpha.id, teacher_user_id=teacher_a.id, title="Physics", subject="Physics")
        course_b = Course(school_id=beta.id, teacher_user_id=teacher_b.id, title="History", subject="History")
        session.add_all([course_a, course_b])
        await session.flush()
        quiz_a = Quiz(school_id=alpha.id, course_id=course_a.id, created_by_user_id=teacher_a.id, title="Physics Exam")
        quiz_b = Quiz(school_id=beta.id, course_id=course_b.id, created_by_user_id=teacher_b.id, title="History Exam")
        session.add_all([quiz_a, quiz_b])
        await session.flush()
        session.add_all([
            Question(quiz_id=quiz_a.id, prompt="Question A", choices=["A", "B"], correct_index=0),
            Question(quiz_id=quiz_b.id, prompt="Question B", choices=["A", "B"], correct_index=1),
        ])
        await session.commit()
        ids = {
            "student_a": student_a.id, "student_b": student_b.id, "teacher_a": teacher_a.id,
            "alpha": alpha.id, "beta": beta.id,
            "course_a": course_a.id, "course_b": course_b.id,
            "quiz_a": quiz_a.id, "quiz_b": quiz_b.id,
        }

    async def override_get_db():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            def auth(key):
                return {"Authorization": "Bearer " + create_access_token(ids[key])}

            courses = await client.get("/api/v1/courses", headers=auth("student_a"))
            assert courses.status_code == 200
            assert [x["title"] for x in courses.json()] == ["Physics"]

            quizzes = await client.get("/api/v1/quizzes", headers=auth("student_a"))
            assert quizzes.status_code == 200
            assert [x["title"] for x in quizzes.json()] == ["Physics Exam"]

            foreign_course = await client.get(
                f"/api/v1/courses/{ids['course_b']}", headers=auth("student_a")
            )
            assert foreign_course.status_code == 403
            foreign_exam = await client.post(
                f"/api/v1/quizzes/{ids['quiz_b']}/start", headers=auth("student_a")
            )
            assert foreign_exam.status_code == 403

            answer_key = await client.get(
                f"/api/v1/quizzes/{ids['quiz_a']}", headers=auth("student_a")
            )
            assert answer_key.status_code == 403

            roster = await client.get("/api/v1/analytics/teacher/students", headers=auth("teacher_a"))
            assert roster.status_code == 200
            assert [s["name"] for s in roster.json()] == ["Student A"]

            hidden_ai = await client.get("/api/v1/ai/stats", headers=auth("student_a"))
            assert hidden_ai.status_code == 403
            foreign_conversation = await client.post(
                "/api/v1/ai/tutor/query",
                headers=auth("student_a"),
                json={"query": "Explain gravity", "conversation_id": str(uuid4())},
            )
            assert foreign_conversation.status_code == 404
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()

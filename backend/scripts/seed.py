"""
Nexus LearnAI — Database Seeder
Seeds the database with demo data for development and demos.
Run directly: python -m scripts.seed
Or auto-runs on dev startup if the database is empty.
"""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.infrastructure.database import AsyncSessionLocal, init_db
from app.infrastructure.models.user import User, UserRole, UserRoleAssignment
from app.infrastructure.models.institution import School
from app.infrastructure.models.profile import StudentProfile, TeacherProfile
from app.infrastructure.models.academic import Course, Enrollment
from app.infrastructure.models.assessment import Quiz, Question, QuizAttempt, QuizResult
from app.infrastructure.models.ai_data import Recommendation

logger = logging.getLogger(__name__)

# Fixed UUIDs for demo data so they can be referenced deterministically
DEMO_SCHOOL_ID = UUID("00000000-0000-0000-0000-000000000001")
DEMO_STUDENT_ID = UUID("00000000-0000-0000-0000-000000000010")
DEMO_TEACHER_ID = UUID("00000000-0000-0000-0000-000000000020")
DEMO_ADMIN_ID = UUID("00000000-0000-0000-0000-000000000030")


async def is_database_empty(session: AsyncSession) -> bool:
    """Check if the database has any users (i.e., has been seeded)."""
    result = await session.execute(select(func.count(User.id)))
    count = result.scalar() or 0
    return count == 0


async def seed_school(session: AsyncSession) -> School:
    school = School(
        id=DEMO_SCHOOL_ID,
        name="Nexus Demo Academy",
        slug="demo-school",
        country_code="ET",
        timezone="Africa/Addis_Ababa",
        settings={"plan": "enterprise", "max_students": 500},
    )
    session.add(school)
    await session.flush()
    return school


async def seed_users(session: AsyncSession) -> tuple[User, User, User]:
    # Demo Student
    student = User(
        id=DEMO_STUDENT_ID,
        email="student@nexus.demo",
        hashed_password=hash_password("password123"),
        full_name="Amara Osei",
    )
    session.add(student)

    # Demo Teacher
    teacher = User(
        id=DEMO_TEACHER_ID,
        email="teacher@nexus.demo",
        hashed_password=hash_password("password123"),
        full_name="Dr. Kwame Mensah",
    )
    session.add(teacher)

    # Demo Admin
    admin = User(
        id=DEMO_ADMIN_ID,
        email="admin@nexus.demo",
        hashed_password=hash_password("password123"),
        full_name="Grace Wanjiku",
    )
    session.add(admin)
    await session.flush()

    # Assign roles
    session.add(UserRoleAssignment(user_id=student.id, role=UserRole.STUDENT))
    session.add(UserRoleAssignment(user_id=teacher.id, role=UserRole.TEACHER))
    session.add(UserRoleAssignment(user_id=admin.id, role=UserRole.ADMIN))

    # Create profiles
    session.add(StudentProfile(user_id=student.id, school_id=DEMO_SCHOOL_ID, grade_level="Year 3", metadata_={}))
    session.add(TeacherProfile(user_id=teacher.id, school_id=DEMO_SCHOOL_ID, department="Mathematics", title="Senior Lecturer", metadata_={}))

    await session.flush()
    return student, teacher, admin


async def seed_courses(session: AsyncSession) -> list[Course]:
    courses_data = [
        {"title": "Advanced Mathematics", "subject": "Mathematics", "code": "MATH301",
         "description": "Comprehensive coverage of calculus, linear algebra, and differential equations."},
        {"title": "Introduction to Artificial Intelligence", "subject": "Computer Science", "code": "CS201",
         "description": "Explore the foundations of AI including search, knowledge, and machine learning."},
        {"title": "Data Structures & Algorithms", "subject": "Computer Science", "code": "CS202",
         "description": "Fundamental data structures, algorithm design and analysis."},
        {"title": "General Physics I", "subject": "Physics", "code": "PHY101",
         "description": "Mechanics, thermodynamics, and waves with lab components."},
        {"title": "Organic Chemistry", "subject": "Chemistry", "code": "CHEM201",
         "description": "Structure, reactions, and synthesis of organic compounds."},
    ]

    courses = []
    for data in courses_data:
        course = Course(
            school_id=DEMO_SCHOOL_ID,
            teacher_user_id=DEMO_TEACHER_ID,
            title=data["title"],
            subject=data["subject"],
            code=data["code"],
            description=data["description"],
            syllabus={"weeks": 16, "topics": [data["subject"]]},
        )
        session.add(course)
        courses.append(course)

    await session.flush()

    # Enroll the student in the first 3 courses
    for i, course in enumerate(courses[:3]):
        enrollment = Enrollment(
            course_id=course.id,
            student_user_id=DEMO_STUDENT_ID,
            status="active",
            progress_pct=round(45 + i * 20, 1),
        )
        session.add(enrollment)

    await session.flush()
    return courses


async def seed_quizzes(session: AsyncSession, courses: list[Course]) -> list[Quiz]:
    quizzes_data = [
        {
            "title": "Calculus Fundamentals",
            "description": "Test your understanding of derivatives and integrals.",
            "course": courses[0],
            "questions": [
                {"prompt": "What is the derivative of f(x) = 3x² + 2x?", "choices": ["6x + 2", "3x + 2", "6x² + 2", "6x"], "correct_index": 0, "difficulty": 0.3},
                {"prompt": "What is ∫2x dx?", "choices": ["x²", "x² + C", "2x² + C", "x + C"], "correct_index": 1, "difficulty": 0.3},
                {"prompt": "The derivative of sin(x) is:", "choices": ["-cos(x)", "cos(x)", "tan(x)", "-sin(x)"], "correct_index": 1, "difficulty": 0.4},
                {"prompt": "What is the chain rule used for?", "choices": ["Integrating products", "Differentiating composite functions", "Finding limits", "Summing series"], "correct_index": 1, "difficulty": 0.5},
                {"prompt": "∫(1/x) dx = ?", "choices": ["x²", "1/x²", "ln|x| + C", "e^x + C"], "correct_index": 2, "difficulty": 0.5},
            ]
        },
        {
            "title": "AI Concepts Quiz",
            "description": "Fundamental concepts in artificial intelligence.",
            "course": courses[1],
            "questions": [
                {"prompt": "What does 'AI' stand for?", "choices": ["Artificial Intelligence", "Automated Integration", "Advanced Inference", "Applied Informatics"], "correct_index": 0, "difficulty": 0.1},
                {"prompt": "Which is a supervised learning algorithm?", "choices": ["K-means", "Linear Regression", "PCA", "DBSCAN"], "correct_index": 1, "difficulty": 0.4},
                {"prompt": "What is overfitting?", "choices": ["Model is too simple", "Model memorizes training data", "Model has no bias", "Model runs too slowly"], "correct_index": 1, "difficulty": 0.5},
                {"prompt": "A neural network with many layers is called:", "choices": ["Wide network", "Shallow network", "Deep network", "Flat network"], "correct_index": 2, "difficulty": 0.3},
            ]
        },
        {
            "title": "Physics: Newton's Laws",
            "description": "Assessment covering Newton's three laws of motion.",
            "course": courses[3],
            "questions": [
                {"prompt": "Newton's first law is also known as:", "choices": ["Law of Acceleration", "Law of Inertia", "Law of Reaction", "Law of Gravity"], "correct_index": 1, "difficulty": 0.2},
                {"prompt": "F = ma represents which of Newton's laws?", "choices": ["First law", "Second law", "Third law", "None"], "correct_index": 1, "difficulty": 0.2},
                {"prompt": "For every action there is an equal and opposite:", "choices": ["Force", "Reaction", "Motion", "Energy"], "correct_index": 1, "difficulty": 0.2},
            ]
        }
    ]

    quizzes = []
    for data in quizzes_data:
        quiz = Quiz(
            school_id=DEMO_SCHOOL_ID,
            course_id=data["course"].id,
            created_by_user_id=DEMO_TEACHER_ID,
            title=data["title"],
            description=data["description"],
            adaptive_policy={"engine": "irt-lite", "version": 1},
        )
        session.add(quiz)
        await session.flush()

        for q_data in data["questions"]:
            question = Question(
                quiz_id=quiz.id,
                prompt=q_data["prompt"],
                choices=q_data["choices"],
                correct_index=q_data["correct_index"],
                difficulty=q_data["difficulty"],
                topic_tags=[data["title"].lower()],
            )
            session.add(question)

        quizzes.append(quiz)

    await session.flush()

    # Create a completed quiz attempt for the student on the first quiz
    attempt = QuizAttempt(
        quiz_id=quizzes[0].id,
        student_user_id=DEMO_STUDENT_ID,
        started_at=datetime.now(tz=UTC) - timedelta(days=2),
        submitted_at=datetime.now(tz=UTC) - timedelta(days=2) + timedelta(minutes=25),
        answers={"0": 0, "1": 1, "2": 1, "3": 1, "4": 2},
    )
    session.add(attempt)
    await session.flush()

    result = QuizResult(
        attempt_id=attempt.id,
        score=0.80,
        skill_estimate={"calculus": 0.78, "integration": 0.72},
        feedback={"summary": "Strong on derivatives, review integration techniques."},
    )
    session.add(result)
    await session.flush()

    return quizzes


async def seed_recommendations(session: AsyncSession) -> None:
    recs = [
        {"title": "Integration Techniques Review", "reason": "Score dropped on integral problems", "resource_type": "lesson", "score": 0.95},
        {"title": "Trigonometry Refresher", "reason": "Prerequisite gaps detected by AI", "resource_type": "review", "score": 0.88},
        {"title": "Organic Chemistry Practice", "reason": "Similar students improved 22% with this", "resource_type": "practice", "score": 0.82},
        {"title": "Newton's Laws Deep Dive", "reason": "Trending topic in upcoming exams", "resource_type": "lesson", "score": 0.75},
        {"title": "Statistical Distributions Quiz", "reason": "High mastery — challenge yourself", "resource_type": "quiz", "score": 0.70},
    ]

    for rec_data in recs:
        rec = Recommendation(
            user_id=DEMO_STUDENT_ID,
            resource_type=rec_data["resource_type"],
            title=rec_data["title"],
            reason=rec_data["reason"],
            relevance_score=rec_data["score"],
        )
        session.add(rec)

    await session.flush()


async def run_seed() -> None:
    """Main seed function. Only seeds if database is empty."""
    async with AsyncSessionLocal() as session:
        if not await is_database_empty(session):
            logger.info("Database already has data — skipping seed.")
            return

        logger.info("🌱 Seeding database with demo data...")

        school = await seed_school(session)
        student, teacher, admin = await seed_users(session)
        courses = await seed_courses(session)
        quizzes = await seed_quizzes(session, courses)
        await seed_recommendations(session)

        await session.commit()

        logger.info("✅ Seed complete!")
        logger.info(f"   School: {school.name} (slug: {school.slug})")
        logger.info(f"   Student: {student.email} / password123")
        logger.info(f"   Teacher: {teacher.email} / password123")
        logger.info(f"   Admin:   {admin.email} / password123")
        logger.info(f"   Courses: {len(courses)}")
        logger.info(f"   Quizzes: {len(quizzes)}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_seed())

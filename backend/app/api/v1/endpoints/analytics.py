"""Analytics endpoints for students, teachers, and platform-level reporting."""

from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession, require_roles
from app.core.permissions import user_school_ids, is_platform_admin
from app.infrastructure.models.academic import Course, Enrollment
from app.infrastructure.models.analytics import AnalyticsSnapshot
from app.infrastructure.models.assessment import Question, Quiz, QuizAttempt, QuizResult
from app.infrastructure.models.profile import StudentProfile
from app.infrastructure.models.user import User, UserRole, UserRoleAssignment

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ─────────────────────────────────────────────
# Student analytics
# ─────────────────────────────────────────────


@router.get("/me/summary")
async def my_summary(db: DbSession, user: CurrentUser) -> dict:
    """Dashboard summary stats for the current student."""
    # Total quiz attempts
    attempts_q = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.isnot(None),
        )
    )
    completed_quizzes = attempts_q.scalar() or 0

    # Average score
    avg_q = await db.execute(
        select(func.avg(QuizResult.score))
        .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
        .where(QuizAttempt.student_user_id == user.id)
    )
    avg_score = avg_q.scalar() or 0.0

    # Enrolled courses count
    enrolled_q = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.student_user_id == user.id)
    )
    enrolled_courses = enrolled_q.scalar() or 0

    # Pending (un-submitted) attempts
    pending_q = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.is_(None),
        )
    )
    pending = pending_q.scalar() or 0

    return {
        "skill_mastery": round(avg_score * 100, 1),
        "completed_quizzes": completed_quizzes,
        "enrolled_courses": enrolled_courses,
        "active_offline": False,
        "weekly_improvement": 0.0,
        "pending_assignments": pending,
        "ai_sessions_hours": 0.0,
    }


@router.get("/me/detailed")
async def my_detailed_analytics(db: DbSession, user: CurrentUser) -> dict:
    """Detailed analytics for the student analytics sub-page."""
    # Recent quiz attempts with scores
    attempts_res = await db.execute(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.quiz), selectinload(QuizAttempt.result))
        .where(
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.isnot(None),
        )
        .order_by(QuizAttempt.submitted_at.desc())
        .limit(30)
    )
    attempts = attempts_res.scalars().all()

    # Weekly performance (last 7 completed attempts → day-by-day)
    weekly = []
    for a in reversed(attempts[:7]):
        score_val = a.result.score * 100 if a.result else 0
        day_label = a.submitted_at.strftime("%a") if a.submitted_at else "N/A"
        weekly.append({"day": day_label, "score": round(score_val, 1)})

    # Subject mastery — avg score per quiz title keyword
    subject_scores: dict[str, list[float]] = {}
    for a in attempts:
        if a.quiz and a.result:
            title = a.quiz.title.split()[0] if a.quiz.title else "General"
            subject_scores.setdefault(title, []).append(a.result.score * 100)
    subject_mastery = [
        {"subject": subj, "mastery": round(sum(scores) / len(scores), 1)}
        for subj, scores in subject_scores.items()
    ]

    # Overall stats
    all_scores = [a.result.score for a in attempts if a.result]
    avg = sum(all_scores) / len(all_scores) if all_scores else 0
    best = max(all_scores) if all_scores else 0

    # Learning streak — count consecutive days with at least one submitted quiz
    streak = 0
    if attempts:
        check_date = datetime.now(tz=UTC).date()
        submitted_dates = {
            a.submitted_at.date() for a in attempts if a.submitted_at
        }
        while check_date in submitted_dates:
            streak += 1
            check_date -= timedelta(days=1)

    return {
        "weekly_performance": weekly,
        "subject_mastery": subject_mastery,
        "total_completed": len(attempts),
        "average_score": round(avg * 100, 1),
        "best_score": round(best * 100, 1),
        "learning_streak_days": streak,
        "recent_results": [
            {
                "quiz_title": a.quiz.title if a.quiz else "Unknown",
                "score": round(a.result.score * 100, 1) if a.result else 0,
                "date": a.submitted_at.isoformat() if a.submitted_at else None,
            }
            for a in attempts[:10]
        ],
    }


# ─────────────────────────────────────────────
# School-scoped teacher analytics
# ─────────────────────────────────────────────

async def _school_scope(db: DbSession, user: User) -> set[UUID] | None:
    """None means platform admin; an empty set means no accessible schools."""
    if is_platform_admin(user):
        return None
    return await user_school_ids(db, user)


def _quiz_filter(query, schools: set[UUID] | None):
    return query if schools is None else query.where(Quiz.school_id.in_(schools))


async def _student_roster(db: DbSession, schools: set[UUID] | None) -> list[User]:
    query = (
        select(User)
        .join(StudentProfile, StudentProfile.user_id == User.id)
        .join(UserRoleAssignment, UserRoleAssignment.user_id == User.id)
        .where(UserRoleAssignment.role == UserRole.STUDENT, User.is_active.is_(True))
        .order_by(User.full_name)
        .limit(200)
    )
    if schools is not None:
        query = query.where(StudentProfile.school_id.in_(schools))
    return list((await db.execute(query)).scalars().unique().all())


async def _school_results(db: DbSession, schools: set[UUID] | None) -> list[tuple]:
    """Read only results for quizzes belonging to the teacher's institutions."""
    query = (
        select(QuizAttempt.student_user_id, QuizResult.score, QuizAttempt.quiz_id, QuizAttempt.created_at)
        .join(QuizResult, QuizResult.attempt_id == QuizAttempt.id)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .limit(10000)
    )
    return list((await db.execute(_quiz_filter(query, schools))).all())


@router.get("/teacher/summary")
async def teacher_summary(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> dict:
    schools = await _school_scope(db, user)
    students = await _student_roster(db, schools)
    results = await _school_results(db, schools)
    q = _quiz_filter(select(func.count(Quiz.id)), schools)
    quizzes = (await db.execute(q)).scalar_one()
    return {
        "active_students": len(students),
        "avg_class_performance": round(100 * sum(row.score for row in results) / len(results), 1) if results else 0,
        "active_alerts": 0,  # Unsubmitted attempts are NOT proctoring alerts.
        "upcoming_exams": quizzes,
        "student_trend": "No trend data",
    }


@router.get("/teacher/students")
async def teacher_students(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> list[dict]:
    schools = await _school_scope(db, user)
    roster = await _student_roster(db, schools)
    results = await _school_results(db, schools)
    by_student: dict[UUID, list[float]] = {}
    for row in results:
        by_student.setdefault(row.student_user_id, []).append(float(row.score))
    return [
        {
            "id": str(s.id),
            "name": s.full_name,
            "email": s.email,
            "score": round(100 * sum(by_student[s.id]) / len(by_student[s.id]), 1) if by_student.get(s.id) else 0,
            "trend": "stable",
            "risk": ("unknown" if not by_student.get(s.id) else
                     "high" if sum(by_student[s.id]) / len(by_student[s.id]) < 0.55 else
                     "medium" if sum(by_student[s.id]) / len(by_student[s.id]) < 0.75 else "low"),
            "quizzes": len(by_student.get(s.id, [])),
            "lastActive": "Unknown",
        }
        for s in roster
    ]


@router.get("/teacher/performance")
async def teacher_performance(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> dict:
    schools = await _school_scope(db, user)
    results = await _school_results(db, schools)
    scores = [float(r.score) for r in results]
    courses_q = select(Course).order_by(Course.created_at.desc()).limit(20)
    if schools is not None:
        courses_q = courses_q.where(Course.school_id.in_(schools))
    courses = list((await db.execute(courses_q)).scalars().all())
    comparison = []
    for course in courses:
        per_course = (
            select(QuizResult.score)
            .join(QuizAttempt, QuizAttempt.id == QuizResult.attempt_id)
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course.id, Quiz.school_id == course.school_id)
        )
        scores_for_course = list((await db.execute(per_course)).scalars().all())
        comparison.append({
            "cls": course.title[:20],
            "avg": round(100 * sum(scores_for_course) / len(scores_for_course), 1) if scores_for_course else 0,
            "quizzes": len(scores_for_course),
        })
    return {
        "overall_avg": round(100 * sum(scores) / len(scores), 1) if scores else 0,
        "pass_rate": round(100 * sum(v >= 0.6 for v in scores) / len(scores), 1) if scores else 0,
        "total_quizzes": len(scores),
        "class_comparison": comparison,
    }


@router.get("/teacher/weak-topics")
async def teacher_weak_topics(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> list[dict]:
    schools = await _school_scope(db, user)
    questions_q = select(Question, Quiz.title).join(Quiz, Question.quiz_id == Quiz.id).limit(200)
    rows = list((await db.execute(_quiz_filter(questions_q, schools))).all())
    quiz_ids = {question.quiz_id for question, _ in rows}
    attempts = []
    if quiz_ids:
        attempts = list((await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id.in_(quiz_ids),
                QuizAttempt.submitted_at.isnot(None),
            )
        )).scalars().all())
    attempts_by_quiz: dict[UUID, list[QuizAttempt]] = {}
    for attempt in attempts:
        attempts_by_quiz.setdefault(attempt.quiz_id, []).append(attempt)
    topics: dict[str, dict] = {}
    for question, title in rows:
        for topic in question.topic_tags or ["General"]:
            entry = topics.setdefault(topic, {
                "correct": 0, "total": 0, "students": set(), "subject": title.split()[0] if title else "General"
            })
            for attempt in attempts_by_quiz.get(question.quiz_id, []):
                choice = (attempt.answers or {}).get(str(question.id))
                if choice is not None:
                    entry["total"] += 1
                    entry["correct"] += int(choice == question.correct_index)
                    entry["students"].add(attempt.student_user_id)
    return sorted([
        {
            "topic": topic,
            "avgScore": round(100 * value["correct"] / value["total"], 1),
            "students": len(value["students"]),
            "trend": 0,  # Trend unavailable until historical topic snapshots exist.
            "subject": value["subject"],
        }
        for topic, value in topics.items() if value["total"]
    ], key=lambda r: r["avgScore"])[:10]


@router.get("/teacher/class-summary")
async def teacher_class_summary(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> list[dict]:
    schools = await _school_scope(db, user)
    query = select(Course).order_by(Course.created_at.desc()).limit(20)
    if schools is not None:
        query = query.where(Course.school_id.in_(schools))
    courses = list((await db.execute(query)).scalars().all())
    colors = ["cyan", "emerald", "purple", "amber", "blue"]
    output = []
    for i, course in enumerate(courses):
        count = (await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id)
        )).scalar_one()
        scores = list((await db.execute(
            select(QuizResult.score).join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .where(Quiz.course_id == course.id, Quiz.school_id == course.school_id)
        )).scalars().all())
        quizzes = (await db.execute(
            select(func.count(Quiz.id)).where(Quiz.course_id == course.id, Quiz.school_id == course.school_id)
        )).scalar_one()
        output.append({
            "id": str(course.id), "name": course.title, "students": count,
            "avgScore": round(100 * sum(scores) / len(scores), 1) if scores else 0,
            "courses": quizzes, "color": colors[i % len(colors)],
        })
    return output


@router.get("/teacher/ai-insights")
async def teacher_ai_insights(
    db: DbSession,
    user: Annotated[User, Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
) -> dict:
    schools = await _school_scope(db, user)
    roster = await _student_roster(db, schools)
    results = await _school_results(db, schools)
    scores = [float(r.score) for r in results]
    at_risk_ids = {r.student_user_id for r in results if r.score < 0.5}
    average = sum(scores) / len(scores) if scores else 0
    insights = []
    if scores and average < 0.6:
        insights.append({
            "type": "warning", "title": "Average score below target",
            "description": f"Average score is {round(100 * average, 1)}%. Consider additional review sessions.",
        })
    if at_risk_ids:
        insights.append({
            "type": "alert", "title": f"{len(at_risk_ids)} learners need support",
            "description": "Some students recently scored below 50%; consider individualized support.",
        })
    if not scores:
        insights.append({
            "type": "info", "title": "No completed assessments",
            "description": "Create an assessment and invite students to establish a learning baseline.",
        })
    return {
        "insights": insights,
        "summary": {
            "total_students": len(roster),
            "avg_performance": round(100 * average, 1) if scores else 0,
            "at_risk_count": len(at_risk_ids),
        },
    }

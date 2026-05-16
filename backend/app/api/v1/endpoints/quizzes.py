from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession, require_roles
from app.infrastructure.models.assessment import Question, Quiz
from app.infrastructure.models.institution import School
from app.infrastructure.models.user import UserRole

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


class QuestionCreate(BaseModel):
    prompt: str
    choices: list[str] = Field(min_length=2)
    correct_index: int = Field(ge=0)
    difficulty: float = Field(default=0.5, ge=0.0, le=1.0)
    topic_tags: list[str] = Field(default_factory=list)


class QuizCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    school_id: UUID
    course_id: UUID | None = None
    questions: list[QuestionCreate] = Field(default_factory=list)


class QuizRead(BaseModel):
    id: UUID
    title: str
    school_id: UUID

    model_config = {"from_attributes": True}


@router.get("", response_model=list[QuizRead])
async def list_quizzes(db: DbSession, user: CurrentUser) -> list[Quiz]:
    await db.execute(select(1))  # touch session
    result = await db.execute(select(Quiz).order_by(Quiz.created_at.desc()).limit(50))
    return list(result.scalars().all())


@router.post("", response_model=QuizRead, dependencies=[Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))])
async def create_quiz(payload: QuizCreate, db: DbSession, user: CurrentUser) -> Quiz:
    # Ensure school exists to prevent IntegrityError in demo environment
    school_res = await db.execute(select(School).where(School.id == payload.school_id))
    if not school_res.scalar_one_or_none():
        demo_school = School(
            id=payload.school_id,
            name="Default Demo School",
            slug="default-demo-school",
        )
        db.add(demo_school)
        await db.flush()

    quiz = Quiz(
        school_id=payload.school_id,
        course_id=payload.course_id,
        created_by_user_id=user.id,
        title=payload.title,
        description=payload.description,
        adaptive_policy={"engine": "irt-lite", "version": 1},
    )
    db.add(quiz)
    await db.flush()
    for q in payload.questions:
        if q.correct_index >= len(q.choices):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="correct_index out of range")
        db.add(
            Question(
                quiz_id=quiz.id,
                prompt=q.prompt,
                choices=q.choices,
                correct_index=q.correct_index,
                difficulty=q.difficulty,
                topic_tags=q.topic_tags,
            )
        )
    await db.commit()
    res = await db.execute(select(Quiz).where(Quiz.id == quiz.id).options(selectinload(Quiz.questions)))
    return res.scalar_one()
from app.infrastructure.models.assessment import QuizAttempt, QuizResult

@router.get("/me/attempts")
async def my_attempts(db: DbSession, user: CurrentUser):
    query = (
        select(QuizAttempt)
        .where(QuizAttempt.student_user_id == user.id)
        .options(selectinload(QuizAttempt.quiz), selectinload(QuizAttempt.result))
        .order_by(QuizAttempt.created_at.desc())
    )
    result = await db.execute(query)
    attempts = result.scalars().all()
    return attempts


class QuestionOut(BaseModel):
    id: UUID
    prompt: str
    choices: list[str]
    difficulty: float
    topic_tags: list[str]

    model_config = {"from_attributes": True}


class QuizStartResponse(BaseModel):
    attempt_id: UUID
    quiz_title: str
    description: str | None
    questions: list[QuestionOut]
    total_questions: int


class AnswerSubmission(BaseModel):
    answers: dict[str, int]  # Maps question_id -> selected_choice_index


class QuestionFeedback(BaseModel):
    question_id: str
    prompt: str
    selected_index: int
    correct_index: int
    is_correct: bool
    choices: list[str]


class QuizSubmitResponse(BaseModel):
    score: float
    correct_count: int
    total_questions: int
    percentage: float
    feedback: list[QuestionFeedback]


from datetime import UTC, datetime


@router.post("/{quiz_id}/start", response_model=QuizStartResponse)
async def start_quiz(quiz_id: UUID, db: DbSession, user: CurrentUser) -> dict:
    """Start a quiz attempt — returns questions WITHOUT correct answers."""
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions))
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Reuse an existing unsubmitted attempt if one exists (prevents duplicates from race conditions)
    existing_q = await db.execute(
        select(QuizAttempt)
        .where(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.is_(None),
        )
        .order_by(QuizAttempt.created_at.desc())
        .limit(1)
    )
    attempt = existing_q.scalars().first()

    if not attempt:
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            student_user_id=user.id,
            started_at=datetime.now(tz=UTC),
            answers={},
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

    # Return questions without correct_index
    questions_out = [
        {
            "id": q.id,
            "prompt": q.prompt,
            "choices": q.choices,
            "difficulty": q.difficulty,
            "topic_tags": q.topic_tags,
        }
        for q in quiz.questions
    ]

    return {
        "attempt_id": attempt.id,
        "quiz_title": quiz.title,
        "description": quiz.description,
        "questions": questions_out,
        "total_questions": len(questions_out),
    }


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    quiz_id: UUID, payload: AnswerSubmission, db: DbSession, user: CurrentUser
) -> dict:
    """Submit quiz answers, score them, and return feedback."""
    # Find the latest un-submitted attempt
    attempt_q = await db.execute(
        select(QuizAttempt)
        .where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.is_(None),
        )
        .order_by(QuizAttempt.created_at.desc())
        .limit(1)
    )
    attempt = attempt_q.scalars().first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active attempt found. Start the quiz first.",
        )

    # Load questions
    questions_q = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id)
    )
    questions = questions_q.scalars().all()
    question_map = {str(q.id): q for q in questions}

    # Score
    correct_count = 0
    feedback_list = []
    for q in questions:
        qid = str(q.id)
        selected = payload.answers.get(qid, -1)
        is_correct = selected == q.correct_index
        if is_correct:
            correct_count += 1
        feedback_list.append({
            "question_id": qid,
            "prompt": q.prompt,
            "selected_index": selected,
            "correct_index": q.correct_index,
            "is_correct": is_correct,
            "choices": q.choices,
        })

    total = len(questions)
    score = correct_count / total if total > 0 else 0.0
    percentage = round(score * 100, 1)

    # Update attempt
    attempt.submitted_at = datetime.now(tz=UTC)
    attempt.answers = payload.answers

    # Create result
    quiz_result = QuizResult(
        attempt_id=attempt.id,
        score=score,
        skill_estimate={"overall": score},
        feedback={"details": f"{correct_count}/{total} correct"},
    )
    db.add(quiz_result)
    await db.commit()

    return {
        "score": score,
        "correct_count": correct_count,
        "total_questions": total,
        "percentage": percentage,
        "feedback": feedback_list,
    }


# ─────────────────────────────────────────────
# Quiz detail, delete, results, and student stats
# ─────────────────────────────────────────────

from sqlalchemy import func


@router.get("/me/stats")
async def my_quiz_stats(db: DbSession, user: CurrentUser) -> dict:
    """Aggregate quiz statistics for the current student."""
    # Total completed attempts
    total_q = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.isnot(None),
        )
    )
    total = total_q.scalar() or 0

    # Average score
    avg_q = await db.execute(
        select(func.avg(QuizResult.score))
        .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
        .where(QuizAttempt.student_user_id == user.id)
    )
    avg_score = float(avg_q.scalar() or 0)

    # Best score
    best_q = await db.execute(
        select(func.max(QuizResult.score))
        .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
        .where(QuizAttempt.student_user_id == user.id)
    )
    best_score = float(best_q.scalar() or 0)

    # Pending attempts
    pending_q = await db.execute(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.student_user_id == user.id,
            QuizAttempt.submitted_at.is_(None),
        )
    )
    pending = pending_q.scalar() or 0

    return {
        "total_completed": total,
        "average_score": round(avg_score * 100, 1),
        "best_score": round(best_score * 100, 1),
        "pending_attempts": pending,
    }


@router.get("/{quiz_id}")
async def get_quiz_detail(quiz_id: UUID, db: DbSession, user: CurrentUser) -> dict:
    """Get full quiz detail including questions (for teacher review)."""
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions))
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Count attempts
    attempt_count_q = await db.execute(
        select(func.count(QuizAttempt.id)).where(QuizAttempt.quiz_id == quiz_id)
    )
    attempt_count = attempt_count_q.scalar() or 0

    # Average score
    avg_q = await db.execute(
        select(func.avg(QuizResult.score))
        .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
        .where(QuizAttempt.quiz_id == quiz_id)
    )
    avg_score = float(avg_q.scalar() or 0)

    return {
        "id": str(quiz.id),
        "title": quiz.title,
        "description": quiz.description,
        "school_id": str(quiz.school_id),
        "course_id": str(quiz.course_id) if quiz.course_id else None,
        "created_by_user_id": str(quiz.created_by_user_id) if quiz.created_by_user_id else None,
        "adaptive_policy": quiz.adaptive_policy,
        "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
        "total_questions": len(quiz.questions),
        "total_attempts": attempt_count,
        "average_score": round(avg_score * 100, 1),
        "questions": [
            {
                "id": str(q.id),
                "prompt": q.prompt,
                "choices": q.choices,
                "correct_index": q.correct_index,
                "difficulty": q.difficulty,
                "topic_tags": q.topic_tags,
            }
            for q in quiz.questions
        ],
    }


@router.delete(
    "/{quiz_id}",
    dependencies=[Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
)
async def delete_quiz(quiz_id: UUID, db: DbSession) -> dict:
    """Delete a quiz and all its questions/attempts (cascade)."""
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    await db.delete(quiz)
    await db.commit()
    return {"status": "deleted", "quiz_id": str(quiz_id)}


@router.get(
    "/{quiz_id}/results",
    dependencies=[Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
)
async def quiz_results(quiz_id: UUID, db: DbSession) -> dict:
    """Get all student results for a specific quiz (teacher view)."""
    # Verify quiz exists
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Get all submitted attempts with results
    from app.infrastructure.models.user import User as UserModel
    attempts_q = await db.execute(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.result))
        .where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.submitted_at.isnot(None),
        )
        .order_by(QuizAttempt.submitted_at.desc())
    )
    attempts = attempts_q.scalars().all()

    # Get user names
    student_ids = list({a.student_user_id for a in attempts})
    student_names = {}
    if student_ids:
        users_q = await db.execute(
            select(UserModel).where(UserModel.id.in_(student_ids))
        )
        for u in users_q.scalars().all():
            student_names[u.id] = u.full_name

    results = []
    for a in attempts:
        results.append({
            "attempt_id": str(a.id),
            "student_id": str(a.student_user_id),
            "student_name": student_names.get(a.student_user_id, "Unknown"),
            "score": round(a.result.score * 100, 1) if a.result else 0,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        })

    # Summary
    scores = [a.result.score for a in attempts if a.result]
    avg_score = sum(scores) / len(scores) if scores else 0

    return {
        "quiz_id": str(quiz_id),
        "quiz_title": quiz.title,
        "total_submissions": len(attempts),
        "average_score": round(avg_score * 100, 1),
        "highest_score": round(max(scores) * 100, 1) if scores else 0,
        "lowest_score": round(min(scores) * 100, 1) if scores else 0,
        "results": results,
    }


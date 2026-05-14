from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession, require_roles
from app.infrastructure.models.assessment import Question, Quiz
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

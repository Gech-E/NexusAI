from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession, require_roles
from app.infrastructure.models.academic import Course, Enrollment
from app.infrastructure.models.user import UserRole

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseRead(BaseModel):
    id: UUID
    school_id: UUID
    title: str
    subject: str
    description: str | None = None

    model_config = {"from_attributes": True}


class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    subject: str = Field(min_length=2, max_length=128)
    description: str | None = None
    school_id: UUID


class EnrollmentRead(BaseModel):
    course_id: UUID
    course_title: str
    subject: str
    progress: float


@router.get("", response_model=list[CourseRead])
async def list_courses(db: DbSession, user: CurrentUser) -> list[Course]:
    result = await db.execute(select(Course).order_by(Course.created_at.desc()).limit(50))
    return list(result.scalars().all())


@router.post(
    "",
    response_model=CourseRead,
    dependencies=[Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
)
async def create_course(payload: CourseCreate, db: DbSession, user: CurrentUser) -> Course:
    course = Course(
        school_id=payload.school_id,
        title=payload.title,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/me/enrolled")
async def my_enrolled_courses(db: DbSession, user: CurrentUser) -> list[dict]:
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course))
        .where(Enrollment.student_user_id == user.id)
    )
    enrollments = result.scalars().all()
    return [
        {
            "course_id": str(e.course_id),
            "course_title": e.course.title if e.course else "Unknown",
            "subject": e.course.subject if e.course else "N/A",
            "progress": e.progress_pct,
        }
        for e in enrollments
    ]


@router.post("/enroll/{course_id}")
async def enroll_in_course(course_id: UUID, db: DbSession, user: CurrentUser) -> dict:
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.student_user_id == user.id,
            Enrollment.course_id == course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")

    enrollment = Enrollment(student_user_id=user.id, course_id=course_id)
    db.add(enrollment)
    await db.commit()
    return {"status": "enrolled", "course_id": str(course_id)}

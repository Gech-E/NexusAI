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


# ─────────────────────────────────────────────
# Teacher courses, course detail, progress, delete
# ─────────────────────────────────────────────

from sqlalchemy import func


@router.get("/me/teaching")
async def my_teaching_courses(
    db: DbSession,
    user: CurrentUser,
) -> list[dict]:
    """Return courses where the current user is the teacher."""
    result = await db.execute(
        select(Course)
        .where(Course.teacher_user_id == user.id)
        .order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()
    output = []
    for c in courses:
        # Student count
        enroll_q = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == c.id)
        )
        student_count = enroll_q.scalar() or 0
        output.append({
            "id": str(c.id),
            "title": c.title,
            "subject": c.subject,
            "description": c.description,
            "school_id": str(c.school_id),
            "students": student_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return output


@router.get("/{course_id}")
async def get_course_detail(course_id: UUID, db: DbSession, user: CurrentUser) -> dict:
    """Get a single course with enrollment and quiz counts."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Enrollment count
    enroll_q = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
    )
    enrollment_count = enroll_q.scalar() or 0

    # Quiz count
    from app.infrastructure.models.assessment import Quiz
    quiz_q = await db.execute(
        select(func.count(Quiz.id)).where(Quiz.course_id == course_id)
    )
    quiz_count = quiz_q.scalar() or 0

    return {
        "id": str(course.id),
        "title": course.title,
        "subject": course.subject,
        "description": course.description,
        "code": course.code,
        "school_id": str(course.school_id),
        "teacher_user_id": str(course.teacher_user_id) if course.teacher_user_id else None,
        "enrollment_count": enrollment_count,
        "quiz_count": quiz_count,
        "created_at": course.created_at.isoformat() if course.created_at else None,
    }


class ProgressUpdate(BaseModel):
    progress_pct: float = Field(ge=0.0, le=100.0)


@router.put("/{course_id}/progress")
async def update_progress(
    course_id: UUID, payload: ProgressUpdate, db: DbSession, user: CurrentUser
) -> dict:
    """Update a student's progress in a course."""
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_user_id == user.id,
            Enrollment.course_id == course_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    enrollment.progress_pct = payload.progress_pct
    await db.commit()
    return {"course_id": str(course_id), "progress_pct": enrollment.progress_pct}


@router.delete(
    "/{course_id}",
    dependencies=[Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))],
)
async def delete_course(course_id: UUID, db: DbSession) -> dict:
    """Delete a course (teacher/admin only)."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await db.delete(course)
    await db.commit()
    return {"status": "deleted", "course_id": str(course_id)}

from app.infrastructure.models.academic import Course, Enrollment
from app.infrastructure.models.ai_data import AIConversation, AIMessage, Recommendation
from app.infrastructure.models.analytics import AnalyticsEvent, AnalyticsSnapshot
from app.infrastructure.models.assessment import Question, Quiz, QuizAttempt, QuizResult
from app.infrastructure.models.base import Base
from app.infrastructure.models.exam import CVAlert, ExamSession
from app.infrastructure.models.institution import School
from app.infrastructure.models.profile import StudentProfile, TeacherProfile
from app.infrastructure.models.sync import OfflineSyncLog
from app.infrastructure.models.user import RefreshToken, User, UserRole, UserRoleAssignment

__all__ = [
    "Base",
    "User",
    "UserRole",
    "UserRoleAssignment",
    "RefreshToken",
    "School",
    "StudentProfile",
    "TeacherProfile",
    "Course",
    "Enrollment",
    "Quiz",
    "Question",
    "QuizAttempt",
    "QuizResult",
    "AIConversation",
    "AIMessage",
    "Recommendation",
    "AnalyticsSnapshot",
    "AnalyticsEvent",
    "ExamSession",
    "CVAlert",
    "OfflineSyncLog",
]

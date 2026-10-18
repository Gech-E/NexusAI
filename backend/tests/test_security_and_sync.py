from types import SimpleNamespace
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.api.v1.endpoints.quizzes import can_manage_quiz
from app.api.v1.endpoints.sync import SyncPayload
from app.core.config import Settings
from app.infrastructure.models.user import UserRole


def test_quiz_management_policy():
    owner = uuid4()
    quiz = SimpleNamespace(created_by_user_id=owner)
    for role, identity, allowed in [
        (UserRole.STUDENT, owner, False),
        (UserRole.TEACHER, owner, True),
        (UserRole.TEACHER, uuid4(), False),
        (UserRole.ADMIN, uuid4(), True),
    ]:
        user = SimpleNamespace(id=identity, roles=[SimpleNamespace(role=role)])
        assert can_manage_quiz(quiz, user) is allowed


def test_sync_validation_and_batch_size():
    assert SyncPayload(device_id="browser", records=[]).records == []
    for invalid in [
        {"device_id": "", "records": []},
        {"device_id": "browser", "records": [{"entity_type": "", "entity_id": "1"}]},
        {"device_id": "browser", "records": [{"entity_type": "quiz", "entity_id": "1", "operation": "delete"}]},
        {"device_id": "browser", "records": [{"entity_type": "quiz", "entity_id": "1"}] * 101},
    ]:
        with pytest.raises(ValidationError):
            SyncPayload.model_validate(invalid)


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError):
        Settings(app_env="production", JWT_SECRET_KEY="dev-only-change-me-16chars", _env_file=None)

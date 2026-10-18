"""Authenticated, origin-restricted exam notification channel.

The CV inference pipeline is not wired in here. Do not fabricate proctoring
incidents or silently accept unverified student video streams.
"""
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import decode_token_safe
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.models.user import User, UserRole

router = APIRouter(prefix="/ws", tags=["websockets"])


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, teacher_id: str) -> None:
        await websocket.accept()
        self.active_connections[teacher_id].add(websocket)

    def disconnect(self, websocket: WebSocket, teacher_id: str) -> None:
        self.active_connections[teacher_id].discard(websocket)
        if not self.active_connections[teacher_id]:
            self.active_connections.pop(teacher_id, None)

    async def send_personal_message(self, message: str, teacher_id: str) -> None:
        for websocket in tuple(self.active_connections.get(teacher_id, ())):
            try:
                await websocket.send_text(message)
            except (RuntimeError, WebSocketDisconnect):
                self.disconnect(websocket, teacher_id)


manager = ConnectionManager()


@router.websocket("/cv-alerts/{teacher_id}")
async def cv_alerts_endpoint(websocket: WebSocket, teacher_id: str) -> None:
    origin = websocket.headers.get("origin")
    if origin not in settings.cors_origins:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Browser WebSocket cannot send Authorization headers; a short-lived
    # access token is sent using Sec-WebSocket-Protocol instead of a URL.
    protocols = websocket.scope.get("subprotocols") or []
    token = next((p.removeprefix("nexus.jwt.") for p in protocols if p.startswith("nexus.jwt.")), None)
    payload = decode_token_safe(token) if token else None
    try:
        subject = UUID(str(payload.get("sub"))) if payload and payload.get("type") == "access" else None
        requested = UUID(teacher_id)
    except (ValueError, TypeError, AttributeError):
        subject = None
        requested = None
    if not subject or subject != requested:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).options(selectinload(User.roles)).where(User.id == subject, User.is_active.is_(True)))
        user = result.scalar_one_or_none()
        roles = {r.role for r in user.roles} if user else set()
        if not roles.intersection({UserRole.ADMIN, UserRole.TEACHER}):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(websocket, teacher_id)
    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, teacher_id)

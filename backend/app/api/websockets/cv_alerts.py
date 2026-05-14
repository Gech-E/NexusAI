from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
import asyncio
from typing import Dict

router = APIRouter(prefix="/ws", tags=["websockets"])

# In-memory connection manager for teachers
class ConnectionManager:
    def __init__(self):
        # Maps teacher_id to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, teacher_id: str):
        await websocket.accept()
        self.active_connections[teacher_id] = websocket
        logging.info(f"Teacher {teacher_id} connected to CV alerts.")

    def disconnect(self, teacher_id: str):
        if teacher_id in self.active_connections:
            del self.active_connections[teacher_id]
            logging.info(f"Teacher {teacher_id} disconnected.")

    async def send_personal_message(self, message: str, teacher_id: str):
        if teacher_id in self.active_connections:
            await self.active_connections[teacher_id].send_text(message)

manager = ConnectionManager()

@router.websocket("/cv-alerts/{teacher_id}")
async def cv_alerts_endpoint(websocket: WebSocket, teacher_id: str):
    await manager.connect(websocket, teacher_id)
    try:
        while True:
            # Keep connection alive, wait for incoming messages (if any)
            data = await websocket.receive_text()
            
            # This is where we would normally receive a stream of images from the student,
            # pass them to the C++ OpenCV CVMonitor engine via nexus_ai_bindings,
            # and if an alert triggers, broadcast it back to the teacher.
            
            # For demonstration, we just echo back a dummy alert if the teacher pings us
            if data == "ping":
                alert = {
                    "student_id": "std_123",
                    "alert_type": "looking_away",
                    "confidence": 0.89,
                    "timestamp_ms": 1715690000000
                }
                await manager.send_personal_message(json.dumps(alert), teacher_id)

    except WebSocketDisconnect:
        manager.disconnect(teacher_id)

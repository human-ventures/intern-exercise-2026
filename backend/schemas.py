from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from models import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    points: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class StatsResponse(BaseModel):
    total_tasks: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    completed_this_week: int
    overdue_placeholder: int  # placeholder for future use


class ScoreResponse(BaseModel):
    total_xp: int
    streak_count: int
    last_completion_date: Optional[date] = None

    model_config = {"from_attributes": True}


class CompleteTaskResponse(BaseModel):
    task: TaskResponse
    xp_awarded: int
    streak_bonus: int
    total_xp: int
    streak_count: int


class NotificationConfigCreate(BaseModel):
    service: str  # "discord" or "telegram"
    webhook_url: Optional[str] = None
    bot_token: Optional[str] = None
    chat_id: Optional[str] = None
    enabled: bool = True


class NotificationConfigResponse(BaseModel):
    id: int
    service: str
    webhook_url: Optional[str] = None
    chat_id: Optional[str] = None
    enabled: bool

    model_config = {"from_attributes": True}

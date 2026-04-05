from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from models import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    points: int
    due_date: Optional[date] = None
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
    overdue_placeholder: int


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


class BulkCompleteResponse(BaseModel):
    completed_count: int
    total_xp_awarded: int
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

from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Date
from datetime import datetime, timezone, date
import enum

from database import Base


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, default="")
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    points = Column(Integer, default=0)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UserScore(Base):
    __tablename__ = "user_scores"

    id = Column(Integer, primary_key=True, index=True)
    total_xp = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
    last_completion_date = Column(Date, nullable=True)


class NotificationConfig(Base):
    __tablename__ = "notification_config"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, nullable=False)  # "discord" or "telegram"
    webhook_url = Column(String, nullable=True)  # Discord webhook URL
    bot_token = Column(String, nullable=True)  # Telegram bot token
    chat_id = Column(String, nullable=True)  # Telegram chat ID
    enabled = Column(Integer, default=1)

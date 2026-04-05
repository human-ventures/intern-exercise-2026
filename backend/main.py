from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta, date
import httpx

from database import Base, engine, get_db
from models import Task, TaskStatus, TaskPriority, UserScore, NotificationConfig
from schemas import (
    TaskCreate, TaskUpdate, TaskResponse, PaginatedResponse, StatsResponse,
    ScoreResponse, CompleteTaskResponse,
    NotificationConfigCreate, NotificationConfigResponse,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── XP award values ──────────────────────────────────────────────────

XP_BY_PRIORITY = {
    TaskPriority.LOW: 5,
    TaskPriority.MEDIUM: 15,
    TaskPriority.HIGH: 30,
    TaskPriority.URGENT: 50,
}

STREAK_BONUS = 10


# ── Helpers ───────────────────────────────────────────────────────────

def get_or_create_score(db: Session) -> UserScore:
    score = db.query(UserScore).first()
    if not score:
        score = UserScore(total_xp=0, streak_count=0)
        db.add(score)
        db.commit()
        db.refresh(score)
    return score


async def send_notification(db: Session, message: str):
    configs = db.query(NotificationConfig).filter(NotificationConfig.enabled == 1).all()
    async with httpx.AsyncClient(timeout=5.0) as client:
        for cfg in configs:
            try:
                if cfg.service == "discord" and cfg.webhook_url:
                    await client.post(cfg.webhook_url, json={"content": message})
                elif cfg.service == "telegram" and cfg.bot_token and cfg.chat_id:
                    url = f"https://api.telegram.org/bot{cfg.bot_token}/sendMessage"
                    await client.post(url, json={
                        "chat_id": cfg.chat_id,
                        "text": message,
                        "parse_mode": "HTML",
                    })
            except Exception:
                pass  # don't let notification failures break the app


# ── Seed data on startup ──────────────────────────────────────────────

@app.on_event("startup")
def seed_data():
    db = Session(bind=engine)
    if db.query(Task).count() == 0:
        seeds = [
            Task(title="Set up CI/CD pipeline", description="Configure GitHub Actions for automated testing and deployment", status=TaskStatus.DONE, priority=TaskPriority.HIGH),
            Task(title="Design database schema", description="Create ERD and define all tables for the project", status=TaskStatus.DONE, priority=TaskPriority.HIGH),
            Task(title="Implement user authentication", description="Add JWT-based auth with login and signup endpoints", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH),
            Task(title="Write API documentation", description="Document all endpoints using OpenAPI/Swagger", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Add input validation", description="Validate all user inputs on both frontend and backend", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Set up error monitoring", description="Integrate Sentry or similar error tracking service", status=TaskStatus.TODO, priority=TaskPriority.LOW),
            Task(title="Create onboarding flow", description="Build a step-by-step onboarding experience for new users", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Optimize database queries", description="Review and optimize slow queries, add proper indexes", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH),
            Task(title="Add export to CSV feature", description="Allow users to export their task list as a CSV file", status=TaskStatus.TODO, priority=TaskPriority.LOW),
            Task(title="Implement dark mode", description="Add dark mode toggle with system preference detection", status=TaskStatus.TODO, priority=TaskPriority.LOW),
            Task(title="Write unit tests", description="Achieve 80% code coverage with unit tests", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.MEDIUM),
            Task(title="Mobile responsive design", description="Ensure all pages work well on mobile devices", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Add search functionality", description="Full-text search across task titles and descriptions", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Performance audit", description="Run Lighthouse audit and fix performance issues", status=TaskStatus.TODO, priority=TaskPriority.LOW),
            Task(title="Deploy to production", description="Set up production environment and deploy v1.0", status=TaskStatus.TODO, priority=TaskPriority.URGENT),
            Task(title="Security review", description="Conduct security audit and fix vulnerabilities", status=TaskStatus.TODO, priority=TaskPriority.URGENT),
            Task(title="Create admin dashboard", description="Build admin panel for user management and analytics", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Add notification system", description="Email and in-app notifications for task updates", status=TaskStatus.TODO, priority=TaskPriority.LOW),
            Task(title="Implement rate limiting", description="Add rate limiting to prevent API abuse", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH),
            Task(title="Code review guidelines", description="Document code review process and standards", status=TaskStatus.DONE, priority=TaskPriority.MEDIUM),
            Task(title="Load testing", description="Run load tests and identify bottlenecks", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
            Task(title="Backup strategy", description="Implement automated database backup solution", status=TaskStatus.TODO, priority=TaskPriority.HIGH),
            Task(title="Accessibility audit", description="Ensure WCAG 2.1 AA compliance", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM),
        ]
        db.add_all(seeds)
        db.commit()
    db.close()


# ── CRUD endpoints ─────────────────────────────────────────────────────

@app.get("/api/tasks", response_model=PaginatedResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    search: str | None = None,
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at|title|priority|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    # Sort
    sort_column = getattr(Task, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    total = query.count()

    tasks = query.offset((page - 1) * per_page).limit(per_page).all()

    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        tasks=tasks,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@app.post("/api/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


# ── Gamification endpoints ────────────────────────────────────────────

@app.post("/api/tasks/{task_id}/complete", response_model=CompleteTaskResponse)
async def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == TaskStatus.DONE:
        raise HTTPException(status_code=400, detail="Task already completed")

    # Calculate XP
    base_xp = XP_BY_PRIORITY.get(task.priority, 5)
    score = get_or_create_score(db)

    # Streak logic
    today = date.today()
    streak_bonus = 0
    if score.last_completion_date:
        delta = (today - score.last_completion_date).days
        if delta == 1:
            score.streak_count += 1
            streak_bonus = STREAK_BONUS * score.streak_count
        elif delta > 1:
            score.streak_count = 1
        # delta == 0: same day, streak stays, no extra bonus
    else:
        score.streak_count = 1

    total_awarded = base_xp + streak_bonus

    # Update task
    task.status = TaskStatus.DONE
    task.points = total_awarded

    # Update score
    score.total_xp += total_awarded
    score.last_completion_date = today

    db.commit()
    db.refresh(task)
    db.refresh(score)

    # Send notification (fire and forget)
    streak_text = f" | Streak: {score.streak_count} days" if score.streak_count > 1 else ""
    msg = f"Task completed: {task.title}\n+{total_awarded} XP (base {base_xp}" + \
          (f" + {streak_bonus} streak bonus" if streak_bonus else "") + \
          f"){streak_text}\nTotal XP: {score.total_xp}"
    await send_notification(db, msg)

    return CompleteTaskResponse(
        task=task,
        xp_awarded=base_xp,
        streak_bonus=streak_bonus,
        total_xp=score.total_xp,
        streak_count=score.streak_count,
    )


@app.get("/api/users/me/score", response_model=ScoreResponse)
def get_score(db: Session = Depends(get_db)):
    score = get_or_create_score(db)
    # Check if streak is still active (no completion yesterday or today = broken)
    if score.last_completion_date:
        delta = (date.today() - score.last_completion_date).days
        if delta > 1:
            score.streak_count = 0
            db.commit()
            db.refresh(score)
    return score


# ── Notification config endpoints ─────────────────────────────────────

@app.post("/api/notifications/config", response_model=NotificationConfigResponse)
def create_notification_config(config: NotificationConfigCreate, db: Session = Depends(get_db)):
    # Replace existing config for the same service
    existing = db.query(NotificationConfig).filter(NotificationConfig.service == config.service).first()
    if existing:
        existing.webhook_url = config.webhook_url
        existing.bot_token = config.bot_token
        existing.chat_id = config.chat_id
        existing.enabled = 1 if config.enabled else 0
        db.commit()
        db.refresh(existing)
        return existing

    db_config = NotificationConfig(
        service=config.service,
        webhook_url=config.webhook_url,
        bot_token=config.bot_token,
        chat_id=config.chat_id,
        enabled=1 if config.enabled else 0,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@app.get("/api/notifications/config", response_model=list[NotificationConfigResponse])
def list_notification_configs(db: Session = Depends(get_db)):
    return db.query(NotificationConfig).all()


@app.delete("/api/notifications/config/{config_id}")
def delete_notification_config(config_id: int, db: Session = Depends(get_db)):
    cfg = db.query(NotificationConfig).filter(NotificationConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    db.delete(cfg)
    db.commit()
    return {"message": "Notification config deleted"}


@app.post("/api/notifications/test")
async def test_notification(db: Session = Depends(get_db)):
    await send_notification(db, "Test notification from Task Manager! Your integration is working.")
    return {"message": "Test notification sent"}


# ── Stats endpoint (for Section B) ────────────────────────────────────

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Task).count()

    by_status = {}
    for status in TaskStatus:
        count = db.query(Task).filter(Task.status == status).count()
        by_status[status.value] = count

    by_priority = {}
    for priority in TaskPriority:
        count = db.query(Task).filter(Task.priority == priority).count()
        by_priority[priority.value] = count

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    completed_this_week = (
        db.query(Task)
        .filter(Task.status == TaskStatus.DONE, Task.updated_at >= week_ago)
        .count()
    )

    return StatsResponse(
        total_tasks=total,
        by_status=by_status,
        by_priority=by_priority,
        completed_this_week=completed_this_week,
        overdue_placeholder=0,
    )

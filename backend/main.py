from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from database import Base, engine, get_db
from models import Task, TaskStatus, TaskPriority
from schemas import TaskCreate, TaskUpdate, TaskResponse, PaginatedResponse, StatsResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    tasks = query.offset(page * per_page).limit(per_page).all()

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
        raise HTTPException(status_code=400, detail="Task not found")
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=400, detail="Task not found")

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
        raise HTTPException(status_code=400, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


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

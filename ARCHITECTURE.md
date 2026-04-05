# Task Manager -- System Architecture and Documentation

A gamified task management application with XP rewards, daily streaks, Discord/Telegram notifications, and a visual dashboard.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Feature Deep Dives](#feature-deep-dives)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Notification System](#notification-system)
10. [Gamification Logic](#gamification-logic)
11. [Background Processes](#background-processes)

---

## System Overview

```
+------------------+       HTTP/JSON       +------------------+       SQLite
|                  | <------------------->  |                  | <----------->  tasks.db
|   Next.js App    |    localhost:8000      |   FastAPI Server |
|   (React 19)     |                       |   (Python 3.13)  |
|   localhost:3000  |                       |                  |-----> Discord Webhook
|                  |                       |                  |-----> Telegram Bot API
+------------------+                       +------------------+
     |                                           |
     |  Tailwind CSS v4                          |  SQLAlchemy ORM
     |  Recharts (charts)                        |  Pydantic (validation)
     |  Framer Motion (animations)               |  httpx (async HTTP)
     |  Axios (HTTP client)                      |  asyncio (background tasks)
```

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Axios
- **Backend:** FastAPI 0.115, Python 3.13, SQLAlchemy 2.0, Pydantic 2.9, httpx, uvicorn
- **Database:** SQLite (file: `backend/tasks.db`)
- **Notifications:** Discord (webhooks), Telegram (Bot API)

---

## Project Structure

```
/
+-- backend/
|   +-- database.py          # SQLAlchemy engine, SessionLocal, Base, get_db dependency
|   +-- models.py            # ORM models: Task, UserScore, TaskReminder, NotificationConfig
|   +-- schemas.py           # Pydantic request/response schemas
|   +-- main.py              # FastAPI app, all endpoints, background loops
|   +-- requirements.txt     # Python dependencies
|   +-- tasks.db             # SQLite database (auto-created on startup)
|
+-- frontend/
|   +-- app/
|   |   +-- layout.tsx       # Root layout (fonts, global styles)
|   |   +-- globals.css      # Tailwind v4 config, CSS theme variables, animations
|   |   +-- page.tsx         # Main task list page (/, URL-synced filters)
|   |   +-- dashboard/
|   |   |   +-- page.tsx     # Dashboard with charts (/dashboard)
|   |   +-- notifications/
|   |   |   +-- page.tsx     # Discord/Telegram config (/notifications)
|   |   +-- landing/
|   |       +-- page.tsx     # Marketing landing page (/landing)
|   +-- lib/
|   |   +-- api.ts           # Axios client, all API functions, TypeScript interfaces
|   |   +-- utils.ts         # cn() utility (clsx + tailwind-merge)
|   +-- components/
|       +-- ui/
|           +-- the-infinite-grid.tsx  # Animated grid background component
|
+-- DECISIONS.md             # Decision log for each section
+-- ARCHITECTURE.md          # This file
+-- README.md                # Setup instructions
```

---

## Backend Architecture

### database.py -- Database Layer

```
SQLite file (tasks.db)
    |
    v
create_engine(check_same_thread=False)  -- allows multi-thread access
    |
    v
SessionLocal = sessionmaker(...)        -- creates DB sessions
    |
    v
get_db()                                -- FastAPI dependency injection
    yields session, closes on completion
```

The `Base` class (DeclarativeBase) is the parent for all ORM models. `Base.metadata.create_all(bind=engine)` runs on app startup to create tables if they don't exist.

### models.py -- Data Models

Four SQLAlchemy models:

**Task** -- the core entity
```
id           INTEGER PRIMARY KEY
title        STRING NOT NULL
description  STRING DEFAULT ""
status       ENUM(todo, in_progress, done)
priority     ENUM(low, medium, high, urgent)
points       INTEGER DEFAULT 0          -- XP awarded on completion
due_date     DATE NULLABLE              -- optional deadline
created_at   DATETIME                   -- set on creation (UTC)
updated_at   DATETIME                   -- auto-updates on any change (onupdate trigger)
```

**UserScore** -- single-row XP tracker
```
id                    INTEGER PRIMARY KEY
total_xp              INTEGER DEFAULT 0
streak_count          INTEGER DEFAULT 0
last_completion_date  DATE NULLABLE
```

**TaskReminder** -- scheduled notification triggers
```
id          INTEGER PRIMARY KEY
task_id     INTEGER NOT NULL      -- FK to tasks.id (logical, not enforced)
remind_at   DATETIME NOT NULL     -- UTC timestamp to fire the reminder
sent        INTEGER DEFAULT 0     -- 0=pending, 1=sent
```

**NotificationConfig** -- Discord/Telegram integration credentials
```
id           INTEGER PRIMARY KEY
service      STRING NOT NULL       -- "discord" or "telegram"
webhook_url  STRING NULLABLE       -- Discord webhook URL
bot_token    STRING NULLABLE       -- Telegram bot token
chat_id      STRING NULLABLE       -- Telegram chat/user ID
enabled      INTEGER DEFAULT 1     -- 0=disabled, 1=enabled
```

### schemas.py -- Request/Response Validation

Pydantic models enforce types, constraints, and serialization:

- **TaskCreate:** title (1-200 chars via Field), description, status, priority, due_date
- **TaskUpdate:** all fields optional, same title length constraint
- **TaskResponse:** full task with `from_attributes=True` for ORM compatibility
- **PaginatedResponse:** wraps task list with total, page, per_page, total_pages
- **ScoreResponse:** total_xp, streak_count, last_completion_date
- **CompleteTaskResponse:** task + xp_awarded + streak_bonus + totals
- **BulkCompleteResponse:** completed_count + total_xp_awarded + totals
- **ReminderCreate:** remind_in_minutes (integer, minutes from now)
- **ReminderResponse:** id, task_id, remind_at, sent
- **NotificationConfigCreate/Response:** service type + credentials
- **StatsResponse:** aggregated counts by status and priority

### main.py -- Application Logic

The FastAPI app is organized into sections:

1. **Middleware:** CORS allowing localhost:3000
2. **Constants:** XP_BY_PRIORITY mapping, STREAK_BONUS = 10
3. **Helpers:** get_or_create_score(), send_notification()
4. **Seed data:** 23 tasks on first startup
5. **Background loops:** reminder checker (30s), due-date alerts (1h)
6. **CRUD endpoints:** standard REST for tasks
7. **Gamification endpoints:** complete, bulk-complete, score
8. **Reminder endpoints:** create reminder, list reminders
9. **Notification endpoints:** config CRUD, test, manual remind trigger
10. **Stats endpoint:** aggregated dashboard data

---

## Frontend Architecture

### Routing (Next.js App Router)

```
/                  -- Task list page (page.tsx)
/dashboard         -- Charts and stats (dashboard/page.tsx)
/notifications     -- Discord/Telegram config (notifications/page.tsx)
/landing           -- Marketing landing page (landing/page.tsx)
```

All pages are client components ("use client") since they use hooks for state, effects, and URL params.

### State Management

No external state library. Each page manages its own state:

- **Task page:** URL params (useSearchParams) drive filters. Task data, score, toasts, XP popup, form state are all local useState/useRef.
- **Dashboard:** Single fetchStats() call on mount, stats in useState.
- **Notifications:** Config list + form inputs in local state.

### lib/api.ts -- API Client

Centralized Axios instance (`baseURL: http://localhost:8000`) with typed functions:

```
fetchTasks(filters)       -> PaginatedResponse
createTask(task)          -> Task
updateTask(id, task)      -> Task
deleteTask(id)            -> void
completeTask(id)          -> CompleteTaskResult
bulkComplete()            -> BulkCompleteResult
fetchScore()              -> Score
fetchStats()              -> Stats
setTaskReminder(id, min)  -> void
saveNotificationConfig()  -> NotificationConfig
fetchNotificationConfigs() -> NotificationConfig[]
deleteNotificationConfig() -> void
testNotification()        -> void
triggerReminder()         -> void
```

### CSS Architecture

Tailwind CSS v4 with custom theme variables defined in `globals.css` via `@theme`:

```css
@theme {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-primary: #0a0a0a;
  --color-primary-foreground: #fafafa;
  --color-secondary: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-border: #e5e5e5;
  ...
}
```

These map to Tailwind classes like `bg-background`, `text-foreground`, `border-border`, enabling shadcn-compatible component styling.

Custom animation `animate-slide-up` for toast notifications.

---

## Database Schema

```
+------------------+     +------------------+     +---------------------+
|      tasks       |     |   user_scores    |     | notification_config |
+------------------+     +------------------+     +---------------------+
| id (PK)          |     | id (PK)          |     | id (PK)             |
| title            |     | total_xp         |     | service             |
| description      |     | streak_count     |     | webhook_url         |
| status (enum)    |     | last_completion  |     | bot_token           |
| priority (enum)  |     |   _date          |     | chat_id             |
| points           |     +------------------+     | enabled             |
| due_date         |                               +---------------------+
| created_at       |     +------------------+
| updated_at       |     |  task_reminders  |
+------------------+     +------------------+
                          | id (PK)          |
                          | task_id          |
                          | remind_at        |
                          | sent             |
                          +------------------+
```

- **tasks** and **task_reminders** are related by task_id (logical FK, not enforced at DB level)
- **user_scores** is a single-row table (no auth = one global user)
- **notification_config** has at most one row per service (upsert on save)

---

## API Reference

### Task CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks with pagination, filters, sorting |
| POST | `/api/tasks` | Create task (sends notification) |
| GET | `/api/tasks/{id}` | Get single task |
| PUT | `/api/tasks/{id}` | Update task fields |
| DELETE | `/api/tasks/{id}` | Delete task |

**GET /api/tasks query params:**
- `page` (int, default 1) -- 1-based page number
- `per_page` (int, default 10, max 100) -- items per page
- `status` (enum) -- filter by status
- `priority` (enum) -- filter by priority
- `search` (string) -- case-insensitive title search (ILIKE)
- `sort_by` (string) -- one of: created_at, updated_at, title, priority, status, due_date
- `sort_order` (string) -- asc or desc

**Pagination formula:** `offset = (page - 1) * per_page`

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/{id}/complete` | Mark done, award XP, update streak, notify |
| POST | `/api/tasks/bulk-complete` | Complete all non-done tasks at once |
| GET | `/api/users/me/score` | Get total XP and streak info |

### Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/{id}/remind` | Schedule reminder N minutes from now |
| GET | `/api/tasks/{id}/reminders` | List pending (unsent) reminders for a task |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/config` | Create/update Discord or Telegram config |
| GET | `/api/notifications/config` | List all notification configs |
| DELETE | `/api/notifications/config/{id}` | Delete a config |
| POST | `/api/notifications/test` | Send test message to all active configs |
| POST | `/api/notifications/remind` | Manually trigger due-date reminder check |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Aggregated counts by status, priority, completed this week |

---

## Feature Deep Dives

### 1. URL-Synced Filters (B1)

**Problem:** Filter state was lost on page refresh or when sharing URLs.

**Solution:**
```
URL params (source of truth)
    |
    v
useSearchParams() -- reads current URL params
    |
    v
filtersFromParams() -- parses into TaskFilters object (with defaults)
    |
    v
fetchTasks(filters) -- API call with parsed filters
    |
    (on filter change)
    v
filtersToParams() -- serializes back to URL string (omitting defaults)
    |
    v
router.push("/?status=todo&priority=high") -- updates URL, triggers re-render
```

Default values (page=1, sort_by=created_at, sort_order=desc) are omitted from the URL to keep it clean. All filter inputs have controlled `value` props bound to URL state.

### 2. Dashboard Charts (B2)

Five visual components using Recharts:

1. **Donut PieChart** -- task status breakdown (todo/in_progress/done)
   - Inner radius 55, outer 90, padding angle 3
   - Custom label renderer shows percentage inside slices
   - Colors: gray=todo, yellow=in_progress, green=done

2. **BarChart** -- priority distribution
   - Rounded corners (radius [6,6,0,0])
   - Colors: emerald=low, blue=medium, orange=high, red=urgent

3. **RadialBarChart** -- completion percentage
   - Circular progress ring (70%-100% radius)
   - Percentage text centered via absolute positioning

4. **Progress bar breakdowns** -- status and priority
   - Horizontal fill bars with percentage width
   - Count + percentage labels

All charts use `ResponsiveContainer` for fluid widths.

### 3. Task CRUD with Notifications

**Create flow:**
```
Frontend form submit
    |
    v
POST /api/tasks  (with title validation: 1-200 chars)
    |
    v
Task(**task.model_dump())  -- create ORM instance
db.add() -> db.commit() -> db.refresh()
    |
    v
send_notification()  -- async, sends to all active configs
    |
    v
Return TaskResponse to frontend
    |
    v
Success toast + reload task list
```

**Validation is dual-layer:**
- Frontend: live character counter, red border, disabled submit
- Backend: Pydantic Field(min_length=1, max_length=200), returns 422

### 4. Due Dates and Overdue Detection (D2)

**Backend:** `due_date` is a nullable Date column. Included in TaskCreate, TaskUpdate, TaskResponse schemas.

**Frontend overdue logic:**
```python
function isOverdue(task):
    if no due_date or status is done: return false
    parse "YYYY-MM-DD" as local date (not UTC) to avoid timezone offset
    compare against today at midnight
    return due < today  (strict past, not including today)
```

**Visual indicators:**
- Red "OVERDUE" badge next to task title
- Red border + red background tint on the task card
- Red-colored due date text
- Completed tasks never show overdue (they're done)

### 5. Toast Notification System (D3)

```
Error occurs (API call fails)
    |
    v
getApiErrorMessage(err):
    - axios error with detail string -> show detail
    - axios error with detail array  -> join validation messages
    - axios error with status        -> "Server error (status)"
    - axios error with no response   -> "Network error -- is the backend running?"
    - other                           -> "An unexpected error occurred"
    |
    v
addToast(message, "error")
    - assigns unique ID (incrementing counter)
    - adds to toasts state array
    - schedules auto-dismiss after 4 seconds
    |
    v
ToastContainer renders fixed-position stack (bottom-right)
    - Red background for errors, green for success
    - slide-up CSS animation
    - Manual dismiss button (x)
    - Full-width on mobile, fixed-width on desktop
```

### 6. Bulk Complete (D1)

**Backend logic:**
```
POST /api/tasks/bulk-complete
    |
    v
Query all tasks WHERE status != DONE
    |
    v
Calculate streak (once for the batch):
    - If last_completion was yesterday: increment streak, calculate bonus
    - If last_completion was > 1 day ago: reset streak to 1
    - If first completion ever: set streak to 1
    |
    v
For each task:
    - base_xp = XP_BY_PRIORITY[task.priority]
    - awarded = base_xp + streak_bonus_rate
    - task.status = DONE, task.points = awarded
    |
    v
score.total_xp += total_awarded
Single db.commit() (atomic)
    |
    v
Send notification with summary
Return { completed_count, total_xp_awarded, total_xp, streak_count }
```

---

## Data Flow Diagrams

### Task Completion Flow

```
User clicks "Complete" button
    |
    v
Frontend: completeTask(task.id)  -->  POST /api/tasks/{id}/complete
    |                                        |
    |                                        v
    |                                  Find task, check not done
    |                                        |
    |                                        v
    |                                  Calculate XP:
    |                                    base = XP_BY_PRIORITY[priority]
    |                                    streak_bonus = check streak logic
    |                                    total = base + streak_bonus
    |                                        |
    |                                        v
    |                                  Update task: status=done, points=total
    |                                  Update score: total_xp += total
    |                                  db.commit()
    |                                        |
    |                                        v
    |                                  send_notification() --> Discord/Telegram
    |                                        |
    v                                        v
Frontend receives CompleteTaskResponse
    |
    +-- Show XP popup animation (+30 XP!)
    +-- Update score display in navbar
    +-- Update task card (green, strikethrough)
    +-- Popup auto-dismisses after 2.5s
```

### Filter + Pagination Flow

```
User changes status filter to "todo"
    |
    v
handleFilterChange("status", "todo")
    |
    v
setFilters({ ...prev, status: "todo", page: 1 })  // always reset to page 1
    |
    v
filtersToParams({ status: "todo", page: 1, ... })
    -> "status=todo"  (page=1 is default, omitted)
    |
    v
router.push("/?status=todo")
    |
    v
URL changes -> component re-renders
    |
    v
useSearchParams() reads new URL
    |
    v
filtersFromParams() -> { status: "todo", page: 1, per_page: 10, ... }
    |
    v
loadTasks() triggers (searchParams.toString() changed)
    |
    v
GET /api/tasks?status=todo&page=1&per_page=10
    |
    v
Backend filters: WHERE status = 'todo'
Backend paginates: OFFSET 0 LIMIT 10
    |
    v
Frontend renders filtered results
```

---

## Notification System

### Architecture

```
send_notification(db, message)
    |
    v
Query NotificationConfig WHERE enabled = 1
    |
    v
For each active config:
    |
    +-- Discord: POST webhook_url  { "content": message }
    |
    +-- Telegram: POST api.telegram.org/bot{token}/sendMessage
    |              { "chat_id": ..., "text": message, "parse_mode": "HTML" }
    |
    v
Errors are logged (logger.warning) but never block the main request
```

### Notification Triggers

| Event | Message Format |
|-------|---------------|
| Task created | "New task created: {title}\nPriority: {priority}\nDue: {date}" |
| Task completed | "Task completed: {title}\n+{xp} XP (base {n} + {bonus} streak bonus)\nStreak: {n} days\nTotal XP: {n}" |
| Bulk complete | "Bulk complete: {n} tasks done!\n+{xp} XP total\nTotal XP: {n}" |
| Custom reminder | "Reminder: {title}\nPriority: {priority}\nDue: {date}\nStatus: {status}" |
| Due-date digest | "Task Reminder\nOVERDUE (n):\n  - {title} (was due {date})\nDue TODAY (n):\n  - {title} [{priority}]\nDue TOMORROW (n):\n  - {title} [{priority}]" |
| Test | "Test notification from Task Manager! Your integration is working." |

### Config Storage

Discord requires only `webhook_url`. Telegram requires `bot_token` + `chat_id`. Both stored in `notification_config` table. The POST endpoint uses upsert logic: if a config for the same service exists, it updates rather than creating a duplicate.

The `bot_token` is never returned in API responses (`NotificationConfigResponse` omits it) for security.

---

## Gamification Logic

### XP Calculation

```
Priority    Base XP
--------    -------
Low         5
Medium      15
High        30
Urgent      50
```

### Streak System

```
last_completion_date = date of most recent task completion

On new completion:
    today = date.today()
    delta = (today - last_completion_date).days

    if delta == 0:  (same day)
        streak stays unchanged, no streak bonus

    if delta == 1:  (consecutive day)
        streak_count += 1
        streak_bonus = 10 * streak_count

    if delta > 1:   (gap of 2+ days)
        streak_count = 1  (reset)
        streak_bonus = 0

    if first completion ever:
        streak_count = 1
        streak_bonus = 0
```

**Example progression:**
```
Day 1: Complete "high" task    -> 30 base + 0 bonus = 30 XP  (streak: 1)
Day 2: Complete "medium" task  -> 15 base + 20 bonus = 35 XP (streak: 2)
Day 3: Complete "urgent" task  -> 50 base + 30 bonus = 80 XP (streak: 3)
Day 5: (skipped day 4)
        Complete "low" task    -> 5 base + 0 bonus = 5 XP    (streak: 1, reset)
```

### Streak Validation on Read

When `GET /api/users/me/score` is called, it checks if the streak is still valid:
- If `last_completion_date` is more than 1 day ago, `streak_count` is reset to 0
- This prevents stale streak displays without requiring a cron job

---

## Background Processes

Two background tasks run inside the FastAPI event loop:

### 1. Custom Reminder Checker (every 30 seconds)

```
_process_custom_reminders()
    |
    v
Query task_reminders WHERE sent = 0 AND remind_at <= now (UTC)
    |
    v
For each pending reminder:
    - Look up the task by task_id
    - If task exists and is not done: send notification
    - Mark reminder as sent = 1
    |
    v
db.commit()
```

### 2. Due-Date Digest (every 1 hour)

```
_send_due_date_reminders()
    |
    v
Query three groups:
    1. OVERDUE: status != done AND due_date IS NOT NULL AND due_date < today
    2. DUE TODAY: status != done AND due_date == today
    3. DUE TOMORROW: status != done AND due_date == tomorrow
    |
    v
If any tasks found: compose grouped message and send notification
```

### Loop Structure

```python
async def _reminder_loop():
    due_date_counter = 0
    while True:
        await asyncio.sleep(30)        # wake every 30s
        await _process_custom_reminders()  # always check custom reminders
        due_date_counter += 30
        if due_date_counter >= 3600:   # every hour
            due_date_counter = 0
            await _send_due_date_reminders()
```

Both loops use their own `SessionLocal()` instances (not the request-scoped `get_db()`) since they run outside the request lifecycle. Errors are caught and logged to prevent the loop from crashing.

---

## Pages Overview

### / -- Task List (page.tsx)

The main page. Features:
- Navbar: app title, XP counter (star icon), streak counter (fire icon), navigation links
- Create form: title (validated), description, priority select, due date picker
- Filter bar: search, status, priority, sort, "Mark All Complete" button
- Task cards: title, priority badge, overdue badge, XP badge, due date, Complete button, Remind dropdown, status select, Delete button
- Pagination: previous/next with page info
- Toast container: success/error notifications
- XP popup: animated bounce-in on task completion

### /dashboard -- Charts (dashboard/page.tsx)

- 4 summary cards (total, completed, in progress, this week)
- 3 charts (donut, bar, radial progress)
- 2 progress bar breakdowns (status, priority)

### /notifications -- Settings (notifications/page.tsx)

- Service selector (Discord/Telegram tabs)
- Input fields for credentials
- Active integrations list with remove buttons
- Send Test and Send Reminders buttons
- How-it-works section

### /landing -- Marketing Page (landing/page.tsx)

- Animated infinite grid hero background
- Gradient text headline
- Stats bar
- 9 feature cards
- XP system explainer (4 priority tiers)
- Integrations section (Discord + Telegram)
- CTA section
- Footer with navigation

All sections use scroll-triggered fade-in animations via framer-motion `useInView`.

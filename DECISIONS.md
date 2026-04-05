# Decision Log

Use this document to record your thinking as you work through the exercise. We care about *why* you made choices, not just what you did.

---

## Section A — Bug Fixes

### Bug 1 — Wrong HTTP status code for "not found" responses
- **What was the bug?** The GET /api/tasks/{id}, PUT /api/tasks/{id}, and DELETE /api/tasks/{id} endpoints returned HTTP 400 (Bad Request) when a task ID didn't exist, instead of HTTP 404 (Not Found).
- **How did you find it?** Code review of backend/main.py — the HTTPException calls on lines 117, 125, and 140 all used status_code=400 with the message "Task not found", which is semantically incorrect.
- **What was your fix and why?** Changed all three to status_code=404. 404 is the correct HTTP status for a missing resource; 400 means the request itself was malformed. This matters for frontend error handling — the client needs to distinguish "bad request" from "resource doesn't exist."

### Bug 2 — Pagination offset skips the first page of results
- **What was the bug?** The GET /api/tasks endpoint used `query.offset(page * per_page)` for pagination. Since `page` starts at 1, page 1 would skip the first `per_page` items (offset 10 instead of 0).
- **How did you find it?** Code review of the list_tasks endpoint in main.py — the offset formula was wrong for 1-based page numbering. With 23 seed tasks and per_page=10, page 1 would show tasks 11-20 instead of 1-10.
- **What was your fix and why?** Changed to `query.offset((page - 1) * per_page)`. Page 1 now correctly starts at offset 0, page 2 at offset 10, etc.

### Bug 3 — `updated_at` timestamp never updates when editing a task
- **What was the bug?** The Task model's `updated_at` column had a `default` but no `onupdate` trigger, so it was only set at creation time and never changed when a task was modified.
- **How did you find it?** Code review of models.py — the `updated_at` column definition was missing `onupdate`, meaning the "Sort by Updated" feature and the "Completed This Week" stat would use stale timestamps.
- **What was your fix and why?** Added `onupdate=lambda: datetime.now(timezone.utc)` to the column definition. SQLAlchemy's `onupdate` hook fires automatically on any UPDATE, keeping the timestamp accurate without needing manual logic in every endpoint.

### Bug 4 — Changing filters doesn't reset pagination to page 1
- **What was the bug?** In the frontend, changing a filter (status, priority, search, sort) didn't reset the page number. If you were on page 3 and applied a filter that only had 1 page of results, you'd see an empty list.
- **How did you find it?** Code review of the handleFilterChange function in page.tsx — it updated the filter key but preserved the existing page number.
- **What was your fix and why?** Added `page: 1` to the state update in handleFilterChange. Any time a filter changes, pagination resets to page 1 so the user always sees results.

---

## Section B — New Features

### B1: URL-based filtering
- **Approach chosen:** Replaced useState-based filters with useSearchParams (read) + router.push (write). Filters are derived from the URL on every render — no local state duplication. Default values (page=1, sort_by=created_at, etc.) are omitted from the URL to keep it clean; only non-default values appear as query params.
- **Trade-offs considered:** Could have used `router.replace` instead of `router.push` for filter changes to avoid cluttering browser history. Chose `push` so that back/forward buttons work as expected — each filter change is a navigable history entry. Also considered shallow routing but Next.js App Router handles this well with useSearchParams.
- **What would you do differently with more time?** Add debouncing on the search input so it doesn't push a new URL on every keystroke. Could also add URL validation to handle manually-typed invalid query params gracefully.

### B2: Dashboard charts
- **Library/approach chosen and why:** Recharts (already installed). It's React-native, composable, and renders as SVG so charts are crisp at any resolution. Used ResponsiveContainer for all charts so they adapt to screen width.
- **Design decisions:** Built 5 visual components: (1) donut PieChart for task status — inner radius gives space for a cleaner look than a full pie; (2) color-coded BarChart for priority with rounded corners; (3) RadialBarChart showing completion percentage as a circular progress ring; (4-5) horizontal progress bar breakdowns for both status and priority below the charts, giving exact counts + percentages. Custom tooltip component for consistent styling. Colors are semantically meaningful: green=done, yellow=in-progress, gray=todo, red gradient for priority levels.
- **What would you do differently with more time?** Add animated transitions when data changes, a time-series line chart showing task completion trends over weeks, and make the charts interactive (click a bar to filter the task list).

---

## Section C — Open-Ended

### Problem definition
- **How did you interpret "users lose track of important tasks"?**
- **What assumptions did you make?**

### Solution
- **What did you build?**
- **Why this approach over alternatives you considered?**
- **Is this a one-way door or a two-way door? Why?**

### Scope decisions
- **What did you intentionally leave out?**
- **What would v2 look like?**

---

## Section D — Feature Requests

### D1: Bulk mark as complete
- **Approach chosen:**
- **Trade-offs considered:**

### D2: Due dates and overdue highlighting
- **Approach chosen:**
- **Edge cases you considered:**

### D3: Error handling
- **What types of errors did you handle differently, and why?**
- **What would you do differently with more time?**

### D4: Input validation
- **Where did you add validation and why?**
- **How did you ensure consistency?**

---

## General Notes

*Anything else you want us to know — things you learned, challenges you hit, questions you'd ask if this were a real project.*

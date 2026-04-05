# Intern Technical Exercise

A task management application with a **[Next.js](https://nextjs.org/docs)** frontend and **Python ([FastAPI](https://fastapi.tiangolo.com/tutorial/))** backend. Your job is to fix bugs, build features, and make a product decision — all in a weekend.

---

## New to some of these tools?

That's expected. Here are the key references you'll need:

| Tool | What it is | Start here |
|------|-----------|------------|
| [Git](https://git-scm.com/doc) | Version control — tracks changes to your code | [Git basics tutorial](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control) |
| [GitHub](https://github.com) | Hosts Git repos and Pull Requests | [Hello World guide](https://docs.github.com/en/get-started/start-your-journey/hello-world) |
| [Pull Requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) | How you submit code for review | [Creating a PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) |
| [Forking a repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) | Making your own copy of a repo to work on | [Fork a repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) |
| [Python venv](https://docs.python.org/3/library/venv.html) | Isolated Python environment | [venv tutorial](https://docs.python.org/3/tutorial/venv.html) |
| [pip](https://pip.pypa.io/en/stable/) | Python package installer | [pip quickstart](https://pip.pypa.io/en/stable/getting-started/) |
| [FastAPI](https://fastapi.tiangolo.com/) | Python web framework for building APIs | [First steps tutorial](https://fastapi.tiangolo.com/tutorial/first-steps/) |
| [Uvicorn](https://www.uvicorn.org/) | Server that runs your FastAPI app | [Uvicorn docs](https://www.uvicorn.org/#usage) |
| [SQLAlchemy](https://docs.sqlalchemy.org/en/20/) | Python database toolkit (ORM) | [ORM quickstart](https://docs.sqlalchemy.org/en/20/orm/quickstart.html) |
| [Node.js & npm](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) | JavaScript runtime & package manager | [npm intro](https://docs.npmjs.com/getting-started) |
| [Next.js](https://nextjs.org/docs) | React framework for building web apps | [App Router tutorial](https://nextjs.org/learn) |
| [React](https://react.dev/learn) | UI library for building components | [Quick start](https://react.dev/learn) |
| [Tailwind CSS](https://tailwindcss.com/docs) | Utility-first CSS framework | [Core concepts](https://tailwindcss.com/docs/utility-first) |
| [Recharts](https://recharts.org/en-US/guide) | React charting library (pre-installed) | [Getting started](https://recharts.org/en-US/guide) |
| [HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) | What 200, 201, 400, 404 etc. mean | [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) |
| [Browser DevTools](https://developer.chrome.com/docs/devtools) | Inspect network requests, debug issues | [Network tab guide](https://developer.chrome.com/docs/devtools/network) |

You don't need to master all of these — use them as references when you get stuck. **Being resourceful and learning quickly is part of what we're evaluating.**

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm (comes with Node.js)
- [Python](https://www.python.org/downloads/) 3.11+
- [Git](https://git-scm.com/downloads)

### Backend

```bash
cd backend
python -m venv .venv                   # Create an isolated Python environment
source .venv/bin/activate              # Activate it (On Windows: .venv\Scripts\activate)
pip install -r requirements.txt        # Install Python dependencies
uvicorn main:app --reload              # Start the API server with auto-reload
```

The API runs on **http://localhost:8000**. Interactive API docs at http://localhost:8000/docs (try it — you can test endpoints right in the browser).

### Frontend

```bash
cd frontend
npm install       # Install JavaScript dependencies
npm run dev       # Start the dev server with auto-reload
```

The app runs on **http://localhost:3000**.

### Verify It Works

1. Start the backend first (in one terminal), then the frontend (in another terminal).
2. Open http://localhost:3000 — you should see a task list with seed data.
3. Open http://localhost:3000/dashboard — you should see basic stats.

> Something might look off. That's intentional.

---

## The Exercise

### Section A — Bug Fixes

The application has **4 bugs** across the frontend and backend. Find and fix them.

The [Swagger docs](http://localhost:8000/docs) and your browser's [DevTools](https://developer.chrome.com/docs/devtools) are your friends.

For each bug, document in `DECISIONS.md`: what was broken, how you found it, and how you fixed it.

### Section B — New Features

Build these two features:

**B1: URL-based filtering and sorting**

Right now, filters and sorting are only stored in [React component state](https://react.dev/learn/state-a-components-memory). If you share a URL or hit refresh, the filters are lost.

- Sync filter/sort state with URL query parameters
- When the page loads, read filters from the URL
- When filters change, update the URL without a full page reload
- The browser back/forward buttons should work with filter changes

**B2: Dashboard charts**

The dashboard page (`/dashboard`) currently shows numbers in a table. Make it visual.

- Add at least one chart showing the status breakdown (e.g., pie chart, bar chart)
- Add at least one chart showing the priority breakdown
- Use any charting library you like ([Recharts](https://recharts.org/en-US/examples) is already installed, but feel free to swap it)
- The charts should look clean and be easy to read

### Section C — Open-Ended

> **Users have complained that they lose track of important tasks. Make this better.**

That's the entire brief. There is no spec. You decide:

- What does "important" mean?
- What does "lose track" mean?
- What's the right solution?
- How much should you build in the time you have?

This section tests your product thinking, not just your coding. Some questions to consider:

- Is this a one-way door (hard to reverse) or a two-way door (easy to change later)? ([What this means](https://www.inc.com/jeff-haden/amazon-founder-jeff-bezos-this-is-how-successful-people-make-such-smart-decisions.html))
- What's the simplest thing that could work?
- What would you do differently with more time?

Document your thinking in `DECISIONS.md`.

### Section D — Feature Requests

Build these as you see fit. Document your approach in `DECISIONS.md`.

- **D1:** Add a "mark all as complete" bulk action for the current task list.
- **D2:** Add due dates to tasks. Overdue tasks should be visually obvious.
- **D3:** The app silently swallows errors. Fix this — users should know when something goes wrong.
- **D4:** Validate that task titles are 1–200 characters. Everywhere.

---

## AI Tools Policy

**You may and should use AI tools** ([Claude Code](https://claude.ai/download), GitHub Copilot, ChatGPT, etc.).

We are evaluating your **judgment**, not your typing speed. Using AI effectively is a skill we value. If AI helped you make a decision or write code, mention it in your PR — that's a plus, not a minus.

What we're looking for:
- Did you understand what the AI suggested, or did you blindly accept it?
- Did you make good decisions about what to delegate vs. what to think through yourself?
- Can you explain your code, regardless of who (or what) wrote it?

---

## Submission

1. **[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)** this repository
2. Do your work with clear, incremental [commits](https://github.com/git-guides/git-commit)
3. Open a **[Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)** back to `main`
4. Fill in the PR template and `DECISIONS.md`

**Deadline:** 1 week from when you receive this exercise.

---

## Troubleshooting

### `[Errno 98] Address already in use` when starting the backend

Another process is already using port 8000. Find and kill it:

```bash
# See what's using port 8000
lsof -i :8000

# Kill the process (replace PID with the number from the output above)
kill <PID>

# Or kill it in one shot
kill $(lsof -t -i :8000)
```

On Windows, use:
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### `ModuleNotFoundError: No module named 'fastapi'`

You forgot to activate the virtual environment or install dependencies:

```bash
source .venv/bin/activate        # Activate venv first
pip install -r requirements.txt  # Then install
```

### `command not found: uvicorn`

Same as above — uvicorn is installed inside the virtual environment. Make sure you see `(.venv)` in your terminal prompt before running commands.

### Frontend shows "Loading..." forever or network errors

- Make sure the backend is running on port 8000 **before** you start the frontend
- Check the browser [console](https://developer.chrome.com/docs/devtools/console) (right-click → Inspect → Console) for error details
- CORS errors usually mean the backend isn't running

### `npm ERR! ENOENT` or missing packages

```bash
cd frontend
rm -rf node_modules package-lock.json   # Clean slate
npm install                              # Reinstall
```

### Port 3000 already in use (frontend)

Same idea as the backend — kill whatever is using it:

```bash
kill $(lsof -t -i :3000)
npm run dev
```

### Python version errors

Make sure you're on Python 3.11+:

```bash
python --version
```

If you have multiple versions, try `python3` instead of `python`.

### Git / GitHub issues

- **"Permission denied"** when pushing — you need to [set up SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) or use [HTTPS with a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- **"Updates were rejected"** — run `git pull --rebase origin main` first, then push again
- **Never used Git?** Start with the [GitHub Hello World](https://docs.github.com/en/get-started/start-your-journey/hello-world) guide. It takes 10 minutes.

### Still stuck?

- **Don't know what a file does?** Read it. Read the imports. Google the unfamiliar parts. That's literally the job.
- **Getting an error you don't understand?** Copy the full error message and paste it into Google or ChatGPT. This is what every developer does.

Good luck. We're excited to see how you think.

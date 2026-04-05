"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  bulkComplete,
  fetchScore,
  setTaskReminder,
  type Task,
  type PaginatedResponse,
  type TaskFilters,
  type Score,
} from "@/lib/api";
import axios from "axios";

// ── Toast notification system (D3) ──────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

let toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 animate-slide-up ${
            t.type === "error"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          <span>{t.type === "error" ? "!" : "\u2713"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            x
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  medium: "bg-blue-100 text-blue-700 border border-blue-200",
  high: "bg-orange-100 text-orange-700 border border-orange-200",
  urgent: "bg-red-100 text-red-700 border border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};

const DEFAULTS: TaskFilters = {
  page: 1,
  per_page: 10,
  sort_by: "created_at",
  sort_order: "desc",
};

function filtersFromParams(params: URLSearchParams): TaskFilters {
  return {
    page: Number(params.get("page")) || DEFAULTS.page,
    per_page: Number(params.get("per_page")) || DEFAULTS.per_page,
    sort_by: params.get("sort_by") || DEFAULTS.sort_by,
    sort_order: params.get("sort_order") || DEFAULTS.sort_order,
    status: params.get("status") || undefined,
    priority: params.get("priority") || undefined,
    search: params.get("search") || undefined,
  };
}

function filtersToParams(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      const defaultVal = (DEFAULTS as Record<string, unknown>)[key];
      if (String(value) !== String(defaultVal)) {
        params.set(key, String(value));
      }
    }
  });
  return params.toString();
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "done") return false;
  return new Date(task.due_date) < new Date(new Date().toISOString().split("T")[0]);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function XpPopup({ xp, streak }: { xp: number; streak: number }) {
  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl shadow-2xl">
        <p className="text-2xl font-black">+{xp} XP!</p>
        {streak > 1 && (
          <p className="text-sm font-medium opacity-90">
            Streak x{streak} bonus!
          </p>
        )}
      </div>
    </div>
  );
}

// D4: title validation
const TITLE_MIN = 1;
const TITLE_MAX = 200;

function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(", ");
    if (err.response) return `Server error (${err.response.status})`;
    if (err.request) return "Network error — is the backend running?";
  }
  return "An unexpected error occurred";
}

// ── Main component ───────────────────────────────────────────────────

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = filtersFromParams(searchParams);

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<{
    xp: number;
    streak: number;
  } | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: Task["priority"];
    due_date: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });
  const xpPopupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addToast = (message: string, type: "error" | "success" = "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTasks(filters);
      setData(result);
    } catch (err) {
      addToast(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const loadScore = useCallback(async () => {
    try {
      const s = await fetchScore();
      setScore(s);
    } catch (err) {
      console.error("Failed to fetch score:", err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadScore();
  }, [loadScore]);

  const setFilters = (updater: (prev: TaskFilters) => TaskFilters) => {
    const next = updater(filters);
    const qs = filtersToParams(next);
    router.push(qs ? `/?${qs}` : "/");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  // D4: validate title on change
  const handleTitleChange = (value: string) => {
    setNewTask((prev) => ({ ...prev, title: value }));
    if (value.length > TITLE_MAX) {
      setTitleError(`Title must be ${TITLE_MAX} characters or fewer (${value.length}/${TITLE_MAX})`);
    } else if (value.length === 0) {
      setTitleError("Title is required");
    } else {
      setTitleError(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    // D4: frontend validation
    if (newTask.title.length < TITLE_MIN || newTask.title.length > TITLE_MAX) {
      setTitleError(`Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`);
      return;
    }
    try {
      await createTask({
        ...newTask,
        due_date: newTask.due_date || undefined,
      } as Partial<Task>);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      setTitleError(null);
      setShowCreateForm(false);
      addToast("Task created!", "success");
      loadTasks();
    } catch (err) {
      addToast(getApiErrorMessage(err));
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask(task.id, { status: newStatus as Task["status"] });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t
          ),
        };
      });
    } catch (err) {
      addToast(getApiErrorMessage(err));
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      const result = await completeTask(task.id);
      if (xpPopupTimer.current) clearTimeout(xpPopupTimer.current);
      setXpPopup({
        xp: result.xp_awarded + result.streak_bonus,
        streak: result.streak_count,
      });
      xpPopupTimer.current = setTimeout(() => setXpPopup(null), 2500);
      setScore({
        total_xp: result.total_xp,
        streak_count: result.streak_count,
        last_completion_date: null,
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id ? result.task : t
          ),
        };
      });
    } catch (err) {
      addToast(getApiErrorMessage(err));
    }
  };

  // D1: bulk mark all complete
  const handleBulkComplete = async () => {
    setBulkLoading(true);
    try {
      const result = await bulkComplete();
      if (xpPopupTimer.current) clearTimeout(xpPopupTimer.current);
      setXpPopup({
        xp: result.total_xp_awarded,
        streak: result.streak_count,
      });
      xpPopupTimer.current = setTimeout(() => setXpPopup(null), 2500);
      setScore({
        total_xp: result.total_xp,
        streak_count: result.streak_count,
        last_completion_date: null,
      });
      addToast(`${result.completed_count} tasks completed! +${result.total_xp_awarded} XP`, "success");
      loadTasks();
    } catch (err) {
      addToast(getApiErrorMessage(err));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRemind = async (taskId: number, minutes: number) => {
    try {
      await setTaskReminder(taskId, minutes);
      addToast(`Reminder set for ${minutes} min from now`, "success");
    } catch (err) {
      addToast(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (err) {
      addToast(getApiErrorMessage(err));
    }
  };

  const hasIncompleteTasks = data?.tasks.some((t) => t.status !== "done");

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* D3: Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* XP Popup Animation */}
      {xpPopup && <XpPopup xp={xpPopup.xp} streak={xpPopup.streak} />}

      {/* Navbar with XP + Streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-500 mt-1">Manage your team&apos;s tasks</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {score && (
            <div className="flex items-center gap-2 mr-1">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 px-2.5 py-1.5 rounded-lg">
                <span className="text-yellow-600 text-base sm:text-lg">&#9733;</span>
                <span className="font-bold text-yellow-700 text-sm">
                  {score.total_xp} XP
                </span>
              </div>
              {score.streak_count > 0 && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 px-2.5 py-1.5 rounded-lg">
                  <span className="text-orange-500 text-base sm:text-lg">&#128293;</span>
                  <span className="font-bold text-orange-700 text-sm">
                    {score.streak_count}d
                  </span>
                </div>
              )}
            </div>
          )}
          <Link
            href="/dashboard"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            href="/notifications"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Alerts
          </Link>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-black text-white rounded-lg hover:bg-gray-800"
          >
            + New Task
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="grid gap-3">
            {/* D4: title input with validation */}
            <div>
              <input
                type="text"
                placeholder="Task title (1-200 characters)"
                value={newTask.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  titleError
                    ? "border-red-400 focus:ring-red-300"
                    : "border-gray-300"
                }`}
                required
                maxLength={201}
              />
              {titleError && (
                <p className="text-xs text-red-500 mt-1">{titleError}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5 text-right">
                {newTask.title.length}/{TITLE_MAX}
              </p>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) =>
                setNewTask((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    priority: e.target.value as Task["priority"],
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[120px]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {/* D2: due date picker */}
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, due_date: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[140px]"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={!!titleError}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filters + D1: bulk complete button */}
      <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
        />
        <select
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filters.priority || ""}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={filters.sort_by || "created_at"}
          onChange={(e) => handleFilterChange("sort_by", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="created_at">Sort by Created</option>
          <option value="updated_at">Sort by Updated</option>
          <option value="title">Sort by Title</option>
          <option value="priority">Sort by Priority</option>
        </select>
        {/* D1: Mark all complete */}
        {hasIncompleteTasks && (
          <button
            onClick={handleBulkComplete}
            disabled={bulkLoading}
            className="ml-auto px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-sm"
          >
            {bulkLoading ? "Completing..." : "Mark All Complete"}
          </button>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data && data.tasks.length > 0 ? (
        <div className="space-y-2">
          {data.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-all ${
                task.status === "done"
                  ? "border-green-200 bg-green-50/30"
                  : isOverdue(task)
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3
                    className={`font-medium truncate ${
                      task.status === "done"
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  {/* D2: overdue badge */}
                  {isOverdue(task) && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-600 text-white font-bold">
                      OVERDUE
                    </span>
                  )}
                  {task.points > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">
                      +{task.points} XP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {task.description && (
                    <p className="text-sm text-gray-500 truncate max-w-full">
                      {task.description}
                    </p>
                  )}
                  {/* D2: due date display */}
                  {task.due_date && (
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isOverdue(task)
                          ? "text-red-600 font-medium"
                          : task.status === "done"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Due {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                {task.status !== "done" && (
                  <>
                    <button
                      onClick={() => handleComplete(task)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                    >
                      Complete
                    </button>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleRemind(task.id, Number(e.target.value));
                          e.target.value = "";
                        }
                      }}
                      className="px-2 py-1.5 text-xs rounded-lg border border-orange-200 bg-orange-50 text-orange-700 cursor-pointer"
                    >
                      <option value="" disabled>
                        Remind
                      </option>
                      <option value="5">5 min</option>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="60">1 hour</option>
                      <option value="180">3 hours</option>
                      <option value="1440">Tomorrow</option>
                    </select>
                  </>
                )}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border-0 ${STATUS_COLORS[task.status]}`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No tasks found. Create one to get started!
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing page {data.page} of {data.total_pages} ({data.total} total
            tasks)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page || 1) - 1),
                }))
              }
              disabled={data.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(data.total_pages, (prev.page || 1) + 1),
                }))
              }
              disabled={data.page >= data.total_pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

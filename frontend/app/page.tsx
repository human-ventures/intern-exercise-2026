"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  fetchScore,
  type Task,
  type PaginatedResponse,
  type TaskFilters,
  type Score,
} from "@/lib/api";

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

function XpPopup({ xp, streak }: { xp: number; streak: number }) {
  return (
    <div className="fixed top-20 right-8 z-50 animate-bounce">
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

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = filtersFromParams(searchParams);

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [xpPopup, setXpPopup] = useState<{
    xp: number;
    streak: number;
  } | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTasks(filters);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(newTask);
      setNewTask({ title: "", description: "", priority: "medium" });
      setShowCreateForm(false);
      loadTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
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
      console.error("Failed to update task:", err);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      const result = await completeTask(task.id);
      // Show XP popup
      setXpPopup({
        xp: result.xp_awarded + result.streak_bonus,
        streak: result.streak_count,
      });
      setTimeout(() => setXpPopup(null), 2500);
      // Update score
      setScore({
        total_xp: result.total_xp,
        streak_count: result.streak_count,
        last_completion_date: null,
      });
      // Update task in list
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
      console.error("Failed to complete task:", err);
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* XP Popup Animation */}
      {xpPopup && <XpPopup xp={xpPopup.xp} streak={xpPopup.streak} />}

      {/* Navbar with XP + Streak */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-500 mt-1">Manage your team&apos;s tasks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* XP Counter */}
          {score && (
            <div className="flex items-center gap-3 mr-2">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                <span className="text-yellow-600 text-lg">&#9733;</span>
                <span className="font-bold text-yellow-700">
                  {score.total_xp} XP
                </span>
              </div>
              {score.streak_count > 0 && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 px-3 py-1.5 rounded-lg">
                  <span className="text-orange-500 text-lg">&#128293;</span>
                  <span className="font-bold text-orange-700">
                    {score.streak_count}d streak
                  </span>
                </div>
              )}
            </div>
          )}
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            href="/notifications"
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Alerts
          </Link>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
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
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
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
            <div className="flex gap-3 items-center">
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    priority: e.target.value as Task["priority"],
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
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
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data && data.tasks.length > 0 ? (
        <div className="space-y-2">
          {data.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-all ${
                task.status === "done"
                  ? "border-green-200 bg-green-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
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
                  {task.points > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">
                      +{task.points} XP
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 truncate">
                    {task.description}
                  </p>
                )}
              </div>
              {task.status !== "done" && (
                <button
                  onClick={() => handleComplete(task)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                >
                  Complete
                </button>
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

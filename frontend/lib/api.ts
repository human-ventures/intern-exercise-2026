import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse {
  tasks: Task[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Stats {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  completed_this_week: number;
  overdue_placeholder: number;
}

export interface TaskFilters {
  page?: number;
  per_page?: number;
  status?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export async function fetchTasks(
  filters: TaskFilters = {}
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const { data } = await api.get(`/api/tasks?${params.toString()}`);
  return data;
}

export async function fetchTask(id: number): Promise<Task> {
  const { data } = await api.get(`/api/tasks/${id}`);
  return data;
}

export async function createTask(
  task: Partial<Task>
): Promise<Task> {
  const { data } = await api.post("/api/tasks", task);
  return data;
}

export async function updateTask(
  id: number,
  task: Partial<Task>
): Promise<Task> {
  const { data } = await api.put(`/api/tasks/${id}`, task);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get("/api/stats");
  return data;
}

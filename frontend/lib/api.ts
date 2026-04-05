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
  points: number;
  due_date: string | null;
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

export interface Score {
  total_xp: number;
  streak_count: number;
  last_completion_date: string | null;
}

export interface CompleteTaskResult {
  task: Task;
  xp_awarded: number;
  streak_bonus: number;
  total_xp: number;
  streak_count: number;
}

export interface NotificationConfig {
  id: number;
  service: string;
  webhook_url: string | null;
  chat_id: string | null;
  enabled: boolean;
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

export interface BulkCompleteResult {
  completed_count: number;
  total_xp_awarded: number;
  total_xp: number;
  streak_count: number;
}

export async function bulkComplete(): Promise<BulkCompleteResult> {
  const { data } = await api.post("/api/tasks/bulk-complete");
  return data;
}

export async function completeTask(id: number): Promise<CompleteTaskResult> {
  const { data } = await api.post(`/api/tasks/${id}/complete`);
  return data;
}

export async function fetchScore(): Promise<Score> {
  const { data } = await api.get("/api/users/me/score");
  return data;
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get("/api/stats");
  return data;
}

export async function saveNotificationConfig(config: {
  service: string;
  webhook_url?: string;
  bot_token?: string;
  chat_id?: string;
  enabled?: boolean;
}): Promise<NotificationConfig> {
  const { data } = await api.post("/api/notifications/config", config);
  return data;
}

export async function fetchNotificationConfigs(): Promise<NotificationConfig[]> {
  const { data } = await api.get("/api/notifications/config");
  return data;
}

export async function deleteNotificationConfig(id: number): Promise<void> {
  await api.delete(`/api/notifications/config/${id}`);
}

export async function testNotification(): Promise<void> {
  await api.post("/api/notifications/test");
}

export async function triggerReminder(): Promise<void> {
  await api.post("/api/notifications/remind");
}

export async function setTaskReminder(
  taskId: number,
  minutes: number
): Promise<void> {
  await api.post(`/api/tasks/${taskId}/remind`, {
    remind_in_minutes: minutes,
  });
}

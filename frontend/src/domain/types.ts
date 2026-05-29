export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type Priority = 1 | 2 | 3 | 4;
export type PriorityLabel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  status: TaskStatus;
  priority: Priority;
  assignee_id: string | null;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  project_id: string;
  priority?: Priority;
  assignee_id?: string;
  due_date?: string | null;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  due_date?: string | null;
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  1: { label: "Baja",    color: "#6b7280" },
  2: { label: "Media",   color: "#3b82f6" },
  3: { label: "Alta",    color: "#f59e0b" },
  4: { label: "Urgente", color: "#ef4444" },
};

export const COLUMNS: { status: TaskStatus; label: string; emoji: string; color: string }[] = [
  { status: "todo",        label: "Por hacer",    emoji: "📋", color: "#6366f1" },
  { status: "in_progress", label: "En progreso",  emoji: "⚡", color: "#f59e0b" },
  { status: "in_review",   label: "En revisión",  emoji: "👀", color: "#8b5cf6" },
  { status: "done",        label: "Completada",   emoji: "✅", color: "#10b981" },
];

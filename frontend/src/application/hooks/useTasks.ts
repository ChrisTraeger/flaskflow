import { useState, useCallback } from "react";
import { taskService } from "../../infrastructure/services/taskService";
import { Task, CreateTaskDTO, UpdateTaskDTO } from "../../domain/types";

interface Filters {
  status?: string;
  priority?: string;
  assignee_id?: string;
}

// SRP: solo gestiona estado y operaciones de tareas
export const useTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (filters?: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await taskService.getByProject(projectId, filters);
        setTasks(data);
      } catch (e: any) {
        setError(e.message ?? "Error al cargar tareas");
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  const createTask = async (dto: CreateTaskDTO): Promise<Task> => {
    const task = await taskService.create(dto);
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  const updateTask = async (taskId: string, dto: UpdateTaskDTO): Promise<void> => {
    const updated = await taskService.update(taskId, dto);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const moveTask = async (taskId: string, action: "review" | "complete"): Promise<void> => {
    const updated =
      action === "review"
        ? await taskService.sendToReview(taskId)
        : await taskService.complete(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const assignTask = async (taskId: string, assigneeId: string): Promise<void> => {
    const updated = await taskService.assign(taskId, assigneeId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const confirmed = window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    await taskService.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    moveTask,
    assignTask,
    deleteTask,
  };
};

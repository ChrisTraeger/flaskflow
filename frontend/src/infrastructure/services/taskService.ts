import { Task, CreateTaskDTO, UpdateTaskDTO } from "../../domain/types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000/api";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeHeaders(headers: HeadersInit = {}): Record<string, string> {
  if (headers instanceof Headers) {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...authHeaders(), ...normalizeHeaders(options.headers) };
  let res = await fetch(url, { ...options, headers });

  // Si es 401, intentar renovar token y reintentar
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const newHeaders = {
        ...authHeaders(),
        Authorization: `Bearer ${newToken}`,
        ...normalizeHeaders(options.headers),
      };
      res = await fetch(url, { ...options, headers: newHeaders });
    } else {
      // No se pudo renovar — forzar logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.reload();
    }
  }
  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: any = null;
    let text: string | null = null;

    try {
      body = await res.json();
    } catch {
      text = await res.text().catch(() => null);
    }

    const detail =
      body?.error ||
      body?.detail ||
      (body && typeof body === "object"
        ? Object.entries(body)
            .map(([key, value]) =>
              Array.isArray(value) ? `${key}: ${value.join(" / ")}` : `${key}: ${value}`
            )
            .join(" | ")
        : null) ||
      text ||
      `HTTP ${res.status}`;

    const errorMessage = `HTTP ${res.status} - ${detail}`;
    console.error("API response error", { status: res.status, body, text, detail, errorMessage });
    throw new Error(errorMessage);
  }
  return res.json();
}

export const taskService = {
  async getByProject(
    projectId: string,
    filters?: { status?: string; priority?: string; assignee_id?: string }
  ): Promise<Task[]> {
    const params = new URLSearchParams({ project_id: projectId });
    if (filters?.status) params.set("status", filters.status);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.assignee_id) params.set("assignee_id", filters.assignee_id);
    const res = await fetchWithAuth(`${API_URL}/tasks/?${params}`);
    return handleResponse<Task[]>(res);
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    console.debug("Creating task", dto);
    const res = await fetchWithAuth(`${API_URL}/tasks/`, {
      method: "POST",
      body: JSON.stringify(dto),
    });

    // Read raw text to capture backend validation messages even on error.
    let text: string | null = null;
    try {
      text = await res.text();
    } catch (e) {
      text = null;
    }

    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      console.error("API create task error", { status: res.status, body: parsed, text });
      const detail = parsed ?? text ?? `HTTP ${res.status}`;
      const errorDetail = typeof detail === "string" ? detail : JSON.stringify(detail);
      throw new Error(`HTTP ${res.status} - ${errorDetail}`);
    }

    return parsed as Task;
  },

  async update(taskId: string, dto: UpdateTaskDTO): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "update", ...dto }),
    });
    return handleResponse<Task>(res);
  },

  async assign(taskId: string, assigneeId: string): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "assign", assignee_id: assigneeId }),
    });
    return handleResponse<Task>(res);
  },

  async startTask(taskId: string): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "start" }),
    });
    return handleResponse<Task>(res);
  },

  async backToProgress(taskId: string): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "back" }),
    });
    return handleResponse<Task>(res);
  },

  async sendToReview(taskId: string): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "review" }),
    });
    return handleResponse<Task>(res);
  },

  async complete(taskId: string): Promise<Task> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" }),
    });
    return handleResponse<Task>(res);
  },

  async delete(taskId: string): Promise<void> {
    const res = await fetchWithAuth(`${API_URL}/tasks/${taskId}/`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
  },
};
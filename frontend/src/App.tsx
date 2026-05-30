import React, { useState, useEffect } from "react";
import { Task, COLUMNS, PRIORITY_META, Priority } from "./domain/types";
import { useTasks } from "./application/hooks/useTasks";
import Chatbot from "./chatbot";

const PROJECT_ID = "c0bf6187-bb07-4e74-b5e3-b5b87d2ed4e5";
const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000/api";

interface TaskFormState {
  title: string;
  description: string;
  priority: Priority;
  assignee_id: string;
  due_date: string;
}

const EMPTY_FORM: TaskFormState = { title: "", description: "", priority: 2, assignee_id: "", due_date: "" };

const s = {
  app: { minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', sans-serif", color: "#e2e8f0" },
  header: { background: "#1e293b", borderBottom: "1px solid #334155", padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoWrap: { display: "flex", alignItems: "center", gap: "0.6rem" },
  logo: { width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  statBar: { background: "#1e293b", borderBottom: "1px solid #334155", padding: "0.6rem 1.5rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" as const, alignItems: "center" },
  filterBar: { background: "#1e293b", borderBottom: "1px solid #334155", padding: "0.55rem 1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, alignItems: "center" },
  board: { display: "flex", gap: "1rem", padding: "1.25rem 1.5rem", overflowX: "auto" as const, minHeight: "calc(100vh - 168px)" },
  col: { flex: "1", minWidth: 250, background: "#1e293b", borderRadius: 12, padding: "0.9rem", border: "1px solid #334155", display: "flex", flexDirection: "column" as const, gap: "0.6rem" },
  colHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" },
  badge: { background: "#334155", color: "#94a3b8", borderRadius: 12, padding: "0.1rem 0.55rem", fontSize: "0.72rem", fontWeight: 600 },
  card: { background: "#0f172a", borderRadius: 10, padding: "0.8rem", border: "1px solid #334155", cursor: "grab", position: "relative" as const },
  cardTitle: { margin: "0 0 0.3rem", fontWeight: 600, fontSize: "0.88rem", color: "#f1f5f9", paddingRight: "1.2rem" },
  cardDesc: { margin: "0 0 0.5rem", fontSize: "0.76rem", color: "#64748b", lineHeight: 1.4 },
  btn: (bg: string) => ({ background: bg, border: "none", color: "white", padding: "0.45rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.83rem" }),
  iconBtn: { background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1rem", padding: "0", lineHeight: 1 },
  input: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "0.55rem 0.75rem", color: "#e2e8f0", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" as const },
  select: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "0.5rem 0.7rem", color: "#e2e8f0", fontSize: "0.85rem" },
  modal: { position: "fixed" as const, inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modalBox: { background: "#1e293b", borderRadius: 14, padding: "1.75rem", width: 420, border: "1px solid #334155", display: "flex", flexDirection: "column" as const, gap: "0.85rem" },
};

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Completa usuario y contraseña"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { setError("Usuario o contraseña incorrectos"); setLoading(false); return; }
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      onLogin(data.access);
    } catch {
      setError("No se pudo conectar al servidor");
    }
    setLoading(false);
  };

  return (
    <div style={{ ...s.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.modalBox, width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={s.logo}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9" }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Inicia sesión para continuar</p>
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Usuario</label>
          <input
            style={s.input}
            placeholder="admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Contraseña</label>
          <input
            type="password"
            style={s.input}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {error && <p style={{ margin: 0, color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
        <button
          style={{ ...s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)"), width: "100%", padding: "0.65rem" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));

  const handleLogin = (t: string) => setToken(t);
  const handleLogout = () => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); setToken(null); };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return <Board onLogout={handleLogout} />;
}

// ── Transiciones válidas según reglas del dominio ─────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  todo:        ["in_progress"],
  in_progress: ["in_review", "done"],
  in_review:   ["in_progress", "done"],
  done:        [],
};

// ── Board ─────────────────────────────────────────────────────────────────────
function Board({ onLogout }: { onLogout: () => void }) {
  const { tasks, loading, error, setError, fetchTasks, createTask, updateTask, moveTask, deleteTask } = useTasks(PROJECT_ID);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (error && error.includes("401")) onLogout();
  }, [error, onLogout]);

  const applyFilters = () => fetchTasks({ status: filterStatus || undefined, priority: filterPriority || undefined });
  const resetFilters = () => { setFilterStatus(""); setFilterPriority(""); fetchTasks(); };

  const normalizePriority = (value: number): Priority => {
    if ([1, 2, 3, 4].includes(value)) return value as Priority;
    return 2;
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setFormError(null);
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description,
        project_id: PROJECT_ID,
        priority: normalizePriority(Number(form.priority)),
        assignee_id: form.assignee_id.trim() || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
    } catch (error: any) {
      setFormError(error?.message || "Error al crear la tarea");
    }
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditForm({ title: task.title, description: task.description, priority: task.priority, assignee_id: task.assignee_id ?? "", due_date: task.due_date ? task.due_date.slice(0, 16) : "" });
    setFormError(null);
  };

  const handleUpdate = async () => {
    if (!editTask) return;
    setFormError(null);
    try {
      await updateTask(editTask.id, {
        title: editForm.title.trim(),
        description: editForm.description,
        priority: normalizePriority(Number(editForm.priority)),
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
      });
      setEditTask(null);
    } catch (error: any) {
      setFormError(error?.message || "Error al actualizar la tarea");
    }
  };

  const handleDrop = (targetStatus: string) => {
    if (!dragging) return;
    const task = tasks.find(t => t.id === dragging);
    if (!task || task.status === targetStatus) { setDragging(null); return; }

    const allowed = VALID_TRANSITIONS[task.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      setError(`Transición no permitida: "${task.status}" → "${targetStatus}"`);
      setDragging(null);
      return;
    }

    if (targetStatus === "in_progress" && task.status === "todo") moveTask(dragging, "start");
    else if (targetStatus === "in_progress") moveTask(dragging, "back");
    else if (targetStatus === "in_review") moveTask(dragging, "review");
    else if (targetStatus === "done") moveTask(dragging, "complete");
    setDragging(null);
  };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logoWrap}>
          <div style={s.logo}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9" }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Arquitectura Hexagonal · Django + React</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button style={s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)")} onClick={() => setShowCreate(true)}>+ Nueva tarea</button>
          <button style={{ ...s.btn("#334155"), fontSize: "0.78rem" }} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div style={s.statBar}>
        {COLUMNS.map(col => (
          <span key={col.status} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, display: "inline-block" }} />
            <span style={{ color: "#94a3b8" }}>{col.label}:</span>
            <strong style={{ color: col.color }}>{tasks.filter(t => t.status === col.status).length}</strong>
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: "0.8rem" }}>Total: <strong style={{ color: "#e2e8f0" }}>{tasks.length}</strong></span>
      </div>

      <div style={s.filterBar}>
        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Filtrar:</span>
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
        </select>
        <select style={s.select} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Todas las prioridades</option>
          <option value="LOW">Baja</option><option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
        </select>
        <button style={s.btn("#334155")} onClick={applyFilters}>Aplicar</button>
        <button style={{ ...s.btn("#1e293b"), border: "1px solid #334155" }} onClick={resetFilters}>Limpiar</button>
        {loading && <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Cargando…</span>}
        {error && <span style={{ color: "#ef4444", fontSize: "0.8rem", cursor: "pointer" }} onClick={() => setError(null)}>{error} ✕</span>}
      </div>

      <div style={s.board}>
        {COLUMNS.map(col => (
          <div key={col.status} style={{ ...s.col, borderTop: `3px solid ${col.color}` }} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.status)}>
            <div style={s.colHeader}>
              <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{col.emoji} {col.label}</span>
              <span style={s.badge}>{tasks.filter(t => t.status === col.status).length}</span>
            </div>
            {tasks.filter(t => t.status === col.status).map(task => (
              <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onDelete={() => deleteTask(task.id)} onMove={moveTask} onDragStart={() => setDragging(task.id)} onDragEnd={() => setDragging(null)} currentCol={col.status} />
            ))}
            {tasks.filter(t => t.status === col.status).length === 0 && (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "#475569", fontSize: "0.78rem", border: "2px dashed #334155", borderRadius: 8 }}>Arrastra tareas aquí</div>
            )}
          </div>
        ))}
      </div>

      {showCreate && <TaskFormModal title="Nueva tarea" form={form} onChange={setForm} onConfirm={handleCreate} onCancel={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormError(null); }} confirmLabel="Crear tarea" error={formError} />}
      {editTask && <TaskFormModal title={`Editar: ${editTask.title}`} form={editForm} onChange={setEditForm} onConfirm={handleUpdate} onCancel={() => { setEditTask(null); setFormError(null); }} confirmLabel="Guardar cambios" error={formError} />}

      {/* Chatbot flotante */}
      <Chatbot />
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
interface TaskCardProps { task: Task; currentCol: string; onEdit: () => void; onDelete: () => void; onMove: (id: string, action: "review" | "complete" | "back" | "start") => void; onDragStart: () => void; onDragEnd: () => void; }

function TaskCard({ task, currentCol, onEdit, onDelete, onMove, onDragStart, onDragEnd }: TaskCardProps) {
  const p = PRIORITY_META[task.priority];
  const dueDateStr = task.due_date ? new Date(task.due_date).toLocaleDateString("es-CO") : null;
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} style={{ ...s.card, opacity: task.status === "done" ? 0.7 : 1 }}>
      <div style={{ position: "absolute", top: "0.6rem", right: "0.6rem", display: "flex", gap: "0.3rem" }}>
        <button style={s.iconBtn} title="Editar" onClick={onEdit}>✏️</button>
        <button style={s.iconBtn} title="Eliminar" onClick={onDelete}>×</button>
      </div>
      <p style={s.cardTitle}>{task.title}</p>
      {task.description && <p style={s.cardDesc}>{task.description}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: p.color, background: p.color + "22", padding: "0.12rem 0.45rem", borderRadius: 5 }}>{p.label}</span>
        {task.assignee_id && <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>👤 {task.assignee_id.slice(0, 8)}…</span>}
        {dueDateStr && <span style={{ fontSize: "0.7rem", color: task.is_overdue ? "#ef4444" : "#94a3b8" }}>{task.is_overdue ? "⚠️" : "📅"} {dueDateStr}</span>}
      </div>
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" as const }}>
        {currentCol === "todo" && <button onClick={() => onMove(task.id, "start")} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #6366f1", color: "#6366f1", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>▶ Iniciar</button>}
        {currentCol === "in_progress" && <button onClick={() => onMove(task.id, "review")} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #8b5cf6", color: "#8b5cf6", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>→ Revisión</button>}
        {currentCol === "in_review" && <button onClick={() => onMove(task.id, "back")} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #f59e0b", color: "#f59e0b", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>← En progreso</button>}
        {(currentCol === "in_progress" || currentCol === "in_review") && <button onClick={() => onMove(task.id, "complete")} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #10b981", color: "#10b981", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>✓ Completar</button>}
      </div>
    </div>
  );
}

// ── TaskFormModal ─────────────────────────────────────────────────────────────
interface TaskFormModalProps { title: string; form: TaskFormState; onChange: (f: TaskFormState) => void; onConfirm: () => void; onCancel: () => void; confirmLabel: string; error?: string | null; }

function TaskFormModal({ title, form, onChange, onConfirm, onCancel, confirmLabel, error }: TaskFormModalProps) {
  const set = (key: keyof TaskFormState, val: string | number) =>
    onChange({ ...form, [key]: val });
  return (
    <div style={s.modal} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={s.modalBox}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
        <input style={s.input} placeholder="Título *" value={form.title} onChange={e => set("title", e.target.value)} />
        <textarea style={{ ...s.input, resize: "vertical", minHeight: 72 }} placeholder="Descripción" value={form.description} onChange={e => set("description", e.target.value)} />
        <select style={s.input} value={form.priority} onChange={e => set("priority", Number(e.target.value))}>
          <option value={1}>Baja</option>
          <option value={2}>Media</option>
          <option value={3}>Alta</option>
          <option value={4}>Urgente</option>
        </select>
        <input style={s.input} placeholder="ID del asignado (opcional)" value={form.assignee_id} onChange={e => set("assignee_id", e.target.value)} />
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.25rem" }}>Fecha límite (opcional)</label>
          <input type="datetime-local" style={s.input} value={form.due_date} onChange={e => set("due_date", e.target.value)} />
        </div>
        {error && <p style={{ margin: 0, color: "#f87171", fontSize: "0.82rem" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button style={s.btn("#334155")} onClick={onCancel}>Cancelar</button>
          <button style={s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)")} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";

interface Message {
  text: string;
  from: "bot" | "user";
  time: string;
}

const KB = [
  { k: ["qué es taskflow","que es taskflow","de qué trata","de que trata","para qué sirve","para que sirve","descripción","descripcion"], r: "TaskFlow es una app web para gestión de tareas colaborativas. Los equipos pueden crear tareas, asignarlas, cambiar su estado y recibir notificaciones. Usa arquitectura hexagonal para separar la lógica de negocio del framework." },
  { k: ["quiénes hicieron","quienes hicieron","autores","quién lo hizo","quien lo hizo","creadores","equipo"], r: "El proyecto fue desarrollado por:\n• Christian Traeger Gamero\n• Sergio Doria Díaz\n• Juan Cardona Bageth\n\nMateria: Tópicos Avanzados — Ingeniería de Sistemas 2026." },
  { k: ["tecnología","tecnologia","stack","lenguaje","framework","hecho con"], r: "Stack tecnológico:\n• Backend: Django + DRF 4.2\n• Frontend: React 18 + TypeScript\n• Base de datos: PostgreSQL 15\n• Auth: JWT (simplejwt)\n• WebSockets: Django Channels\n• Deploy: Docker + Compose" },
  { k: ["arquitectura","hexagonal","ports","adapters","capas"], r: "TaskFlow usa Arquitectura Hexagonal con 4 capas:\n1. Dominio — reglas de negocio en Python puro\n2. Aplicación — casos de uso e interfaces\n3. Infraestructura — adaptadores concretos\n4. Presentación — API REST" },
  { k: ["solid","principios","srp","ocp","lsp","isp","dip"], r: "Principios SOLID aplicados:\n• SRP: Task solo tiene reglas de negocio\n• OCP: cambiar notificador solo edita container.py\n• LSP: cualquier repositorio es intercambiable\n• ISP: ITaskRepository e INotificationPort separados\n• DIP: casos de uso reciben interfaces, no implementaciones" },
  { k: ["revision","revisión","pasar","completar","estados","flujo","todo","in_progress","in_review","done","kanban"], r: "Flujo de estados:\nTODO → IN_PROGRESS → IN_REVIEW → DONE\n\n• Pasar a revisión: PATCH /api/tasks/{id}/ con action: 'review' (debe estar IN_PROGRESS)\n• Completar: PATCH /api/tasks/{id}/ con action: 'complete'\n• En DONE ya no se puede editar ni reasignar." },
  { k: ["api","endpoints","rutas","rest","http"], r: "Endpoints principales:\n• POST /api/auth/token/ — Login JWT\n• GET /api/tasks/?project_id= — listar con filtros\n• POST /api/tasks/ — crear tarea\n• PATCH /api/tasks/{id}/ — assign/complete/review/update\n• DELETE /api/tasks/{id}/ — eliminar" },
  { k: ["tests","pruebas","testing","unitarios","integración","integracion","pytest"], r: "El proyecto tiene 32 tests:\n• 14 unitarios — entidad Task\n• 7 unitarios — casos de uso con mocks\n• 4 unitarios — value object Email\n• 7 integración — endpoints REST\n\nTodos corren sin base de datos real." },
  { k: ["instalar","instalación","instalacion","docker","levantar","ejecutar"], r: "Con Docker:\n1. cp .env.example .env\n2. docker compose up --build\n3. docker compose exec backend python manage.py migrate\n4. Abre http://localhost:3000" },
  { k: ["hola","hi","hey","buenas","buenos","saludos"], r: "¡Hola! Soy el bot de TaskFlow. Pregúntame sobre el proyecto: arquitectura, tecnología, autores, API, tests y más." },
  { k: ["gracias","thanks","genial","excelente","perfecto"], r: "¡De nada! Si tienes más preguntas sobre TaskFlow, aquí estoy. 🌿" },
  { k: ["quién eres","quien eres","qué eres","que eres","eres un bot"], r: "Soy el chatbot de TaskFlow. Respondo preguntas sobre el proyecto: arquitectura, autores, tecnología, endpoints y tests." },
];

const SUGGESTIONS = [
  "¿Qué es TaskFlow?",
  "¿Quiénes lo hicieron?",
  "¿Cómo pasar a revisión?",
  "¿Cómo instalar?",
  "Stack tecnológico",
  "Principios SOLID",
];

function getTime() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function respond(text: string): string {
  const q = text.toLowerCase();
  for (const item of KB) {
    if (item.k.some((k) => q.includes(k))) return item.r;
  }
  return "No tengo información sobre eso. Puedes preguntarme sobre arquitectura, tecnologías, autores, API, tests o instalación.";
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "¡Hola! Soy el bot de TaskFlow. Pregúntame sobre el proyecto 🌿", from: "bot", time: getTime() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { text: msg, from: "user", time: getTime() }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { text: respond(msg), from: "bot", time: getTime() }]);
    }, 700 + Math.random() * 400);
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: "#1A7A5E", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
        title="Abrir chatbot"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>
          }
        </svg>
      </button>

      {/* Ventana del chat */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 1000,
          width: 360, height: 520, borderRadius: 16,
          background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: "1px solid #ddd",
        }}>
          {/* Header */}
          <div style={{ background: "#0D3B2E", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1A7A5E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8D5C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
              </svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 500, fontSize: 14 }}>TaskFlow Bot</div>
              <div style={{ color: "#A8D5C2", fontSize: 11 }}>En línea · responde al instante</div>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "80%", alignSelf: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  padding: "8px 12px", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  background: m.from === "user" ? "#0D3B2E" : "#f4f7f5",
                  color: m.from === "user" ? "#fff" : "#1a1a1a",
                  fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap",
                  border: m.from === "bot" ? "1px solid #ddd" : "none",
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2, padding: "0 4px" }}>{m.time}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#f4f7f5", borderRadius: "4px 16px 16px 16px", border: "1px solid #ddd", width: "fit-content" }}>
                {[0, 200, 400].map((d, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1A7A5E", animation: `blink 1.2s ${d}ms infinite` }}/>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Sugerencias */}
          <div style={{ padding: "6px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #eee" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} style={{
                background: "#f4f7f5", border: "1px solid #ccc", borderRadius: 20,
                padding: "4px 10px", fontSize: 11, color: "#555", cursor: "pointer",
              }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid #eee" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribe algo..."
              style={{ flex: 1, borderRadius: 20, padding: "7px 14px", fontSize: 13, border: "1px solid #ccc", background: "#f9f9f9", outline: "none" }}
            />
            <button onClick={() => send()} style={{ width: 34, height: 34, borderRadius: "50%", background: "#1A7A5E", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
      `}</style>
    </>
  );
}
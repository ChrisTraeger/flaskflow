# TaskFlow — Sistema de Gestión de Tareas Colaborativas

> Arquitectura Hexagonal · Código Limpio · Principios SOLID  
> Backend: Django REST Framework | Frontend: React 18 + TypeScript | Base de datos: PostgreSQL

---

## Descripción

TaskFlow es una aplicación web de gestión de tareas colaborativas para equipos. Implementa **Arquitectura Hexagonal (Ports & Adapters)** para garantizar que la lógica de negocio sea completamente independiente de frameworks, bases de datos e interfaces de usuario.

---

## Arquitectura

```
taskflow-hexagonal/
├── backend/
│   ├── domain/                     # Entidades, Value Objects, Excepciones (Python puro)
│   │   ├── entities/               # Task (con due_date, is_overdue, update(), send_to_review())
│   │   ├── value_objects/          # TaskStatus (4 estados + transiciones), Priority, Email
│   │   └── exceptions/             # DomainException, TaskNotFoundError, ProjectNotFoundError
│   ├── application/                # Casos de uso y Ports
│   │   ├── container.py            # ★ Contenedor DI centralizado (OCP)
│   │   ├── use_cases/              # CreateTask, AssignTask, CompleteTask, UpdateTask★, SendToReview★
│   │   └── ports/                  # ITaskRepository (con filtros★), INotificationPort
│   ├── infrastructure/             # Adapters
│   │   ├── repositories/           # DjangoTaskRepository (filtros, due_date, logging)
│   │   ├── notifications/          # EmailAdapter, WebSocketAdapter
│   │   └── models/                 # TaskModel (due_date★), ProjectModel, UserModel
│   ├── presentation/api/           # TaskViewSet (todas las acciones, manejo de errores completo★)
│   └── tests/
│       ├── unit/                   # test_task_entity, test_use_cases★, test_email_value_object
│       └── integration/            # test_task_viewset★ (nuevos tests de integración)
└── frontend/
    └── src/
        ├── domain/                 # types.ts (due_date, is_overdue, COLUMNS, PRIORITY_META)
        ├── application/hooks/      # useTasks★ (conectado a API, filtros, update, deleteTask)
        ├── infrastructure/         # taskService (update, sendToReview, manejo de errores)
        └── presentation/           # App.tsx (filtros★, edición★, confirmación de borrado★)
```

---

## Mejoras implementadas (v2)

| # | Mejora | Archivos afectados |
|---|--------|--------------------|
| 1 | `UpdateTaskUseCase` — editar título, descripción, prioridad y fecha límite | `update_task.py`, `task_viewset.py` |
| 2 | `DjangoProjectRepository` + `ProjectViewSet` — proyectos reales en BD | `django_project_repository.py`, `project_viewset.py` |
| 3 | Tests de integración para `TaskViewSet` | `tests/integration/test_task_viewset.py` |
| 4 | `due_date` en entidad `Task` y modelo ORM | `task.py`, `task_model.py`, `serializers.py` |
| 5 | Filtros en `find_by_project` y en el endpoint GET | `task_repository_port.py`, `django_task_repository.py`, `task_viewset.py` |
| 6 | `destroy` maneja `TaskNotFoundError` con 404 | `task_viewset.py` |
| 7 | `useTasks` conectado a la API real | `useTasks.ts` |
| 8 | Modal de edición de tareas en el frontend | `App.tsx` |
| 9 | Filtros por estado y prioridad en el tablero | `App.tsx` |
| 10 | Confirmación antes de eliminar (`window.confirm`) | `useTasks.ts` |
| 11 | `container.py` — wiring de DI centralizado | `application/container.py` |
| 12 | `IN_REVIEW` sincronizado backend ↔ frontend | `task_status.py`, `App.tsx` |
| 13 | Logging en repositorio, casos de uso y ViewSet | `settings.py`, `django_task_repository.py`, `task_viewset.py` |

---

## Flujo de estados de una tarea

```
TODO ──start()──▶ IN_PROGRESS ──send_to_review()──▶ IN_REVIEW
                       │                                  │
                       └──────────complete()──────────────┘
                                      │
                                      ▼
                                    DONE
```

La entidad `Task` valida cada transición. Si se intenta una inválida, lanza `InvalidTaskOperationError` (422 en la API).

---

## Principios SOLID aplicados

| Principio | Aplicación |
|-----------|-----------|
| **SRP** | `Task` solo reglas de negocio. `DjangoTaskRepository` solo persiste. `container.py` solo hace wiring. |
| **OCP** | Agregar `MongoTaskRepository` no modifica dominio ni casos de uso. Cambiar notificador solo edita `container.py`. |
| **LSP** | `DjangoTaskRepository` es intercambiable con cualquier implementación de `ITaskRepository`. |
| **ISP** | `ITaskRepository` separado de `INotificationPort`. Cada port define solo lo que necesita. |
| **DIP** | Los casos de uso reciben interfaces (`ITaskRepository`), nunca implementaciones concretas. |

---

## Endpoints de la API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/token/` | Login (JWT) |
| `POST` | `/api/auth/token/refresh/` | Renovar JWT |
| `GET` | `/api/tasks/?project_id=&status=&priority=&assignee_id=` | Listar con filtros |
| `POST` | `/api/tasks/` | Crear tarea (acepta `due_date`) |
| `PATCH` | `/api/tasks/{id}/` | Acciones: `assign`, `complete`, `review`, `update` |
| `DELETE` | `/api/tasks/{id}/` | Eliminar (404 si no existe) |

---

## Instalación y ejecución

### Con Docker (recomendado)

```bash
cp .env.example .env
# Editar .env con tus valores
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

### Desarrollo local

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install && npm start
```

---

## Tests

```bash
cd backend
pytest tests/ -v

# Resultado esperado:
# tests/unit/test_task_entity.py          .............. (14 tests)
# tests/unit/test_use_cases.py            .......... (7 tests)
# tests/unit/test_email_value_object.py   ....
# tests/integration/test_task_viewset.py  .......
```

Los tests unitarios usan **mocks** — no necesitan base de datos.  
Los tests de integración usan mocks de repositorio — tampoco necesitan DB.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Backend | Django + DRF | 4.2 / 3.14 |
| Frontend | React + TypeScript | 18 / 5.0 |
| Base de datos | PostgreSQL | 15 |
| Autenticación | JWT (simplejwt) | 5.3 |
| Contenedores | Docker + Compose | 24 / 2.2 |
| Testing | pytest + unittest.mock | 7.4 |

---

## Autor

Actividad — Tópicos avanzados  
Ingeniería de Sistemas — 2026

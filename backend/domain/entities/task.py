from dataclasses import dataclass, field
from datetime import datetime
from domain.value_objects.task_status import TaskStatus
from domain.value_objects.priority import Priority
from domain.exceptions import InvalidTaskOperationError


@dataclass
class Task:
    """Entidad Task — representa una tarea del dominio.

    SRP: solo gestiona estado y reglas de negocio de una tarea.
    Sin lógica de persistencia ni de notificación.
    """

    id: str
    title: str
    description: str
    project_id: str
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assignee_id: str | None = None
    due_date: datetime | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def assign_to(self, user_id: str) -> None:
        """Asigna la tarea a un usuario. No se puede reasignar una tarea completada."""
        if self.status == TaskStatus.DONE:
            raise InvalidTaskOperationError("Cannot reassign a completed task")
        self.assignee_id = user_id
        self.updated_at = datetime.utcnow()

    def start(self) -> None:
        """Inicia la tarea. Solo desde TODO."""
        if self.status != TaskStatus.TODO:
            raise InvalidTaskOperationError("Only TODO tasks can be started")
        self.status = TaskStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()

    def send_to_review(self) -> None:
        """Envía la tarea a revisión. Solo desde IN_PROGRESS."""
        if self.status != TaskStatus.IN_PROGRESS:
            raise InvalidTaskOperationError("Task must be in progress to send to review")
        self.status = TaskStatus.IN_REVIEW
        self.updated_at = datetime.utcnow()

    def complete(self) -> None:
        """Completa la tarea. Desde IN_PROGRESS o IN_REVIEW."""
        if self.status not in (TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW):
            raise InvalidTaskOperationError("Task must be in progress or in review to complete")
        self.status = TaskStatus.DONE
        self.updated_at = datetime.utcnow()

    def update(
        self,
        title: str | None = None,
        description: str | None = None,
        priority: Priority | None = None,
        due_date: datetime | None = None,
    ) -> None:
        """Actualiza campos editables de la tarea. No se puede editar una completada."""
        if self.status == TaskStatus.DONE:
            raise InvalidTaskOperationError("Cannot update a completed task")
        if title is not None:
            if not title.strip():
                raise InvalidTaskOperationError("Title cannot be blank")
            self.title = title.strip()
        if description is not None:
            self.description = description
        if priority is not None:
            self.priority = priority
        if due_date is not None:
            self.due_date = due_date
        self.updated_at = datetime.utcnow()

    @property
    def is_overdue(self) -> bool:
        """True si la tarea tiene fecha límite vencida y no está completada."""
        if self.due_date is None or self.status == TaskStatus.DONE:
            return False
        return datetime.utcnow() > self.due_date

import uuid
from dataclasses import dataclass
from datetime import datetime

from application.ports.notification_port import INotificationPort
from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.value_objects.priority import Priority


@dataclass
class CreateTaskCommand:
    title: str
    description: str
    project_id: str
    priority: str = "MEDIUM"
    assignee_id: str | None = None
    due_date: datetime | None = None


class CreateTaskUseCase:
    """Caso de uso: Crear una nueva tarea.

    SRP: solo crea tareas. DIP: recibe abstracciones, no implementaciones.
    """

    def __init__(
        self,
        task_repo: ITaskRepository,
        notification_port: INotificationPort,
    ) -> None:
        self._task_repo = task_repo
        self._notification = notification_port

    def execute(self, command: CreateTaskCommand) -> Task:
        task = Task(
            id=str(uuid.uuid4()),
            title=command.title,
            description=command.description,
            project_id=command.project_id,
            priority=Priority[command.priority],
            due_date=command.due_date,
        )

        if command.assignee_id:
            task.assign_to(command.assignee_id)

        saved_task = self._task_repo.save(task)
        self._notification.notify_assignment(saved_task)
        return saved_task

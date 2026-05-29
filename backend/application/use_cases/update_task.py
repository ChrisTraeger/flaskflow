from dataclasses import dataclass
from datetime import datetime

from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError
from domain.value_objects.priority import Priority


@dataclass
class UpdateTaskCommand:
    task_id: str
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    due_date: datetime | None = None


class UpdateTaskUseCase:
    """Caso de uso: Actualizar campos editables de una tarea.

    SRP: solo edita. DIP: recibe ITaskRepository, no la implementación concreta.
    """

    def __init__(self, task_repo: ITaskRepository) -> None:
        self._task_repo = task_repo

    def execute(self, command: UpdateTaskCommand) -> Task:
        task = self._task_repo.find_by_id(command.task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {command.task_id} not found")

        priority = Priority[command.priority] if command.priority else None

        task.update(
            title=command.title,
            description=command.description,
            priority=priority,
            due_date=command.due_date,
        )

        return self._task_repo.save(task)

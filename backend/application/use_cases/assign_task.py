from dataclasses import dataclass

from application.ports.notification_port import INotificationPort
from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError


@dataclass
class AssignTaskCommand:
    task_id: str
    assignee_id: str


class AssignTaskUseCase:
    """Caso de uso: Asignar una tarea a un usuario."""

    def __init__(
        self,
        task_repo: ITaskRepository,
        notification_port: INotificationPort,
    ) -> None:
        self._task_repo = task_repo
        self._notification = notification_port

    def execute(self, command: AssignTaskCommand) -> Task:
        task = self._task_repo.find_by_id(command.task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {command.task_id} not found")

        task.assign_to(command.assignee_id)
        saved_task = self._task_repo.save(task)
        self._notification.notify_assignment(saved_task)
        return saved_task

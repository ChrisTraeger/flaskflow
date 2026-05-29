from dataclasses import dataclass

from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError


@dataclass
class SendToReviewCommand:
    task_id: str


class SendToReviewUseCase:
    """Caso de uso: Enviar una tarea a revisión.

    Cubre la transición IN_PROGRESS → IN_REVIEW, necesaria
    para el flujo completo del tablero Kanban.
    """

    def __init__(self, task_repo: ITaskRepository) -> None:
        self._task_repo = task_repo

    def execute(self, command: SendToReviewCommand) -> Task:
        task = self._task_repo.find_by_id(command.task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {command.task_id} not found")

        task.send_to_review()
        return self._task_repo.save(task)

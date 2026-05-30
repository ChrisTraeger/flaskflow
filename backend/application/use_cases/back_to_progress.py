from dataclasses import dataclass

from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError


@dataclass
class BackToProgressCommand:
    task_id: str


class BackToProgressUseCase:
    """Caso de uso: Regresar una tarea a En Progreso.

    Cubre la transición IN_REVIEW → IN_PROGRESS.
    """

    def __init__(self, task_repo: ITaskRepository) -> None:
        self._task_repo = task_repo

    def execute(self, command: BackToProgressCommand) -> Task:
        task = self._task_repo.find_by_id(command.task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {command.task_id} not found")

        task.back_to_progress()
        return self._task_repo.save(task)
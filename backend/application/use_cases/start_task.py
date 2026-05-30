from dataclasses import dataclass

from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError


@dataclass
class StartTaskCommand:
    task_id: str


class StartTaskUseCase:
    """Caso de uso: Iniciar una tarea.

    Cubre la transición TODO → IN_PROGRESS.
    """

    def __init__(self, task_repo: ITaskRepository) -> None:
        self._task_repo = task_repo

    def execute(self, command: StartTaskCommand) -> Task:
        task = self._task_repo.find_by_id(command.task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {command.task_id} not found")

        task.start()
        return self._task_repo.save(task)
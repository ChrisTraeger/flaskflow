from abc import ABC, abstractmethod
from domain.entities.task import Task
from domain.value_objects.task_status import TaskStatus
from domain.value_objects.priority import Priority


class ITaskRepository(ABC):
    """Port de salida. Define el contrato que cualquier implementación debe cumplir.

    DIP: los casos de uso dependen de esta abstracción, nunca de Django ORM.
    """

    @abstractmethod
    def save(self, task: Task) -> Task: ...

    @abstractmethod
    def find_by_id(self, task_id: str) -> Task | None: ...

    @abstractmethod
    def find_by_project(
        self,
        project_id: str,
        status: TaskStatus | None = None,
        priority: Priority | None = None,
        assignee_id: str | None = None,
    ) -> list[Task]: ...

    @abstractmethod
    def delete(self, task_id: str) -> None: ...

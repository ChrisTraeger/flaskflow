from abc import ABC, abstractmethod
from domain.entities.project import Project


class IProjectRepository(ABC):
    """Port de salida para proyectos."""

    @abstractmethod
    def save(self, project: Project) -> Project: ...

    @abstractmethod
    def find_by_id(self, project_id: str) -> Project | None: ...

    @abstractmethod
    def find_by_owner(self, owner_id: str) -> list[Project]: ...

    @abstractmethod
    def delete(self, project_id: str) -> None: ...

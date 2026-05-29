from abc import ABC, abstractmethod
from domain.entities.task import Task


class INotificationPort(ABC):
    """Port de salida para notificaciones.

    Interface Segregation Principle (ISP): separado de ITaskRepository.
    Cualquier adapter (email, Slack, WebSocket) lo implementa.
    """

    @abstractmethod
    def notify_assignment(self, task: Task) -> None: ...

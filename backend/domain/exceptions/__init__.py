class DomainException(Exception):
    """Excepción base del dominio."""
    pass


class InvalidTaskOperationError(DomainException):
    """Se lanza cuando se intenta una operación inválida sobre una tarea."""
    pass


class TaskNotFoundError(DomainException):
    """Se lanza cuando una tarea no existe."""
    pass


class ProjectNotFoundError(DomainException):
    """Se lanza cuando un proyecto no existe."""
    pass

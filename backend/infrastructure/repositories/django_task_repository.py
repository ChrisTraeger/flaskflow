import logging

from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError
from domain.value_objects.priority import Priority
from domain.value_objects.task_status import TaskStatus
from infrastructure.models.task_model import TaskModel

logger = logging.getLogger(__name__)


class DjangoTaskRepository(ITaskRepository):
    """Adapter de salida: implementa ITaskRepository usando Django ORM.

    OCP: reemplazable por MongoTaskRepository sin tocar dominio ni casos de uso.
    """

    def save(self, task: Task) -> Task:
        obj, created = TaskModel.objects.update_or_create(
            id=task.id,
            defaults={
                "title": task.title,
                "description": task.description,
                "status": task.status.value,
                "priority": task.priority.value,
                "assignee_id": task.assignee_id,
                "project_id": task.project_id,
                "due_date": task.due_date,
            },
        )
        action = "created" if created else "updated"
        logger.debug("Task %s %s (id=%s)", task.title, action, task.id)
        return self._to_domain(obj)

    def find_by_id(self, task_id: str) -> Task | None:
        try:
            return self._to_domain(TaskModel.objects.get(id=task_id))
        except TaskModel.DoesNotExist:
            logger.debug("Task not found: id=%s", task_id)
            return None

    def find_by_project(
        self,
        project_id: str,
        status: TaskStatus | None = None,
        priority: Priority | None = None,
        assignee_id: str | None = None,
    ) -> list[Task]:
        qs = TaskModel.objects.filter(project_id=project_id)

        if status is not None:
            qs = qs.filter(status=status.value)
        if priority is not None:
            qs = qs.filter(priority=priority.value)
        if assignee_id is not None:
            qs = qs.filter(assignee_id=assignee_id)

        return [self._to_domain(obj) for obj in qs]

    def delete(self, task_id: str) -> None:
        deleted_count, _ = TaskModel.objects.filter(id=task_id).delete()
        if deleted_count == 0:
            raise TaskNotFoundError(f"Task {task_id} not found")
        logger.debug("Task deleted: id=%s", task_id)

    def _to_domain(self, obj: TaskModel) -> Task:
        """Mapeo ORM → Entidad de dominio. DRY: único punto de conversión."""
        return Task(
            id=str(obj.id),
            title=obj.title,
            description=obj.description,
            project_id=str(obj.project_id),
            status=TaskStatus(obj.status),
            priority=Priority(obj.priority),
            assignee_id=str(obj.assignee_id) if obj.assignee_id else None,
            due_date=obj.due_date,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )

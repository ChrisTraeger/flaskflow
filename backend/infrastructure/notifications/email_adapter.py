from application.ports.notification_port import INotificationPort
from domain.entities.task import Task
from django.core.mail import send_mail


class EmailNotificationAdapter(INotificationPort):
    """Implementa INotificationPort usando el sistema de email de Django.

    Sustituible por SlackAdapter o WebSocketAdapter sin cambiar el dominio.
    Liskov Substitution Principle (LSP).
    """

    def notify_assignment(self, task: Task) -> None:
        if not task.assignee_id:
            return

        send_mail(
            subject=f"Nueva tarea asignada: {task.title}",
            message=f"Se te ha asignado la tarea: {task.description}",
            from_email="noreply@taskflow.com",
            recipient_list=[self._get_email(task.assignee_id)],
        )

    def _get_email(self, user_id: str) -> str:
        """Obtiene el email del usuario desde la base de datos."""
        from infrastructure.models.task_model import UserModel

        user = UserModel.objects.filter(id=user_id).first()
        return user.email if user else ""

from application.ports.notification_port import INotificationPort
from domain.entities.task import Task


class WebSocketNotificationAdapter(INotificationPort):
    """Adapter de notificaciones en tiempo real via Django Channels.

    LSP: sustituye a EmailNotificationAdapter sin cambiar el dominio.
    """

    def notify_assignment(self, task: Task) -> None:
        if not task.assignee_id:
            return

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{task.assignee_id}",
            {
                "type": "task.assigned",
                "task_id": task.id,
                "title": task.title,
            },
        )

import uuid

from django.db import models


class TaskModel(models.Model):
    """Modelo ORM — solo en la capa de infraestructura.
    El dominio nunca importa este archivo.
    """

    class Status(models.TextChoices):
        TODO = "todo", "Por hacer"
        IN_PROGRESS = "in_progress", "En progreso"
        IN_REVIEW = "in_review", "En revisión"
        DONE = "done", "Completada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TODO
    )
    priority = models.IntegerField(default=2)
    project = models.ForeignKey(
        "ProjectModel", on_delete=models.CASCADE, related_name="tasks"
    )
    assignee = models.ForeignKey(
        "UserModel", null=True, blank=True, on_delete=models.SET_NULL
    )
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "priority"]),
            models.Index(fields=["assignee"]),
        ]


class ProjectModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        "UserModel", on_delete=models.CASCADE, related_name="projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "projects"


class UserModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "users"

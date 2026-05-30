"""
container.py — Contenedor de inyección de dependencias.

Centraliza el wiring de casos de uso con sus adapters.
OCP: para cambiar de EmailAdapter a SlackAdapter, solo se edita aquí.
Los ViewSets no conocen las implementaciones concretas.
"""
from application.use_cases.assign_task import AssignTaskUseCase
from application.use_cases.complete_task import CompleteTaskUseCase
from application.use_cases.create_task import CreateTaskUseCase
from application.use_cases.send_to_review import SendToReviewUseCase
from application.use_cases.back_to_progress import BackToProgressUseCase
from application.use_cases.start_task import StartTaskUseCase
from application.use_cases.update_task import UpdateTaskUseCase
from infrastructure.notifications.email_adapter import EmailNotificationAdapter
from infrastructure.repositories.django_task_repository import DjangoTaskRepository


def get_task_repo() -> DjangoTaskRepository:
    return DjangoTaskRepository()


def get_notification_port() -> EmailNotificationAdapter:
    return EmailNotificationAdapter()


def get_create_task_use_case() -> CreateTaskUseCase:
    return CreateTaskUseCase(
        task_repo=get_task_repo(),
        notification_port=get_notification_port(),
    )


def get_assign_task_use_case() -> AssignTaskUseCase:
    return AssignTaskUseCase(
        task_repo=get_task_repo(),
        notification_port=get_notification_port(),
    )


def get_complete_task_use_case() -> CompleteTaskUseCase:
    return CompleteTaskUseCase(task_repo=get_task_repo())


def get_send_to_review_use_case() -> SendToReviewUseCase:
    return SendToReviewUseCase(task_repo=get_task_repo())


def get_start_task_use_case() -> StartTaskUseCase:
    return StartTaskUseCase(task_repo=get_task_repo())


def get_back_to_progress_use_case() -> BackToProgressUseCase:
    return BackToProgressUseCase(task_repo=get_task_repo())


def get_update_task_use_case() -> UpdateTaskUseCase:
    return UpdateTaskUseCase(task_repo=get_task_repo())
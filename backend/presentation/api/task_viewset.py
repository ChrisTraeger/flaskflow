import logging

from rest_framework import serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from application.container import (
    get_assign_task_use_case,
    get_back_to_progress_use_case,
    get_complete_task_use_case,
    get_create_task_use_case,
    get_send_to_review_use_case,
    get_start_task_use_case,
    get_task_repo,
    get_update_task_use_case,
)
from application.use_cases.assign_task import AssignTaskCommand
from application.use_cases.back_to_progress import BackToProgressCommand
from application.use_cases.complete_task import CompleteTaskCommand
from application.use_cases.create_task import CreateTaskCommand
from application.use_cases.send_to_review import SendToReviewCommand
from application.use_cases.start_task import StartTaskCommand
from application.use_cases.update_task import UpdateTaskCommand
from domain.exceptions import DomainException, TaskNotFoundError
from domain.value_objects.priority import Priority
from domain.value_objects.task_status import TaskStatus
from presentation.api.serializers import (
    CreateTaskSerializer,
    TaskSerializer,
    UpdateTaskSerializer,
)

logger = logging.getLogger(__name__)


class TaskViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request: Request) -> Response:
        """POST /api/tasks/ — Crea una nueva tarea."""
        serializer = CreateTaskSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as exc:
            logger.warning(
                "Task create validation failed: %s; request_data=%s",
                exc.detail,
                request.data,
            )
            raise

        data = serializer.validated_data

        command = CreateTaskCommand(
            title=data["title"],
            description=data.get("description", ""),
            project_id=str(data["project_id"]),
            priority=data.get("priority", "MEDIUM"),
            assignee_id=str(data["assignee_id"]) if data.get("assignee_id") else None,
            due_date=data.get("due_date"),
        )
        task = get_create_task_use_case().execute(command)
        logger.info("Task created: id=%s title=%s", task.id, task.title)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

    def list(self, request: Request) -> Response:
        """GET /api/tasks/?project_id=&status=&priority=&assignee_id= — Lista con filtros."""
        project_id = request.query_params.get("project_id")
        if not project_id:
            return Response(
                {"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        raw_status = request.query_params.get("status")
        raw_priority = request.query_params.get("priority")
        assignee_id = request.query_params.get("assignee_id")

        task_status = TaskStatus(raw_status) if raw_status else None
        priority = Priority[raw_priority.upper()] if raw_priority else None

        tasks = get_task_repo().find_by_project(
            project_id=project_id,
            status=task_status,
            priority=priority,
            assignee_id=assignee_id,
        )
        return Response(TaskSerializer(tasks, many=True).data)

    def partial_update(self, request: Request, pk: str = None) -> Response:
        """PATCH /api/tasks/{id}/ — Acciones de estado o edición de campos."""
        action = request.data.get("action")
        try:
            if action == "assign":
                assignee_id = request.data.get("assignee_id")
                if not assignee_id:
                    return Response(
                        {"error": "assignee_id required"}, status=status.HTTP_400_BAD_REQUEST
                    )
                command = AssignTaskCommand(task_id=pk, assignee_id=assignee_id)
                task = get_assign_task_use_case().execute(command)

            elif action == "start":
                task = get_start_task_use_case().execute(StartTaskCommand(task_id=pk))

            elif action == "back":
                task = get_back_to_progress_use_case().execute(BackToProgressCommand(task_id=pk))

            elif action == "review":
                task = get_send_to_review_use_case().execute(SendToReviewCommand(task_id=pk))

            elif action == "complete":
                task = get_complete_task_use_case().execute(CompleteTaskCommand(task_id=pk))

            elif action == "update":
                serializer = UpdateTaskSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                d = serializer.validated_data
                command = UpdateTaskCommand(
                    task_id=pk,
                    title=d.get("title"),
                    description=d.get("description"),
                    priority=d.get("priority"),
                    due_date=d.get("due_date"),
                )
                task = get_update_task_use_case().execute(command)

            else:
                return Response(
                    {"error": f"Invalid action: {action!r}. Valid: assign, back, complete, review, start, update"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except TaskNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except DomainException as e:
            return Response({"error": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            logger.exception("Unexpected error in partial_update: %s", e)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(TaskSerializer(task).data)

    def destroy(self, request: Request, pk: str = None) -> Response:
        """DELETE /api/tasks/{id}/"""
        try:
            get_task_repo().delete(pk)
        except TaskNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Unexpected error in destroy: %s", e)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.info("Task deleted: id=%s", pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
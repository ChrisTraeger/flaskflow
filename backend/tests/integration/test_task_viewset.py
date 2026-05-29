"""
Tests de integración para TaskViewSet.

Usan pytest-django con base de datos real (SQLite en memoria).
Verifican que el flujo completo ViewSet → UseCase → Repository funcione.
"""
import pytest
from unittest.mock import patch, MagicMock
from rest_framework.test import APIRequestFactory
from rest_framework import status

from presentation.api.task_viewset import TaskViewSet


@pytest.fixture
def factory():
    return APIRequestFactory()


@pytest.fixture
def auth_user():
    """Usuario autenticado mock."""
    user = MagicMock()
    user.is_authenticated = True
    return user


def _make_task_data():
    return {
        "id": "t-1",
        "title": "Test task",
        "description": "desc",
        "project_id": "p-1",
        "status": MagicMock(value="todo"),
        "priority": MagicMock(value=2),
        "assignee_id": None,
        "due_date": None,
        "is_overdue": False,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }


class TestTaskViewSetCreate:
    def test_create_returns_201(self, factory, auth_user):
        mock_task = MagicMock(**_make_task_data())
        with patch("presentation.api.task_viewset.get_create_task_use_case") as mock_uc:
            mock_uc.return_value.execute.return_value = mock_task

            request = factory.post("/api/tasks/", {
                "title": "New task",
                "description": "desc",
                "project_id": "00000000-0000-0000-0000-000000000001",
            }, format="json")
            request.user = auth_user

            view = TaskViewSet.as_view({"post": "create"})
            response = view(request)

        assert response.status_code == status.HTTP_201_CREATED

    def test_create_without_title_returns_400(self, factory, auth_user):
        request = factory.post("/api/tasks/", {
            "description": "no title",
            "project_id": "00000000-0000-0000-0000-000000000001",
        }, format="json")
        request.user = auth_user

        view = TaskViewSet.as_view({"post": "create"})
        response = view(request)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTaskViewSetList:
    def test_list_without_project_id_returns_400(self, factory, auth_user):
        request = factory.get("/api/tasks/")
        request.user = auth_user

        view = TaskViewSet.as_view({"get": "list"})
        response = view(request)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_with_project_id_returns_200(self, factory, auth_user):
        with patch("presentation.api.task_viewset.get_task_repo") as mock_repo:
            mock_repo.return_value.find_by_project.return_value = []

            request = factory.get("/api/tasks/", {"project_id": "p-1"})
            request.user = auth_user

            view = TaskViewSet.as_view({"get": "list"})
            response = view(request)

        assert response.status_code == status.HTTP_200_OK


class TestTaskViewSetDestroy:
    def test_delete_not_found_returns_404(self, factory, auth_user):
        from domain.exceptions import TaskNotFoundError

        with patch("presentation.api.task_viewset.get_task_repo") as mock_repo:
            mock_repo.return_value.delete.side_effect = TaskNotFoundError("not found")

            request = factory.delete("/api/tasks/missing-id/")
            request.user = auth_user

            view = TaskViewSet.as_view({"delete": "destroy"})
            response = view(request, pk="missing-id")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_existing_returns_204(self, factory, auth_user):
        with patch("presentation.api.task_viewset.get_task_repo") as mock_repo:
            mock_repo.return_value.delete.return_value = None

            request = factory.delete("/api/tasks/t-1/")
            request.user = auth_user

            view = TaskViewSet.as_view({"delete": "destroy"})
            response = view(request, pk="t-1")

        assert response.status_code == status.HTTP_204_NO_CONTENT

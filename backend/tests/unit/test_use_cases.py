import pytest
from unittest.mock import MagicMock
from datetime import datetime, timedelta

from application.use_cases.create_task import CreateTaskCommand, CreateTaskUseCase
from application.use_cases.update_task import UpdateTaskCommand, UpdateTaskUseCase
from domain.entities.task import Task
from domain.exceptions import TaskNotFoundError
from domain.value_objects.priority import Priority
from domain.value_objects.task_status import TaskStatus


def _make_task(**kwargs) -> Task:
    defaults = dict(id="t-1", title="Test", description="", project_id="p-1")
    return Task(**{**defaults, **kwargs})


class TestCreateTaskUseCase:
    def setup_method(self):
        self.mock_repo = MagicMock()
        self.mock_notification = MagicMock()
        self.use_case = CreateTaskUseCase(
            task_repo=self.mock_repo,
            notification_port=self.mock_notification,
        )

    def test_creates_task_with_correct_title(self):
        command = CreateTaskCommand(title="Implementar login", description="OAuth2", project_id="p-1")
        self.mock_repo.save.return_value = _make_task(title="Implementar login")

        task = self.use_case.execute(command)

        saved = self.mock_repo.save.call_args[0][0]
        assert saved.title == "Implementar login"
        assert saved.status == TaskStatus.TODO

    def test_sets_due_date_when_provided(self):
        future = datetime.utcnow() + timedelta(days=3)
        command = CreateTaskCommand(title="T", description="", project_id="p-1", due_date=future)
        self.mock_repo.save.return_value = _make_task()

        self.use_case.execute(command)

        saved = self.mock_repo.save.call_args[0][0]
        assert saved.due_date == future

    def test_notifies_on_creation(self):
        command = CreateTaskCommand(title="T", description="", project_id="p-1")
        self.mock_repo.save.return_value = _make_task()

        self.use_case.execute(command)

        self.mock_notification.notify_assignment.assert_called_once()

    def test_assigns_user_when_assignee_provided(self):
        command = CreateTaskCommand(title="T", description="", project_id="p-1", assignee_id="u-1")
        self.mock_repo.save.return_value = _make_task()

        self.use_case.execute(command)

        saved = self.mock_repo.save.call_args[0][0]
        assert saved.assignee_id == "u-1"


class TestUpdateTaskUseCase:
    def setup_method(self):
        self.mock_repo = MagicMock()
        self.use_case = UpdateTaskUseCase(task_repo=self.mock_repo)

    def test_updates_title(self):
        existing = _make_task(title="Old title")
        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.save.return_value = existing

        self.use_case.execute(UpdateTaskCommand(task_id="t-1", title="New title"))

        assert existing.title == "New title"
        self.mock_repo.save.assert_called_once()

    def test_raises_when_task_not_found(self):
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(TaskNotFoundError):
            self.use_case.execute(UpdateTaskCommand(task_id="missing"))

    def test_updates_priority_enum(self):
        existing = _make_task()
        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.save.return_value = existing

        self.use_case.execute(UpdateTaskCommand(task_id="t-1", priority="URGENT"))

        assert existing.priority == Priority.URGENT

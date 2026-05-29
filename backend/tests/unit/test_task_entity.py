import pytest
from datetime import datetime, timedelta
from domain.entities.task import Task
from domain.value_objects.task_status import TaskStatus
from domain.value_objects.priority import Priority
from domain.exceptions import InvalidTaskOperationError


class TestTaskEntity:

    def _make_task(self, **kwargs) -> Task:
        defaults = dict(id="t-1", title="Test task", description="desc", project_id="p-1")
        return Task(**{**defaults, **kwargs})

    # ── start() ─────────────────────────────────────────────────────────

    def test_start_changes_status_to_in_progress(self):
        task = self._make_task()
        task.start()
        assert task.status == TaskStatus.IN_PROGRESS

    def test_cannot_start_task_already_in_progress(self):
        task = self._make_task(status=TaskStatus.IN_PROGRESS)
        with pytest.raises(InvalidTaskOperationError):
            task.start()

    def test_cannot_start_done_task(self):
        task = self._make_task(status=TaskStatus.DONE)
        with pytest.raises(InvalidTaskOperationError):
            task.start()

    # ── send_to_review() ────────────────────────────────────────────────

    def test_send_to_review_from_in_progress(self):
        task = self._make_task(status=TaskStatus.IN_PROGRESS)
        task.send_to_review()
        assert task.status == TaskStatus.IN_REVIEW

    def test_cannot_send_todo_to_review(self):
        task = self._make_task()
        with pytest.raises(InvalidTaskOperationError):
            task.send_to_review()

    # ── complete() ──────────────────────────────────────────────────────

    def test_complete_from_in_progress(self):
        task = self._make_task(status=TaskStatus.IN_PROGRESS)
        task.complete()
        assert task.status == TaskStatus.DONE

    def test_complete_from_in_review(self):
        task = self._make_task(status=TaskStatus.IN_REVIEW)
        task.complete()
        assert task.status == TaskStatus.DONE

    def test_cannot_complete_todo_task(self):
        task = self._make_task()
        with pytest.raises(InvalidTaskOperationError):
            task.complete()

    # ── assign_to() ─────────────────────────────────────────────────────

    def test_assign_to_sets_assignee(self):
        task = self._make_task()
        task.assign_to("user-99")
        assert task.assignee_id == "user-99"

    def test_cannot_reassign_completed_task(self):
        task = self._make_task(status=TaskStatus.DONE)
        with pytest.raises(InvalidTaskOperationError):
            task.assign_to("user-99")

    # ── update() ────────────────────────────────────────────────────────

    def test_update_title(self):
        task = self._make_task()
        task.update(title="New title")
        assert task.title == "New title"

    def test_update_priority(self):
        task = self._make_task()
        task.update(priority=Priority.URGENT)
        assert task.priority == Priority.URGENT

    def test_update_due_date(self):
        task = self._make_task()
        future = datetime.utcnow() + timedelta(days=7)
        task.update(due_date=future)
        assert task.due_date == future

    def test_cannot_update_blank_title(self):
        task = self._make_task()
        with pytest.raises(InvalidTaskOperationError):
            task.update(title="   ")

    def test_cannot_update_completed_task(self):
        task = self._make_task(status=TaskStatus.DONE)
        with pytest.raises(InvalidTaskOperationError):
            task.update(title="New title")

    # ── is_overdue ──────────────────────────────────────────────────────

    def test_is_overdue_when_past_due_date(self):
        past = datetime.utcnow() - timedelta(days=1)
        task = self._make_task(due_date=past)
        assert task.is_overdue is True

    def test_not_overdue_when_future_due_date(self):
        future = datetime.utcnow() + timedelta(days=1)
        task = self._make_task(due_date=future)
        assert task.is_overdue is False

    def test_not_overdue_when_no_due_date(self):
        task = self._make_task()
        assert task.is_overdue is False

    def test_not_overdue_when_done_even_if_past(self):
        past = datetime.utcnow() - timedelta(days=1)
        task = self._make_task(status=TaskStatus.DONE, due_date=past)
        assert task.is_overdue is False

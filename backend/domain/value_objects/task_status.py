from enum import Enum


class TaskStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"

    @classmethod
    def transitions(cls) -> dict[str, list[str]]:
        """Transiciones válidas entre estados."""
        return {
            cls.TODO.value: [cls.IN_PROGRESS.value],
            cls.IN_PROGRESS.value: [cls.IN_REVIEW.value, cls.DONE.value],
            cls.IN_REVIEW.value: [cls.IN_PROGRESS.value, cls.DONE.value],
            cls.DONE.value: [],
        }

    def can_transition_to(self, target: "TaskStatus") -> bool:
        return target.value in self.transitions().get(self.value, [])

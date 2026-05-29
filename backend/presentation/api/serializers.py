from rest_framework import serializers

from domain.value_objects.priority import Priority


class PriorityField(serializers.Field):
    default = "MEDIUM"

    def to_internal_value(self, data):
        if isinstance(data, int):
            try:
                return Priority(data).name
            except ValueError:
                raise serializers.ValidationError("Invalid priority value")

        if isinstance(data, str):
            raw = data.strip().upper()
            if raw.isdigit():
                try:
                    return Priority(int(raw)).name
                except ValueError:
                    raise serializers.ValidationError("Invalid priority value")
            if raw in Priority.__members__:
                return raw
            raise serializers.ValidationError("Invalid priority value")

        raise serializers.ValidationError("Priority must be a string or integer")

    def to_representation(self, value):
        if isinstance(value, Priority):
            return value.name
        if isinstance(value, int):
            return Priority(value).name
        return str(value)


class CreateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    description = serializers.CharField(default="", allow_blank=True)
    project_id = serializers.UUIDField()
    priority = PriorityField(required=False, default="MEDIUM")
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    due_date = serializers.DateTimeField(required=False, allow_null=True)

    def validate_title(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()


class UpdateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    priority = PriorityField(required=False)
    due_date = serializers.DateTimeField(required=False, allow_null=True)


class TaskSerializer(serializers.Serializer):
    """Serializer de salida — convierte Task domain entity a JSON."""

    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    project_id = serializers.CharField()
    status = serializers.CharField(source="status.value")
    priority = serializers.IntegerField(source="priority.value")
    assignee_id = serializers.CharField(allow_null=True)
    due_date = serializers.DateTimeField(allow_null=True)
    is_overdue = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

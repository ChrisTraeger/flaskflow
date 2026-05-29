from dataclasses import dataclass
from domain.value_objects.email import Email


@dataclass
class User:
    """Entidad User — representa a un miembro del equipo."""

    id: str
    username: str
    email: Email
    is_active: bool = True

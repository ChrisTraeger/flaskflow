from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Project:
    """Entidad Project — agrupa tareas bajo un mismo proyecto."""

    id: str
    name: str
    description: str
    owner_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)

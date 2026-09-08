from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    department: str
    location: str
    manager: str

    start_date: date
    planned_completion: date

    approved_budget: float = 0
    released_funds: float = 0
    expenditure: float = 0

    physical_progress: float = 0
    financial_progress: float = 0

    status: str = "ON_TRACK"


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    name: str
    planned_date: date
    actual_date: Optional[date] = None
    status: str

    model_config = ConfigDict(
        from_attributes=True
    )


class ProjectUpdateResponse(BaseModel):
    id: int
    project_id: int
    progress: float
    expenditure: float
    notes: str
    update_date: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AlertResponse(BaseModel):
    id: int
    project_id: int
    severity: str
    category: str
    message: str
    recommendation: str
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
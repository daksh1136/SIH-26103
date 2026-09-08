from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, Project
from app.schemas import MilestoneResponse

router = APIRouter(
    prefix="/api",
    tags=["Milestones"]
)


def calculate_milestone_status(milestone: Milestone) -> str:
    """
    Determine milestone status from actual_date and planned_date.
    """
    today = date.today()

    if milestone.status and milestone.status.upper() in ("COMPLETED", "OVERDUE", "IN_PROGRESS", "UPCOMING"):
        return milestone.status.upper()

    if milestone.actual_date is not None:
        return "COMPLETED"

    if milestone.planned_date and milestone.planned_date < today:
        return "OVERDUE"

    if milestone.planned_date and milestone.planned_date <= today + timedelta(days=30):
        return "IN_PROGRESS"

    return "UPCOMING"


def format_milestone(milestone: Milestone) -> dict:
    status = calculate_milestone_status(milestone)
    p_date = milestone.planned_date
    a_date = milestone.actual_date

    # Progress estimation
    if status == "COMPLETED" or a_date is not None:
        prog = 100.0
    elif status in ("IN_PROGRESS", "OVERDUE"):
        prog = 50.0
    else:
        prog = 0.0

    return {
        "id": milestone.id,
        "project_id": milestone.project_id,
        "name": milestone.name,
        "planned_date": p_date,
        "actual_date": a_date,
        "status": status,
        "planned_start": p_date,
        "planned_completion": p_date,
        "actual_completion": a_date,
        "progress": prog,
    }


@router.get("/milestones", response_model=List[MilestoneResponse])
def get_milestones(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Milestone)

    if status:
        query = query.filter(func.upper(Milestone.status) == status.upper())

    milestones = query.order_by(Milestone.planned_date.asc()).all()
    return [format_milestone(m) for m in milestones]


@router.get("/projects/{project_id}/milestones", response_model=List[MilestoneResponse])
def get_project_milestones(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    project = db.query(Project.id).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.planned_date.asc())
        .all()
    )
    return [format_milestone(m) for m in milestones]

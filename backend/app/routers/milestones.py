from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, Project


router = APIRouter(
    prefix="/api",
    tags=["Milestones"]
)


def calculate_milestone_status(milestone):
    """
    Automatically determine milestone status from
    progress and planned completion date.
    """

    today = date.today()

    # Completed milestone
    if milestone.actual_completion is not None:
        return "COMPLETED"

    # 100% progress also means completed
    if float(milestone.progress or 0) >= 100:
        return "COMPLETED"

    # Completion date has passed
    if milestone.planned_completion < today:
        return "OVERDUE"

    # Due within next 30 days
    if milestone.planned_completion <= today + timedelta(days=30):
        return "DUE_SOON"

    # Has started
    if float(milestone.progress or 0) > 0:
        return "IN_PROGRESS"

    return "UPCOMING"


def milestone_response(milestone):
    status = calculate_milestone_status(milestone)

    return {
        "id": milestone.id,
        "project_id": milestone.project_id,
        "name": milestone.name,
        "planned_start": (
            milestone.planned_start.isoformat()
            if milestone.planned_start
            else None
        ),
        "planned_completion": (
            milestone.planned_completion.isoformat()
            if milestone.planned_completion
            else None
        ),
        "actual_completion": (
            milestone.actual_completion.isoformat()
            if milestone.actual_completion
            else None
        ),
        "progress": float(milestone.progress or 0),
        "status": status,
    }


# ==========================================================
# ALL MILESTONES
# ==========================================================

@router.get("/milestones")
def get_milestones(
    db: Session = Depends(get_db)
):
    milestones = (
        db.query(Milestone)
        .order_by(Milestone.planned_completion.asc())
        .all()
    )

    return [
        milestone_response(milestone)
        for milestone in milestones
    ]


# ==========================================================
# PROJECT MILESTONES
# ==========================================================

@router.get("/projects/{project_id}/milestones")
def get_project_milestones(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    milestones = (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.planned_completion.asc())
        .all()
    )

    return [
        milestone_response(milestone)
        for milestone in milestones
    ]


# ==========================================================
# MILESTONE SUMMARY
# ==========================================================

@router.get("/milestones/summary")
def get_milestone_summary(
    db: Session = Depends(get_db)
):
    milestones = db.query(Milestone).all()

    statuses = {
        "total": len(milestones),
        "completed": 0,
        "in_progress": 0,
        "upcoming": 0,
        "due_soon": 0,
        "overdue": 0,
    }

    for milestone in milestones:
        status = calculate_milestone_status(milestone)

        if status == "COMPLETED":
            statuses["completed"] += 1

        elif status == "IN_PROGRESS":
            statuses["in_progress"] += 1

        elif status == "UPCOMING":
            statuses["upcoming"] += 1

        elif status == "DUE_SOON":
            statuses["due_soon"] += 1

        elif status == "OVERDUE":
            statuses["overdue"] += 1

    return statuses


# ==========================================================
# SINGLE MILESTONE
# ==========================================================

@router.get("/milestones/{milestone_id}")
def get_milestone(
    milestone_id: int,
    db: Session = Depends(get_db)
):
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id)
        .first()
    )

    if not milestone:
        raise HTTPException(
            status_code=404,
            detail="Milestone not found"
        )

    return milestone_response(milestone)
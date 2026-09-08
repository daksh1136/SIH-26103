"""
AI Project Salvage & Doom Prevention Router.
Provides endpoints to diagnose catastrophic project doom risk and prescribe/execute
quantified multi-phase turnaround interventions.
"""

import os
import sys
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, Project, ProjectUpdate
from app.schemas import (
    SalvageExecuteRequest,
    SalvageExecuteResponse,
    SalvageResponse,
)

# Ensure ai_engine is importable
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

try:
    from ai_engine.intelligence.salvage_engine import SalvageEngine
    salvage_engine = SalvageEngine()
except Exception as e:
    print(f"Warning: Could not initialize SalvageEngine: {e}")
    salvage_engine = None

router = APIRouter(
    prefix="/api/salvage",
    tags=["AI Project Salvage & Doom Prevention"]
)


def _build_project_salvage_dict(project: Project, milestones: List[Milestone]) -> Dict[str, Any]:
    """Extract and normalize project parameters for the Salvage ML Engine."""
    today = date.today()
    total_days = max(1, (project.planned_completion - project.start_date).days)
    elapsed_days = max(0, (today - project.start_date).days)
    expected_progress = min(100.0, (elapsed_days / total_days) * 100.0) if total_days > 0 else 50.0

    total_m = len(milestones) if milestones else 5
    delayed_m = sum(1 for m in milestones if m.status in ("DELAYED", "OVERDUE", "CRITICAL")) if milestones else 0

    # Contractor and resource metrics from project or defaults
    contractor_perf = 75.0
    if project.contractor:
        contractor_perf = float(project.contractor.avg_rating or 75.0)
    elif project.status in ("CRITICAL", "DELAYED"):
        contractor_perf = 35.0

    return {
        "id": project.id,
        "name": project.name,
        "department": project.department,
        "physical_progress": float(project.physical_progress or 0.0),
        "expected_progress": expected_progress,
        "financial_progress": float(project.financial_progress or 0.0),
        "approved_budget": float(project.approved_budget or 1.0),
        "expenditure": float(project.expenditure or 0.0),
        "milestones_delayed": float(delayed_m),
        "milestones_total": float(total_m),
        "resource_availability": 45.0 if project.status in ("CRITICAL", "DELAYED") else 80.0,
        "contractor_performance": contractor_perf,
        "material_availability": 40.0 if project.status in ("CRITICAL", "DELAYED") else 85.0,
        "previous_delays": 2.0 if project.status in ("CRITICAL", "DELAYED") else 0.0,
    }


@router.get("/{project_id}", response_model=SalvageResponse)
def get_project_salvage_plan(
    project_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
):
    """
    Evaluate catastrophe / doom risk for a specific infrastructure project and generate
    a comprehensive multi-phase turnaround salvage playbook with before/after metrics.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project #{project_id} not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()
    project_dict = _build_project_salvage_dict(project, milestones)

    if not salvage_engine:
        raise HTTPException(status_code=500, detail="AI Salvage Engine is currently unavailable")

    salvage_data = salvage_engine.evaluate_project_salvage(project_dict)
    return salvage_data


@router.post("/execute", response_model=SalvageExecuteResponse)
def execute_salvage_plan(
    req: SalvageExecuteRequest,
    db: Session = Depends(get_db)
):
    """
    Execute AI turnaround intervention for a doomed / distressed project.
    Directs stabilization, logs emergency governance audit trail, and updates project status.
    """
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project #{req.project_id} not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == req.project_id).all()
    project_dict = _build_project_salvage_dict(project, milestones)

    if not salvage_engine:
        raise HTTPException(status_code=500, detail="AI Salvage Engine is currently unavailable")

    salvage_data = salvage_engine.evaluate_project_salvage(project_dict)
    sim = salvage_data["impact_simulation"]

    # Record executive turnaround action in ProjectUpdate
    num_actions = len(req.selected_actions) if req.selected_actions else 8
    audit_note = (
        f"⚡ MoSPI Turnaround Intervention Activated by {req.approved_by}. "
        f"{num_actions} salvage protocols deployed: Tripartite Escrow activated, 24/7 double-shift "
        f"acceleration initiated, package carve-out authorized. Target recovery: +{sim['health_score_gain']} pts health, "
        f"{sim['days_saved']} calendar days saved, ₹{sim['capital_saved_cr']} Cr cost overrun prevented."
    )

    update_entry = ProjectUpdate(
        project_id=project.id,
        progress=float(project.physical_progress or 0.0),
        expenditure=float(project.expenditure or 0.0),
        notes=f"{audit_note} Baseline delay: {sim['baseline_delay_days']}d, Revised post-salvage target: {sim['salvaged_delay_days']}d.",
        update_date=datetime.now(timezone.utc),
    )
    db.add(update_entry)

    # Transition project status to ACTIVE_SALVAGE / ON_TRACK
    if project.status in ("CRITICAL", "DELAYED"):
        project.status = "SALVAGED_RECOVERY"

    db.commit()

    return {
        "project_id": project.id,
        "status": "SALVAGE_DEPLOYED",
        "message": f"Salvage protocols deployed successfully for '{project.name}'. Recovery trajectory active.",
        "salvaged_health_score": sim["salvaged_health_score"],
        "salvaged_delay_days": sim["salvaged_delay_days"],
        "capital_saved_cr": sim["capital_saved_cr"],
        "execution_timestamp": datetime.now(timezone.utc).isoformat(),
    }

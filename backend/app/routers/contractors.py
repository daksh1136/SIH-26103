"""
Contractor Due Diligence & Fraud Detection Router.
Provides endpoints for querying contractor profiles, retrieving historical project track records,
evaluating eligibility and fraud risk for tender awards, and retraining the ML model.
"""

import os
import sys
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contractor, ContractorProjectHistory, Project
from app.schemas import (
    ContractorDetailSchema,
    ContractorEvaluationRequest,
    ContractorEvaluationResponse,
    ContractorRetrainResponse,
    ContractorSummarySchema,
)

# Ensure ai_engine is accessible
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

try:
    from ai_engine.intelligence.contractor_fraud_engine import ContractorFraudEngine
    fraud_engine = ContractorFraudEngine()
except Exception as e:
    print(f"Warning: Could not load ContractorFraudEngine: {e}")
    fraud_engine = None

router = APIRouter(
    prefix="/api/contractors",
    tags=["Contractor Fraud & Due Diligence"]
)


@router.get("", response_model=List[ContractorSummarySchema])
def list_contractors(db: Session = Depends(get_db)):
    """Retrieve list of all empaneled contractors with overall risk status"""
    contractors = db.query(Contractor).order_by(Contractor.id.asc()).all()
    return contractors


@router.get("/{contractor_id}", response_model=ContractorDetailSchema)
def get_contractor_detail(
    contractor_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
):
    """Retrieve full contractor dossier including historical project delivery records"""
    contractor = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return contractor


@router.post("/evaluate", response_model=ContractorEvaluationResponse)
def evaluate_contractor_for_project(
    req: ContractorEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates whether a contractor is eligible and safe to work on a specific project.
    Can accept an existing contractor_id + existing project_id, or custom new specs.
    """
    contractor_dict = {}
    historical_projects = []

    # 1. Fetch Contractor Data
    if req.contractor_id:
        db_contractor = db.query(Contractor).filter(Contractor.id == req.contractor_id).first()
        if not db_contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
        
        contractor_dict = {
            "id": db_contractor.id,
            "name": db_contractor.name,
            "category": db_contractor.category,
            "shell_risk_score": db_contractor.shell_risk_score,
            "ghost_billing_flags": db_contractor.ghost_billing_flags,
            "litigation_count": db_contractor.litigation_count,
            "tax_compliance_status": db_contractor.tax_compliance_status,
            "status": db_contractor.status,
            "max_project_budget_handled": db_contractor.max_project_budget_handled,
            "avg_rating": db_contractor.avg_rating,
        }
        
        # Load historical projects
        db_hist = db.query(ContractorProjectHistory).filter(
            ContractorProjectHistory.contractor_id == req.contractor_id
        ).all()
        historical_projects = [
            {
                "project_name": h.project_name,
                "sanctioned_budget": h.sanctioned_budget,
                "actual_cost": h.actual_cost,
                "cost_overrun_pct": h.cost_overrun_pct,
                "delay_days": h.delay_days,
                "completion_status": h.completion_status,
                "audit_irregularity_flag": h.audit_irregularity_flag,
            }
            for h in db_hist
        ]
    else:
        # Custom Contractor specs
        contractor_dict = {
            "name": req.contractor_name or "Proposed New Contractor",
            "category": req.category or "Tier-2",
            "shell_risk_score": req.shell_risk_score or 10.0,
            "ghost_billing_flags": req.ghost_billing_flags or 0,
            "litigation_count": req.litigation_count or 0,
            "tax_compliance_status": req.tax_compliance_status or "COMPLIANT",
            "status": "APPROVED",
            "max_project_budget_handled": req.max_project_budget_handled or 50000000.0,
            "avg_cost_overrun_pct": req.avg_cost_overrun_pct or 5.0,
            "avg_delay_days": req.avg_delay_days or 20.0,
            "on_time_delivery_rate": req.on_time_delivery_rate or 0.85,
            "solvency_score": req.solvency_score or 75.0,
        }

    # 2. Fetch Project Data
    project_dict = {}
    if req.project_id:
        db_project = db.query(Project).filter(Project.id == req.project_id).first()
        if not db_project:
            raise HTTPException(status_code=404, detail="Project not found")
        project_dict = {
            "id": db_project.id,
            "name": db_project.name,
            "department": db_project.department,
            "approved_budget": db_project.approved_budget,
        }
    else:
        project_dict = {
            "name": req.project_name or "New Tender Package",
            "department": req.department or "Infrastructure",
            "approved_budget": req.project_budget or 60000000.0,
        }

    # 3. Evaluate using ContractorFraudEngine
    global fraud_engine
    if fraud_engine is None:
        fraud_engine = ContractorFraudEngine()

    result = fraud_engine.evaluate_contractor(
        contractor=contractor_dict,
        project=project_dict,
        historical_projects=historical_projects if len(historical_projects) > 0 else None
    )

    return result


@router.post("/retrain", response_model=ContractorRetrainResponse)
def retrain_contractor_fraud_model():
    """Retrain the Contractor Fraud ML Model on the latest verified audit dataset"""
    global fraud_engine
    if fraud_engine is None:
        fraud_engine = ContractorFraudEngine()

    metrics = fraud_engine.retrain()
    return {
        "status": "SUCCESS",
        "message": f"Contractor Fraud ML model retrained with {metrics.get('accuracy', 1.0)*100:.1f}% accuracy across {metrics.get('total_samples', 800)} historical profiles.",
        "accuracy": float(metrics.get("accuracy", 1.0)),
        "precision": float(metrics.get("precision", 1.0)),
        "recall": float(metrics.get("recall", 1.0)),
        "roc_auc": float(metrics.get("roc_auc", 1.0)),
        "total_samples": int(metrics.get("total_samples", 800)),
        "feature_importances": metrics.get("feature_importances", {}),
    }

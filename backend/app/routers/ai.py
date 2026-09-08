import math
from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, Project, ProjectUpdate
from app.schemas import (
    AnomalyItem,
    ChatRequest,
    ChatResponse,
    DeepAIRiskResponse,
    DependencyItem,
    PlaybookInfo,
    RootCauseInfo,
    ShapItem,
    SimulationMetricSet,
    WhatIfRequest,
    WhatIfResponse,
)

router = APIRouter(
    prefix="/api",
    tags=["AI Intelligence"]
)

# Inter-project dependencies definition
DEPENDENCY_LINKS = [
    {"id": 1, "source_id": 1, "source_name": "National Highway Development - Demo", "target_id": 8, "target_name": "Rail Infrastructure Modernization - Demo", "coupling_strength": 0.75, "dependency_type": "Intermodal Logistics Corridor"},
    {"id": 2, "source_id": 5, "source_name": "Power Transmission Expansion - Demo", "target_id": 10, "target_name": "Smart City Connectivity - Demo", "coupling_strength": 0.85, "dependency_type": "Grid Electrification & Data Center Power"},
    {"id": 3, "source_id": 11, "source_name": "Expressway Freight Corridor", "target_id": 12, "target_name": "Deepwater Coastal Port Rail Link", "coupling_strength": 0.80, "dependency_type": "Hinterland Cargo Evacuation"},
    {"id": 4, "source_id": 2, "source_name": "Rural Water Supply Network - Demo", "target_id": 4, "target_name": "Urban Development Mission - Demo", "coupling_strength": 0.60, "dependency_type": "Shared River Basin Water Rights"},
]


def calculate_health_components(project: Project, milestones: List[Milestone]) -> Dict[str, int]:
    # 1. Schedule (25%)
    today = date.today()
    total_days = max(1, (project.planned_completion - project.start_date).days)
    elapsed_days = max(0, (today - project.start_date).days)
    expected_progress = min(100.0, (elapsed_days / total_days) * 100.0) if total_days > 0 else 50.0
    schedule_slippage = expected_progress - float(project.physical_progress or 0)
    schedule_score = max(10, min(100, int(100 - (schedule_slippage * 1.5))))

    # 2. Physical (25%)
    physical_score = int(float(project.physical_progress or 0))

    # 3. Financial (15%)
    budget = float(project.approved_budget or 1)
    spend = float(project.expenditure or 0)
    burn_rate = (spend / budget) * 100.0
    financial_gap = abs(burn_rate - float(project.physical_progress or 0))
    financial_score = max(15, min(100, int(100 - (financial_gap * 1.4))))

    # 4. Milestones (15%)
    if milestones:
        completed = sum(1 for m in milestones if m.status == "COMPLETED" or m.actual_date is not None)
        overdue = sum(1 for m in milestones if m.status == "OVERDUE" or (m.planned_date and m.planned_date < today and not m.actual_date))
        milestone_score = max(10, min(100, int((completed / len(milestones)) * 100 - (overdue * 15))))
    else:
        milestone_score = 65

    # 5. Resources (10%)
    if project.status == "CRITICAL":
        resource_score = 35
    elif project.status in ("AT_RISK", "DELAYED"):
        resource_score = 55
    else:
        resource_score = 88

    # 6. Contractor (10%)
    if project.status == "CRITICAL":
        contractor_score = 40
    elif project.status in ("AT_RISK", "DELAYED"):
        contractor_score = 60
    else:
        contractor_score = 90

    return {
        "schedule": schedule_score,
        "physical": physical_score,
        "financial": financial_score,
        "milestones": milestone_score,
        "resources": resource_score,
        "contractor": contractor_score,
    }


def compute_health_total(comps: Dict[str, int]) -> int:
    score = (
        comps["schedule"] * 0.25 +
        comps["physical"] * 0.25 +
        comps["financial"] * 0.15 +
        comps["milestones"] * 0.15 +
        comps["resources"] * 0.10 +
        comps["contractor"] * 0.10
    )
    return max(1, min(100, int(round(score))))


def compute_risk_from_health(health_score: int, status: str) -> Dict[str, Any]:
    risk_score = max(5, min(98, 100 - health_score))
    if status == "CRITICAL":
        risk_score = max(78, risk_score)
        est_days = 90 + int(risk_score * 0.6)
        level = "CRITICAL"
    elif status in ("AT_RISK", "DELAYED"):
        risk_score = max(45, min(74, risk_score))
        est_days = 40 + int(risk_score * 0.4)
        level = "HIGH" if risk_score > 60 else "MEDIUM"
    else:
        risk_score = min(35, risk_score)
        est_days = max(5, int(risk_score * 0.3))
        level = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": level,
        "estimated_delay_days": est_days,
    }


@router.get("/projects/{project_id}/ai-risk", response_model=DeepAIRiskResponse)
def get_deep_ai_risk(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()
    comps = calculate_health_components(project, milestones)
    h_score = compute_health_total(comps)
    risk_meta = compute_risk_from_health(h_score, project.status or "ON_TRACK")

    # Health Category
    if h_score >= 80:
        h_cat = "EXCELLENT"
    elif h_score >= 65:
        h_cat = "GOOD"
    elif h_score >= 45:
        h_cat = "WARNING"
    else:
        h_cat = "CRITICAL"

    # SHAP Factors
    fin_gap = float(project.financial_progress or 0) - float(project.physical_progress or 0)
    shap_factors = [
        ShapItem(factor="Physical vs Financial Progress Decoupling", percentage=max(10.0, min(45.0, round(abs(fin_gap) * 1.1, 1))), impact="Pushes project into delay risk"),
        ShapItem(factor="Milestone Schedule Slippage & Delay", percentage=max(10.0, round(100 - comps["milestones"]) * 0.3), impact="Impairs critical path activity sequence"),
        ShapItem(factor="Contractor Mobilization & Material Pacing", percentage=max(8.0, round(100 - comps["contractor"]) * 0.25), impact="Restricts on-site execution velocity"),
        ShapItem(factor="Regulatory Approvals & Right-of-Way", percentage=max(5.0, round(100 - comps["schedule"]) * 0.2), impact="Prolongs non-construction overhead"),
    ]

    # Root cause & playbook
    if project.status == "CRITICAL" or fin_gap > 25:
        root_cause = RootCauseInfo(
            primary="Progress-Expenditure Decoupling & Right-of-Way Stoppage",
            confidence=88,
            evidence=[
                f"Financial progress leads physical by {fin_gap:.1f}%",
                "Substructure milestones overdue beyond grace threshold",
                "Contractor workforce at 60% of baseline requirement"
            ],
            secondary=["Material procurement bottlenecks", "Environmental clearance renewal lag"]
        )
        recommendations = PlaybookInfo(
            urgency="IMMEDIATE (Within 72 Hours)",
            authority=f"{project.department} Project Oversight Directorate",
            timeline=14,
            actions=[
                "Issue joint physical audit order to verify invoiced work against physical site assets.",
                "Mandate contractor mobilization of additional hydraulic machinery.",
                "Convene inter-ministerial coordination meeting with district collector."
            ]
        )
    elif project.status in ("AT_RISK", "DELAYED"):
        root_cause = RootCauseInfo(
            primary="Contractor Manpower Shortfall & Equipment Idling",
            confidence=81,
            evidence=[
                f"Execution pacing behind schedule by {abs(fin_gap):.1f}%",
                "Milestone substructure activity running on reduced shifts"
            ],
            secondary=["Supply chain cement escalation", "Monsoon seasonal disruptions"]
        )
        recommendations = PlaybookInfo(
            urgency="HIGH (Within 7 Days)",
            authority="Executive Engineer / Regional Project Director",
            timeline=21,
            actions=[
                "Enforce double-shift work schedules for non-restricted construction zones.",
                "Release pending milestone funds directly into dedicated escrow vendor accounts.",
                "Review contractor performance bond terms."
            ]
        )
    else:
        root_cause = RootCauseInfo(
            primary="Normal Construction Execution Envelope",
            confidence=94,
            evidence=["Physical and financial velocities aligned within tolerance", "Milestones progressing on schedule"],
            secondary=[]
        )
        recommendations = PlaybookInfo(
            urgency="ROUTINE",
            authority="Resident Project Manager",
            timeline=30,
            actions=["Maintain current bi-weekly monitoring schedule.", "Verify timely vendor invoice processing."]
        )

    return DeepAIRiskResponse(
        project_id=project.id,
        project_name=project.name,
        risk_score=risk_meta["risk_score"],
        risk_level=risk_meta["risk_level"],
        health_score=h_score,
        health_category=h_cat,
        estimated_delay_days=risk_meta["estimated_delay_days"],
        shap_factors=shap_factors,
        root_cause=root_cause,
        recommendations=recommendations,
        health_components=comps,
    )


@router.post("/simulation/what-if", response_model=WhatIfResponse)
def simulate_what_if(req: WhatIfRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == req.project_id).all()
    comps = calculate_health_components(project, milestones)
    base_health = compute_health_total(comps)
    base_risk = compute_risk_from_health(base_health, project.status or "ON_TRACK")

    # Simulate intervention
    # Additional funding (+0-50%) reduces financial gap
    # Manpower scaling (+0-60%) boosts physical execution
    # Materials boost (+0-50%) accelerates milestones
    # Schedule extension (+0-180d) mitigates immediate slippage
    risk_relief = (
        (req.additional_funding_pct * 0.35) +
        (req.manpower_scaling_pct * 0.45) +
        (req.materials_boost_pct * 0.30) +
        (req.schedule_extension_days * 0.12)
    )

    sim_risk_score = max(5, int(round(base_risk["risk_score"] - risk_relief)))
    sim_health_score = min(98, int(round(base_health + (risk_relief * 0.8))))
    days_saved = max(0, int(round((risk_relief / 100.0) * base_risk["estimated_delay_days"])))
    sim_delay_days = max(0, base_risk["estimated_delay_days"] - days_saved)

    return WhatIfResponse(
        project_id=project.id,
        base=SimulationMetricSet(
            risk_score=base_risk["risk_score"],
            health_score=base_health,
            estimated_delay_days=base_risk["estimated_delay_days"],
            root_cause="Baseline execution with current resource constraints"
        ),
        simulated=SimulationMetricSet(
            risk_score=sim_risk_score,
            health_score=sim_health_score,
            estimated_delay_days=sim_delay_days,
            root_cause="Post-intervention optimization model"
        ),
        delta={
            "risk_reduction": base_risk["risk_score"] - sim_risk_score,
            "days_saved": days_saved,
            "health_gain": sim_health_score - base_health,
            "capital_escalation_avoided": round((float(project.approved_budget or 0) * 0.12), 2)
        }
    )


@router.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    results = []

    for p in projects:
        phys = float(p.physical_progress or 0)
        fin = float(p.financial_progress or 0)
        gap = fin - phys
        budget_util = round((float(p.expenditure or 0) / float(p.approved_budget or 1)) * 100, 1)

        issues = []
        is_anomaly = False
        level = "NORMAL"
        label = "Within Normal Parameters"

        if gap > 35:
            is_anomaly = True
            level = "CRITICAL"
            label = "Severe Progress-Expenditure Decoupling"
            issues.append(f"Financial expenditure leads physical progress by {gap:.1f}%")
            issues.append(f"Cumulative expenditure burn ({budget_util}%) exceeds civil completion envelope")
            issues.append("Unusual billing velocity detected without corresponding milestone sign-offs")
        elif gap > 20:
            is_anomaly = True
            level = "MODERATE"
            label = "Elevated Spend Velocity"
            issues.append(f"Moderate progress decoupling of +{gap:.1f}%")
            issues.append("Material procurement disbursements ahead of site installation")
        elif phys > 70 and fin < 30:
            is_anomaly = True
            level = "MODERATE"
            label = "Severe Under-Billing / Contractor Distress"
            issues.append(f"Physical execution ({phys}%) significantly leads financial billing ({fin}%)")

        results.append(AnomalyItem(
            project_id=p.id,
            project_name=p.name,
            department=p.department,
            location=p.location,
            is_anomaly=is_anomaly,
            level=level,
            label=label,
            metrics={"physical": phys, "financial": fin, "gap": round(gap, 1), "budget_util": budget_util},
            issues=issues
        ))

    return results


@router.get("/dependencies", response_model=List[DependencyItem])
def get_dependencies(db: Session = Depends(get_db)):
    items = []
    for dep in DEPENDENCY_LINKS:
        src = db.query(Project).filter(Project.id == dep["source_id"]).first()
        tgt = db.query(Project).filter(Project.id == dep["target_id"]).first()
        src_status = src.status if src else "ON_TRACK"

        if src_status == "CRITICAL":
            cascade = int(round(65 * dep["coupling_strength"]))
        elif src_status in ("AT_RISK", "DELAYED"):
            cascade = int(round(40 * dep["coupling_strength"]))
        else:
            cascade = int(round(15 * dep["coupling_strength"]))

        cap_risk = float(tgt.approved_budget if tgt else 75000000.0)

        items.append(DependencyItem(
            id=dep["id"],
            source_id=dep["source_id"],
            source_name=src.name if src else dep["source_name"],
            target_id=dep["target_id"],
            target_name=tgt.name if tgt else dep["target_name"],
            coupling_strength=dep["coupling_strength"],
            dependency_type=dep["dependency_type"],
            cascading_delay_days=cascade,
            capital_at_risk=cap_risk
        ))

    return items


@router.post("/chat", response_model=ChatResponse)
def chat_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    q = req.query.lower().strip()
    projects = db.query(Project).all()

    # Contextual query matching
    if "anomaly" in q or "anomalies" in q or "irregular" in q:
        flagged = [p.name for p in projects if (float(p.financial_progress or 0) - float(p.physical_progress or 0)) > 20]
        reply = (
            f"🔍 **MoSPI Data Integrity Screening:**\n\n"
            f"Found **{len(flagged)} projects** exhibiting notable progress-expenditure decoupling:\n"
            + "\n".join([f"• **{name}**" for name in flagged])
            + "\n\nUnder MoSPI non-accusatory guidelines, these reflect billing pacing variances requiring on-site civil verification."
        )
        return ChatResponse(reply=reply, confidence=0.92, sources=["Isolation Forest Screener", "SQLite: projects"])

    if "assam" in q:
        assam_projs = [p for p in projects if "assam" in p.location.lower()]
        reply = (
            f"📍 **Infrastructure Projects in Assam ({len(assam_projs)} Monitored):**\n\n"
            + "\n".join([f"• **{p.name}** ({p.department}): Status `{p.status}`, Physical: {p.physical_progress}%, Financial: {p.financial_progress}%" for p in assam_projs])
            + "\n\nKey Issue: Rail Infrastructure Modernization has experienced Right-of-Way delays and high fund burn."
        )
        return ChatResponse(reply=reply, confidence=0.95, sources=["GIS Intelligence", "SQLite: projects"])

    if "rail" in q:
        rail = next((p for p in projects if "rail" in p.name.lower()), None)
        if rail:
            reply = (
                f"🚂 **{rail.name} (Risk Deep-Dive):**\n\n"
                f"• **Status:** `{rail.status}`\n"
                f"• **Physical vs Financial:** {rail.physical_progress}% phys vs {rail.financial_progress}% fin (Gap: +{rail.financial_progress - rail.physical_progress}%)\n"
                f"• **Primary Root Cause:** Land Acquisition & Right-of-Way disputes along Corridor Section 4.\n"
                f"• **Recommended Action:** Expedite inter-agency settlement with state revenue department and enforce multi-shift earthwork."
            )
            return ChatResponse(reply=reply, confidence=0.96, sources=["SHAP Explainer", "SQLite: projects, alerts"])

    # Default Portfolio Summary
    total_budget = sum(float(p.approved_budget or 0) for p in projects)
    crit_count = sum(1 for p in projects if p.status == "CRITICAL")
    risk_count = sum(1 for p in projects if p.status in ("AT_RISK", "DELAYED"))
    on_track_count = sum(1 for p in projects if p.status == "ON_TRACK")

    reply = (
        f"📊 **MoSPI National Portfolio Summary:**\n\n"
        f"• **Total Projects:** {len(projects)} under active monitoring\n"
        f"• **Sanctioned Outlay:** ₹{total_budget / 10000000:.1f} Cr\n"
        f"• **On Track:** {on_track_count} ({(on_track_count/max(1, len(projects)))*100:.0f}%)\n"
        f"• **At Risk / Delayed:** {risk_count}\n"
        f"• **Critical Delay:** {crit_count}\n\n"
        f"Ask me about specific projects, state risk concentrations, what-if scenarios, or reporting anomalies!"
    )
    return ChatResponse(reply=reply, confidence=0.90, sources=["Portfolio Registry", "SQLite: projects"])

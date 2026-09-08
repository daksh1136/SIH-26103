from datetime import date, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .models import Alert, Milestone, Project, ProjectUpdate
from .schemas import (
    AlertResponse,
    MilestoneResponse,
    ProjectResponse,
    ProjectUpdateResponse,
)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="ProjectPulse",
    version="1.0.0",
    description=(
        "SIH26103 - MoSPI Integrated "
        "Project Monitoring Platform"
    ),
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# DEMO DATA
# =========================================================

def seed_database():
    db = SessionLocal()

    try:
        existing = db.query(Project).count()

        if existing > 0:
            return

        today = date.today()

        projects = [
            Project(
                name="National Highway Development - Demo",
                department="Infrastructure",
                location="Assam",
                manager="Project Manager A",
                start_date=today - timedelta(days=240),
                planned_completion=today + timedelta(days=120),
                approved_budget=85000000,
                released_funds=70000000,
                expenditure=52000000,
                physical_progress=62,
                financial_progress=61,
                status="ON_TRACK",
            ),
            Project(
                name="Rural Water Supply Network - Demo",
                department="Rural Development",
                location="Meghalaya",
                manager="Project Manager B",
                start_date=today - timedelta(days=300),
                planned_completion=today + timedelta(days=60),
                approved_budget=42000000,
                released_funds=39000000,
                expenditure=36000000,
                physical_progress=58,
                financial_progress=86,
                status="AT_RISK",
            ),
            Project(
                name="Digital Governance Platform - Demo",
                department="Digital Governance",
                location="Tripura",
                manager="Project Manager C",
                start_date=today - timedelta(days=150),
                planned_completion=today + timedelta(days=180),
                approved_budget=25000000,
                released_funds=20000000,
                expenditure=11000000,
                physical_progress=45,
                financial_progress=44,
                status="ON_TRACK",
            ),
            Project(
                name="Urban Development Mission - Demo",
                department="Urban Development",
                location="Mizoram",
                manager="Project Manager D",
                start_date=today - timedelta(days=330),
                planned_completion=today - timedelta(days=30),
                approved_budget=65000000,
                released_funds=60000000,
                expenditure=57000000,
                physical_progress=61,
                financial_progress=88,
                status="DELAYED",
            ),
            Project(
                name="Power Transmission Expansion - Demo",
                department="Energy",
                location="Nagaland",
                manager="Project Manager E",
                start_date=today - timedelta(days=270),
                planned_completion=today + timedelta(days=90),
                approved_budget=110000000,
                released_funds=90000000,
                expenditure=85000000,
                physical_progress=49,
                financial_progress=77,
                status="AT_RISK",
            ),
            Project(
                name="District Healthcare Infrastructure - Demo",
                department="Health",
                location="Arunachal Pradesh",
                manager="Project Manager F",
                start_date=today - timedelta(days=120),
                planned_completion=today + timedelta(days=240),
                approved_budget=38000000,
                released_funds=15000000,
                expenditure=8000000,
                physical_progress=31,
                financial_progress=21,
                status="ON_TRACK",
            ),
            Project(
                name="Education Infrastructure Upgrade - Demo",
                department="Education",
                location="Sikkim",
                manager="Project Manager G",
                start_date=today - timedelta(days=250),
                planned_completion=today + timedelta(days=45),
                approved_budget=30000000,
                released_funds=28000000,
                expenditure=27000000,
                physical_progress=52,
                financial_progress=90,
                status="AT_RISK",
            ),
            Project(
                name="Rail Infrastructure Modernization - Demo",
                department="Railways",
                location="Assam",
                manager="Project Manager H",
                start_date=today - timedelta(days=420),
                planned_completion=today - timedelta(days=90),
                approved_budget=150000000,
                released_funds=145000000,
                expenditure=135000000,
                physical_progress=43,
                financial_progress=90,
                status="CRITICAL",
            ),
            Project(
                name="Flood Management System - Demo",
                department="Water Resources",
                location="Manipur",
                manager="Project Manager I",
                start_date=today - timedelta(days=100),
                planned_completion=today + timedelta(days=250),
                approved_budget=55000000,
                released_funds=20000000,
                expenditure=12000000,
                physical_progress=27,
                financial_progress=22,
                status="ON_TRACK",
            ),
            Project(
                name="Smart City Connectivity - Demo",
                department="Urban Development",
                location="Meghalaya",
                manager="Project Manager J",
                start_date=today - timedelta(days=390),
                planned_completion=today - timedelta(days=15),
                approved_budget=72000000,
                released_funds=70000000,
                expenditure=68000000,
                physical_progress=48,
                financial_progress=94,
                status="CRITICAL",
            ),
        ]

        db.add_all(projects)
        db.commit()

        for project in projects:
            db.refresh(project)

        # -----------------------------------------------------
        # MILESTONES
        # -----------------------------------------------------

        for project in projects:

            db.add(
                Milestone(
                    project_id=project.id,
                    name="Planning & Approval",
                    planned_date=(
                        project.start_date
                        + timedelta(days=45)
                    ),
                    status="COMPLETED",
                    actual_date=(
                        project.start_date
                        + timedelta(days=42)
                    ),
                )
            )

            db.add(
                Milestone(
                    project_id=project.id,
                    name="Implementation Phase",
                    planned_date=(
                        project.start_date
                        + timedelta(days=180)
                    ),
                    status=(
                        "OVERDUE"
                        if project.status in [
                            "DELAYED",
                            "CRITICAL",
                        ]
                        else "COMPLETED"
                    ),
                    actual_date=(
                        None
                        if project.status in [
                            "DELAYED",
                            "CRITICAL",
                        ]
                        else (
                            project.start_date
                            + timedelta(days=175)
                        )
                    ),
                )
            )

            db.add(
                Milestone(
                    project_id=project.id,
                    name="Final Completion",
                    planned_date=project.planned_completion,
                    status="UPCOMING",
                    actual_date=None,
                )
            )

        # -----------------------------------------------------
        # PROJECT UPDATES
        # -----------------------------------------------------

        for project in projects:

            db.add(
                ProjectUpdate(
                    project_id=project.id,
                    progress=project.physical_progress,
                    expenditure=project.expenditure,
                    notes=(
                        "Demo project status update "
                        "for monitoring."
                    ),
                    update_date=(
                        datetime.utcnow()
                        - timedelta(days=3)
                    ),
                )
            )

        db.commit()

    finally:
        db.close()


seed_database()


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "name": "ProjectPulse",
        "problem_statement": "SIH26103",
        "organization": "MoSPI",
        "message": (
            "Integrated Project Monitoring "
            "Platform is running"
        ),
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "ProjectPulse API",
        "timestamp": datetime.utcnow(),
    }


# =========================================================
# PROJECTS
# =========================================================

@app.get(
    "/api/projects",
    response_model=list[ProjectResponse],
)
def get_projects(
    db: Session = Depends(get_db),
):
    return (
        db.query(Project)
        .order_by(Project.id)
        .all()
    )


@app.get(
    "/api/projects/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


# =========================================================
# MILESTONES
# =========================================================

@app.get(
    "/api/milestones",
    response_model=list[MilestoneResponse],
)
def get_milestones(
    db: Session = Depends(get_db),
):
    return (
        db.query(Milestone)
        .order_by(Milestone.planned_date)
        .all()
    )


@app.get(
    "/api/projects/{project_id}/milestones",
    response_model=list[MilestoneResponse],
)
def get_project_milestones(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return (
        db.query(Milestone)
        .filter(
            Milestone.project_id == project_id
        )
        .order_by(Milestone.planned_date)
        .all()
    )


# =========================================================
# PROJECT UPDATES
# =========================================================

@app.get(
    "/api/projects/{project_id}/updates",
    response_model=list[ProjectUpdateResponse],
)
def get_project_updates(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return (
        db.query(ProjectUpdate)
        .filter(
            ProjectUpdate.project_id == project_id
        )
        .order_by(
            ProjectUpdate.update_date.desc()
        )
        .all()
    )


# =========================================================
# ALERTS
# =========================================================

@app.get(
    "/api/alerts",
    response_model=list[AlertResponse],
)
def get_alerts(
    db: Session = Depends(get_db),
):
    return (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .all()
    )


@app.get(
    "/api/projects/{project_id}/alerts",
    response_model=list[AlertResponse],
)
def get_project_alerts(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return (
        db.query(Alert)
        .filter(
            Alert.project_id == project_id
        )
        .order_by(
            Alert.created_at.desc()
        )
        .all()
    )


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@app.get("/api/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    total = len(projects)

    on_track = sum(
        1
        for p in projects
        if p.status == "ON_TRACK"
    )

    at_risk = sum(
        1
        for p in projects
        if p.status == "AT_RISK"
    )

    delayed = sum(
        1
        for p in projects
        if p.status == "DELAYED"
    )

    critical = sum(
        1
        for p in projects
        if p.status == "CRITICAL"
    )

    total_budget = sum(
        p.approved_budget or 0
        for p in projects
    )

    total_released = sum(
        p.released_funds or 0
        for p in projects
    )

    total_expenditure = sum(
        p.expenditure or 0
        for p in projects
    )

    average_physical = (
        sum(
            p.physical_progress or 0
            for p in projects
        )
        / total
        if total
        else 0
    )

    average_financial = (
        sum(
            p.financial_progress or 0
            for p in projects
        )
        / total
        if total
        else 0
    )

    return {
        "total_projects": total,
        "status": {
            "on_track": on_track,
            "at_risk": at_risk,
            "delayed": delayed,
            "critical": critical,
        },
        "financial": {
            "approved_budget": total_budget,
            "released_funds": total_released,
            "expenditure": total_expenditure,
        },
        "progress": {
            "average_physical": round(
                average_physical,
                2,
            ),
            "average_financial": round(
                average_financial,
                2,
            ),
        },
    }


# =========================================================
# STATUS DISTRIBUTION
# =========================================================

@app.get("/api/dashboard/status-distribution")
def status_distribution(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    counts = {
        "ON_TRACK": 0,
        "AT_RISK": 0,
        "DELAYED": 0,
        "CRITICAL": 0,
    }

    for project in projects:
        if project.status in counts:
            counts[project.status] += 1

    return {
        "total": len(projects),
        "distribution": counts,
    }


# =========================================================
# DEPARTMENT SUMMARY
# =========================================================

@app.get("/api/dashboard/department-summary")
def department_summary(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    departments = {}

    for project in projects:

        department = project.department

        if department not in departments:
            departments[department] = {
                "department": department,
                "projects": 0,
                "budget": 0,
                "expenditure": 0,
                "average_progress": 0,
                "risk_projects": 0,
            }

        data = departments[department]

        data["projects"] += 1

        data["budget"] += (
            project.approved_budget or 0
        )

        data["expenditure"] += (
            project.expenditure or 0
        )

        data["average_progress"] += (
            project.physical_progress or 0
        )

        if project.status in [
            "AT_RISK",
            "DELAYED",
            "CRITICAL",
        ]:
            data["risk_projects"] += 1

    for data in departments.values():

        if data["projects"] > 0:
            data["average_progress"] = round(
                data["average_progress"]
                / data["projects"],
                2,
            )

        data["budget"] = round(
            data["budget"],
            2,
        )

        data["expenditure"] = round(
            data["expenditure"],
            2,
        )

    return list(
        departments.values()
    )


# =========================================================
# PROJECT RISK ENGINE
# =========================================================

@app.get("/api/projects/{project_id}/risk")
def project_risk(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    # -----------------------------------------------------
    # PROGRESS GAP
    # -----------------------------------------------------

    progress_gap = (
        project.financial_progress
        - project.physical_progress
    )

    progress_risk = min(
        max(progress_gap * 1.2, 0),
        35,
    )

    # -----------------------------------------------------
    # DELAY RISK
    # -----------------------------------------------------

    today = date.today()

    delay_days = (
        today
        - project.planned_completion
    ).days

    delay_risk = min(
        max(delay_days / 5, 0),
        30,
    )

    # -----------------------------------------------------
    # EXPENDITURE RISK
    # -----------------------------------------------------

    expenditure_ratio = (
        (
            project.expenditure
            / project.approved_budget
        )
        * 100
        if project.approved_budget
        else 0
    )

    expenditure_risk = min(
        max(
            expenditure_ratio
            - project.physical_progress,
            0,
        ),
        25,
    )

    # -----------------------------------------------------
    # STATUS RISK
    # -----------------------------------------------------

    status_risk = {
        "ON_TRACK": 5,
        "AT_RISK": 20,
        "DELAYED": 30,
        "CRITICAL": 40,
    }.get(
        project.status,
        10,
    )

    # -----------------------------------------------------
    # FINAL SCORE
    # -----------------------------------------------------

    score = min(
        round(
            progress_risk
            + delay_risk
            + expenditure_risk
            + status_risk,
            2,
        ),
        100,
    )

    if score >= 75:
        level = "CRITICAL"

    elif score >= 50:
        level = "HIGH"

    elif score >= 25:
        level = "MODERATE"

    else:
        level = "LOW"

    # -----------------------------------------------------
    # RISK REASONS
    # -----------------------------------------------------

    reasons = []

    if progress_gap > 15:
        reasons.append(
            "Financial progress is significantly "
            "ahead of physical progress."
        )

    if delay_days > 0:
        reasons.append(
            f"Project is {delay_days} days "
            "beyond planned completion."
        )

    if expenditure_ratio > 80:
        reasons.append(
            "High proportion of approved budget "
            "has already been spent."
        )

    if project.status in [
        "AT_RISK",
        "DELAYED",
        "CRITICAL",
    ]:
        reasons.append(
            "Current project status is "
            f"{project.status.replace('_', ' ')}."
        )

    if not reasons:
        reasons.append(
            "No major risk indicators detected."
        )

    # -----------------------------------------------------
    # RECOMMENDATION
    # -----------------------------------------------------

    if level in ["CRITICAL", "HIGH"]:
        recommendation = (
            "Immediate review and corrective "
            "action recommended."
        )

    elif level == "MODERATE":
        recommendation = (
            "Increase monitoring frequency "
            "and review project performance."
        )

    else:
        recommendation = (
            "Continue routine project monitoring."
        )

    return {
        "project_id": project.id,
        "project": project.name,
        "risk_score": score,
        "risk_level": level,
        "status": project.status,
        "indicators": {
            "progress_gap": round(
                progress_gap,
                2,
            ),
            "delay_days": max(
                delay_days,
                0,
            ),
            "expenditure_ratio": round(
                expenditure_ratio,
                2,
            ),
        },
        "reasons": reasons,
        "recommendation": recommendation,
    }
    # =========================================================
# DASHBOARD ANALYTICS
# =========================================================

@app.get("/api/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    total_projects = len(projects)

    on_track = sum(
        1 for p in projects
        if p.status == "ON_TRACK"
    )

    at_risk = sum(
        1 for p in projects
        if p.status == "AT_RISK"
    )

    delayed = sum(
        1 for p in projects
        if p.status == "DELAYED"
    )

    critical = sum(
        1 for p in projects
        if p.status == "CRITICAL"
    )

    approved_budget = sum(
        p.approved_budget or 0
        for p in projects
    )

    released_funds = sum(
        p.released_funds or 0
        for p in projects
    )

    expenditure = sum(
        p.expenditure or 0
        for p in projects
    )

    average_physical = (
        sum(p.physical_progress or 0 for p in projects)
        / total_projects
        if total_projects
        else 0
    )

    average_financial = (
        sum(p.financial_progress or 0 for p in projects)
        / total_projects
        if total_projects
        else 0
    )

    return {
        "total_projects": total_projects,

        "status": {
            "on_track": on_track,
            "at_risk": at_risk,
            "delayed": delayed,
            "critical": critical,
        },

        "financial": {
            "approved_budget": approved_budget,
            "released_funds": released_funds,
            "expenditure": expenditure,
        },

        "progress": {
            "average_physical": round(
                average_physical,
                2,
            ),
            "average_financial": round(
                average_financial,
                2,
            ),
        },
    }


# =========================================================
# STATUS DISTRIBUTION
# =========================================================

@app.get("/api/dashboard/status-distribution")
def status_distribution(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    distribution = {}

    for project in projects:
        status = project.status or "UNKNOWN"

        distribution[status] = (
            distribution.get(status, 0) + 1
        )

    return [
        {
            "status": status,
            "count": count,
        }
        for status, count in distribution.items()
    ]


# =========================================================
# DEPARTMENT SUMMARY
# =========================================================

@app.get("/api/dashboard/department-summary")
def department_summary(
    db: Session = Depends(get_db),
):
    projects = db.query(Project).all()

    departments = {}

    for project in projects:
        department = (
            project.department or "Unknown"
        )

        if department not in departments:
            departments[department] = {
                "department": department,
                "project_count": 0,
                "physical_progress": 0,
                "financial_progress": 0,
                "budget": 0,
                "expenditure": 0,
            }

        departments[department][
            "project_count"
        ] += 1

        departments[department][
            "physical_progress"
        ] += project.physical_progress or 0

        departments[department][
            "financial_progress"
        ] += project.financial_progress or 0

        departments[department][
            "budget"
        ] += project.approved_budget or 0

        departments[department][
            "expenditure"
        ] += project.expenditure or 0

    result = []

    for data in departments.values():

        count = data["project_count"]

        result.append({
            "department": data["department"],
            "project_count": count,

            "average_physical_progress": round(
                data["physical_progress"] / count,
                2,
            ),

            "average_financial_progress": round(
                data["financial_progress"] / count,
                2,
            ),

            "budget": data["budget"],
            "expenditure": data["expenditure"],
        })

    return result


@app.get("/api/milestones")
def get_milestones(db: Session = Depends(get_db)):
    milestones = (
        db.query(Milestone)
        .order_by(Milestone.due_date.asc())
        .all()
    )

    return [
        {
            "id": milestone.id,
            "project_id": milestone.project_id,
            "name": milestone.name,
            "description": milestone.description,
            "due_date": milestone.due_date,
            "status": milestone.status,
            "completion_percentage": milestone.completion_percentage,
        }
        for milestone in milestones
    ]

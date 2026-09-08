from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Alert, Milestone, Project, ProjectUpdate
from .routers import ai, contractors, milestones, salvage
from .schemas import (
    AlertResponse,
    DashboardSummaryResponse,
    DepartmentSummaryItem,
    HealthResponse,
    ProjectResponse,
    ProjectUpdateResponse,
    RiskResponse,
    RootResponse,
    StatusDistributionResponse,
)
from .services.risk_engine import calculate_risk

# Ensure tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MoSPI ProjectPulse API",
    description="Backend API with SQLite database and AI Decision Intelligence for SIH26103",
    version="2.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Mount Sub-Routers
app.include_router(milestones.router)
app.include_router(ai.router)
app.include_router(contractors.router)
app.include_router(salvage.router)



# =========================================================
# ROOT & HEALTH
# =========================================================

@app.get("/", response_model=RootResponse)
def root():
    return {
        "name": "ProjectPulse API",
        "problem_statement": "SIH26103",
        "organization": "MoSPI",
        "message": "Intelligent government project monitoring and explainable risk analysis backend.",
        "version": "2.0.0",
    }


@app.get("/api/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(func.now()) if hasattr(func, "now") else db.query(Project.id).first()
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "ProjectPulse Backend (FastAPI + SQLite + AI Engine)",
        "timestamp": datetime.now(timezone.utc),
        "database_connected": db_ok,
        "ai_engine_ready": True,
    }


# =========================================================
# PROJECTS
# =========================================================

@app.get("/api/projects", response_model=list[ProjectResponse])
def get_projects(
    status: Optional[str] = Query(default=None),
    department: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if status and status.upper() != "ALL":
        query = query.filter(func.upper(Project.status) == status.upper())
    if department and department.upper() != "ALL":
        query = query.filter(Project.department == department)

    return query.order_by(Project.id.asc()).all()


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# =========================================================
# PROJECT UPDATES
# =========================================================

@app.get("/api/projects/{project_id}/updates", response_model=list[ProjectUpdateResponse])
def get_project_updates(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    project_exists = db.query(Project.id).filter(Project.id == project_id).first()
    if not project_exists:
        raise HTTPException(status_code=404, detail="Project not found")

    return (
        db.query(ProjectUpdate)
        .filter(ProjectUpdate.project_id == project_id)
        .order_by(ProjectUpdate.update_date.desc())
        .all()
    )


# =========================================================
# ALERTS
# =========================================================

@app.get("/api/alerts", response_model=list[AlertResponse])
def get_alerts(
    severity: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)
    if severity:
        query = query.filter(func.upper(Alert.severity) == severity.upper())
    if status:
        query = query.filter(func.upper(Alert.status) == status.upper())

    return query.order_by(Alert.created_at.desc()).all()


@app.get("/api/projects/{project_id}/alerts", response_model=list[AlertResponse])
def get_project_alerts(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    project_exists = db.query(Project.id).filter(Project.id == project_id).first()
    if not project_exists:
        raise HTTPException(status_code=404, detail="Project not found")

    return (
        db.query(Alert)
        .filter(Alert.project_id == project_id)
        .order_by(Alert.created_at.desc())
        .all()
    )


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@app.get("/api/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    total_projects = len(projects)

    status_counts = {
        "on_track": 0,
        "at_risk": 0,
        "delayed": 0,
        "critical": 0,
    }

    approved_budget = 0.0
    released_funds = 0.0
    expenditure = 0.0
    physical_values = []
    financial_values = []

    for project in projects:
        st = str(project.status or "ON_TRACK").upper()
        if st == "ON_TRACK":
            status_counts["on_track"] += 1
        elif st == "AT_RISK":
            status_counts["at_risk"] += 1
        elif st == "DELAYED":
            status_counts["delayed"] += 1
        elif st == "CRITICAL":
            status_counts["critical"] += 1

        approved_budget += float(project.approved_budget or 0)
        released_funds += float(project.released_funds or 0)
        expenditure += float(project.expenditure or 0)
        physical_values.append(float(project.physical_progress or 0))
        financial_values.append(float(project.financial_progress or 0))

    avg_phys = sum(physical_values) / len(physical_values) if physical_values else 0.0
    avg_fin = sum(financial_values) / len(financial_values) if financial_values else 0.0

    return {
        "total_projects": total_projects,
        "status": status_counts,
        "financial": {
            "approved_budget": approved_budget,
            "released_funds": released_funds,
            "expenditure": expenditure,
        },
        "progress": {
            "average_physical": round(avg_phys, 1),
            "average_financial": round(avg_fin, 1),
        },
    }


@app.get("/api/dashboard/status-distribution", response_model=StatusDistributionResponse)
def dashboard_status_distribution(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    distribution = {}
    for project in projects:
        st = str(project.status or "ON_TRACK").upper()
        distribution[st] = distribution.get(st, 0) + 1

    return {
        "total": len(projects),
        "distribution": distribution,
    }


@app.get("/api/dashboard/department-summary", response_model=list[DepartmentSummaryItem])
def dashboard_department_summary(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    departments = {}

    for project in projects:
        dept = project.department
        if dept not in departments:
            departments[dept] = {
                "projects": 0,
                "budget": 0.0,
                "expenditure": 0.0,
                "progress_values": [],
                "risk_projects": 0,
            }

        item = departments[dept]
        item["projects"] += 1
        item["budget"] += float(project.approved_budget or 0)
        item["expenditure"] += float(project.expenditure or 0)
        item["progress_values"].append(float(project.physical_progress or 0))

        if project.status in ("CRITICAL", "AT_RISK", "DELAYED"):
            item["risk_projects"] += 1

    response = []
    for dept, data in departments.items():
        prog_vals = data["progress_values"]
        avg_p = sum(prog_vals) / len(prog_vals) if prog_vals else 0.0
        response.append({
            "department": dept,
            "projects": data["projects"],
            "budget": data["budget"],
            "expenditure": data["expenditure"],
            "average_progress": round(avg_p, 1),
            "risk_projects": data["risk_projects"],
        })

    response.sort(key=lambda x: x["risk_projects"], reverse=True)
    return response


# Heuristic fallback risk endpoint (superseded by /api/projects/{id}/ai-risk)
@app.get("/api/projects/{project_id}/risk", response_model=RiskResponse)
def legacy_project_risk(
    project_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones_list = db.query(Milestone).filter(Milestone.project_id == project_id).all()
    updates_list = db.query(ProjectUpdate).filter(ProjectUpdate.project_id == project_id).all()

    return calculate_risk(project, milestones=milestones_list, updates=updates_list)

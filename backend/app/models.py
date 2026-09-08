from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# PROJECT
# =========================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False)
    department = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)
    manager = Column(String(150), nullable=False)

    start_date = Column(Date, nullable=False)
    planned_completion = Column(Date, nullable=False)

    approved_budget = Column(Float, default=0.0)
    released_funds = Column(Float, default=0.0)
    expenditure = Column(Float, default=0.0)

    physical_progress = Column(Float, default=0.0)
    financial_progress = Column(Float, default=0.0)

    status = Column(String(50), default="ON_TRACK")

    contractor_id = Column(
        Integer,
        ForeignKey("contractors.id"),
        nullable=True,
    )
    contractor_name = Column(String(200), nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    contractor = relationship(
        "Contractor",
        back_populates="projects",
    )

    milestones = relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    updates = relationship(
        "ProjectUpdate",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    alerts = relationship(
        "Alert",
        back_populates="project",
        cascade="all, delete-orphan",
    )


# =========================================================
# CONTRACTOR
# =========================================================

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    pan_cin = Column(String(50), nullable=True)
    incorporation_year = Column(Integer, default=2015)
    category = Column(String(50), default="Tier-2")
    status = Column(String(50), default="APPROVED")

    avg_rating = Column(Float, default=75.0)
    shell_risk_score = Column(Float, default=10.0)
    ghost_billing_flags = Column(Integer, default=0)
    litigation_count = Column(Integer, default=0)
    tax_compliance_status = Column(String(50), default="COMPLIANT")
    max_project_budget_handled = Column(Float, default=50000000.0)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    projects = relationship(
        "Project",
        back_populates="contractor",
    )

    histories = relationship(
        "ContractorProjectHistory",
        back_populates="contractor",
        cascade="all, delete-orphan",
    )


# =========================================================
# CONTRACTOR PROJECT HISTORY
# =========================================================

class ContractorProjectHistory(Base):
    __tablename__ = "contractor_project_history"

    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(
        Integer,
        ForeignKey("contractors.id"),
        nullable=False,
        index=True,
    )

    project_name = Column(String(200), nullable=False)
    ministry = Column(String(150), nullable=True)
    sanctioned_budget = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    cost_overrun_pct = Column(Float, default=0.0)
    planned_days = Column(Integer, default=365)
    actual_days = Column(Integer, default=365)
    delay_days = Column(Integer, default=0)
    completion_status = Column(String(50), default="COMPLETED")
    audit_irregularity_flag = Column(Integer, default=0)
    year_completed = Column(Integer, default=2023)

    contractor = relationship(
        "Contractor",
        back_populates="histories",
    )


# =========================================================
# MILESTONE
# =========================================================

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
    )

    name = Column(String(200), nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_date = Column(Date, nullable=True)
    status = Column(String(50), default="UPCOMING")

    project = relationship(
        "Project",
        back_populates="milestones",
    )

    # Backwards-compatible properties
    @property
    def planned_completion(self):
        return self.planned_date

    @property
    def actual_completion(self):
        return self.actual_date

    @property
    def progress(self):
        if self.status == "COMPLETED" or self.actual_date is not None:
            return 100.0
        elif self.status in ("IN_PROGRESS", "OVERDUE"):
            return 50.0
        return 0.0


# =========================================================
# PROJECT UPDATE
# =========================================================

class ProjectUpdate(Base):
    __tablename__ = "project_updates"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
    )

    progress = Column(Float, default=0.0)
    expenditure = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    update_date = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    project = relationship(
        "Project",
        back_populates="updates",
    )


# =========================================================
# ALERT
# =========================================================

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
    )

    severity = Column(String(30), default="MEDIUM")
    category = Column(String(80), nullable=False)
    message = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(30), default="OPEN")

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    project = relationship(
        "Project",
        back_populates="alerts",
    )

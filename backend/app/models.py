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

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
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

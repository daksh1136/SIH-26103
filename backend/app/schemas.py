from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# PROJECT
# =========================================================

class ProjectResponse(BaseModel):
    id: int
    name: str
    department: str
    location: str
    manager: str
    start_date: date
    planned_completion: date
    approved_budget: float = 0.0
    released_funds: float = 0.0
    expenditure: float = 0.0
    physical_progress: float = Field(default=0.0, ge=0, le=100)
    financial_progress: float = Field(default=0.0, ge=0, le=100)
    status: str = "ON_TRACK"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# MILESTONE
# =========================================================

class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    name: str
    planned_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: str
    # Compatibility fields
    planned_start: Optional[date] = None
    planned_completion: Optional[date] = None
    actual_completion: Optional[date] = None
    progress: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# PROJECT UPDATE
# =========================================================

class ProjectUpdateResponse(BaseModel):
    id: int
    project_id: int
    progress: float = 0.0
    expenditure: float = 0.0
    notes: Optional[str] = None
    update_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# ALERT
# =========================================================

class AlertResponse(BaseModel):
    id: int
    project_id: int
    severity: str
    category: str
    message: str
    recommendation: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# DASHBOARD
# =========================================================

class StatusCounts(BaseModel):
    on_track: int = 0
    at_risk: int = 0
    delayed: int = 0
    critical: int = 0


class FinancialSummary(BaseModel):
    approved_budget: float = 0.0
    released_funds: float = 0.0
    expenditure: float = 0.0


class ProgressSummary(BaseModel):
    average_physical: float = 0.0
    average_financial: float = 0.0


class DashboardSummaryResponse(BaseModel):
    total_projects: int
    status: StatusCounts
    financial: FinancialSummary
    progress: ProgressSummary


class StatusDistributionResponse(BaseModel):
    total: int
    distribution: Dict[str, int]


class DepartmentSummaryItem(BaseModel):
    department: str
    projects: int
    budget: float
    expenditure: float
    average_progress: float
    risk_projects: int


# =========================================================
# RISK ENGINE
# =========================================================

class RiskFactor(BaseModel):
    factor: str
    impact: float
    reason: str


class RiskIndicators(BaseModel):
    physical_progress: float
    financial_progress: float
    progress_gap: float
    budget_utilization: float
    expenditure: float
    approved_budget: float
    days_remaining: Optional[int] = None
    milestone_total: int = 0
    completed_milestones: int = 0
    overdue_milestones: int = 0
    delayed_milestones: int = 0
    milestone_completion_rate: float = 0.0
    progress_trend: str = "INSUFFICIENT_DATA"


class RiskResponse(BaseModel):
    project_id: int
    project: str
    risk_score: float
    risk_level: str
    health_score: float
    status: str
    indicators: RiskIndicators
    reasons: List[str]
    risk_factors: List[RiskFactor] = []
    recommendation: str


# =========================================================
# ADVANCED AI ENGINE INTELLIGENCE SCHEMAS
# =========================================================

class ShapItem(BaseModel):
    factor: str
    percentage: float
    impact: str


class RootCauseInfo(BaseModel):
    primary: str
    confidence: int
    evidence: List[str]
    secondary: List[str]


class PlaybookInfo(BaseModel):
    urgency: str
    authority: str
    timeline: int
    actions: List[str]


class DeepAIRiskResponse(BaseModel):
    project_id: int
    project_name: str
    risk_score: int
    risk_level: str
    health_score: int
    health_category: str
    estimated_delay_days: int
    shap_factors: List[ShapItem]
    root_cause: RootCauseInfo
    recommendations: PlaybookInfo
    health_components: Dict[str, int]


class WhatIfRequest(BaseModel):
    project_id: int
    additional_funding_pct: float = 0.0
    manpower_scaling_pct: float = 0.0
    materials_boost_pct: float = 0.0
    schedule_extension_days: int = 0


class SimulationMetricSet(BaseModel):
    risk_score: int
    health_score: int
    estimated_delay_days: int
    root_cause: Optional[str] = None


class WhatIfResponse(BaseModel):
    project_id: int
    base: SimulationMetricSet
    simulated: SimulationMetricSet
    delta: Dict[str, Any]


class AnomalyItem(BaseModel):
    project_id: int
    project_name: str
    department: str
    location: str
    is_anomaly: bool
    level: str
    label: str
    metrics: Dict[str, float]
    issues: List[str]


class DependencyItem(BaseModel):
    id: int
    source_id: int
    source_name: str
    target_id: int
    target_name: str
    coupling_strength: float
    dependency_type: str
    cascading_delay_days: int
    capital_at_risk: float


class ChatRequest(BaseModel):
    query: str
    project_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    confidence: float
    sources: List[str] = []


# =========================================================
# GENERIC
# =========================================================

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    database_connected: bool = True
    ai_engine_ready: bool = True


class RootResponse(BaseModel):
    name: str
    problem_statement: str
    organization: str
    message: str
    version: str = "2.0.0"

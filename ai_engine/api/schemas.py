"""
Pydantic data validation schemas for the MoSPI ProjectPulse AI Microservice.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProjectInputSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Project ID")
    name: Optional[str] = Field(default="Infrastructure Project", description="Project Name")
    department: Optional[str] = Field(default="Infrastructure", description="Executing Department")
    location: Optional[str] = Field(default="Assam", description="State or Location")
    status: Optional[str] = Field(default="ON_TRACK", description="Current Status (ON_TRACK, AT_RISK, DELAYED, CRITICAL)")
    start_date: Optional[str] = Field(default=None, description="Start Date (YYYY-MM-DD)")
    planned_completion: Optional[str] = Field(default=None, description="Planned Completion Date (YYYY-MM-DD)")

    planned_duration_days: Optional[float] = Field(default=365.0, description="Total planned duration in days")
    elapsed_duration_days: Optional[float] = Field(default=180.0, description="Days elapsed since commencement")

    physical_progress: Optional[float] = Field(default=50.0, ge=0.0, le=100.0, description="Physical progress percentage (0-100)")
    expected_progress: Optional[float] = Field(default=50.0, ge=0.0, le=100.0, description="Expected progress percentage (0-100)")
    financial_progress: Optional[float] = Field(default=50.0, ge=0.0, le=100.0, description="Financial progress percentage (0-100)")

    approved_budget: Optional[float] = Field(default=50_000_000.0, ge=0.0, description="Approved budget in INR")
    released_funds: Optional[float] = Field(default=40_000_000.0, ge=0.0, description="Released funds in INR")
    expenditure: Optional[float] = Field(default=35_000_000.0, ge=0.0, description="Cumulative expenditure in INR")

    milestones_delayed: Optional[int] = Field(default=0, ge=0, description="Count of delayed milestones")
    milestones_total: Optional[int] = Field(default=5, ge=1, description="Total number of monitored milestones")

    resource_availability: Optional[float] = Field(default=75.0, ge=0.0, le=100.0, description="Manpower & equipment availability %")
    contractor_performance: Optional[float] = Field(default=70.0, ge=0.0, le=100.0, description="Contractor performance score (0-100)")
    material_availability: Optional[float] = Field(default=75.0, ge=0.0, le=100.0, description="Material supply availability %")
    previous_delays: Optional[int] = Field(default=0, ge=0, description="Count of previous delay events")

    recent_progress_jump: Optional[float] = Field(default=None, description="Progress percentage jump in recent reporting period")


class RiskPredictionResponse(BaseModel):
    delay_probability: float
    delay_percentage: float
    risk_score: float
    risk_level: str
    risk_label: str
    badge_color: str
    predicted_delay_days: int
    model_used: str
    summary: str
    features: Dict[str, float]
    shap_explanation: Optional[Dict[str, Any]] = None


class HealthScoreResponse(BaseModel):
    health_score: float
    health_category: str
    category_label: str
    badge_color: str
    components: Dict[str, float]
    weights: Dict[str, int]


class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    anomaly_level: str
    status_label: str
    detected_issues: List[str]
    explanation: str
    metrics: Dict[str, float]


class RootCauseResponse(BaseModel):
    primary_cause: str
    secondary_causes: List[str]
    confidence_score: float
    evidence: List[Dict[str, Any]]
    diagnostic_summary: str


class RecommendationResponse(BaseModel):
    primary_cause: str
    secondary_causes: List[str]
    urgency: str
    recommended_actions: List[str]
    recovery_plan_required: bool
    responsible_authority: str
    target_timeline_days: int
    action_summary: str


class WhatIfInterventionRequest(BaseModel):
    project: ProjectInputSchema
    funding_increase_pct: Optional[float] = Field(default=0.0, description="Additional funding percentage release (e.g. 20.0)")
    manpower_increase_pct: Optional[float] = Field(default=0.0, description="Additional workforce deployment percentage (e.g. 25.0)")
    material_boost_pct: Optional[float] = Field(default=0.0, description="Material availability improvement percentage (e.g. 20.0)")
    contractor_support_pct: Optional[float] = Field(default=0.0, description="Contractor supervision and management boost (e.g. 15.0)")
    deadline_extension_days: Optional[int] = Field(default=0, description="Formal schedule extension in days (e.g. 60)")


class WhatIfResponse(BaseModel):
    is_effective: bool
    applied_interventions: List[str]
    baseline: Dict[str, Any]
    simulated: Dict[str, Any]
    delta: Dict[str, Any]
    simulation_summary: str


class AssistantQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query e.g. 'Why is Project 8 high risk?'")
    projects_pool: Optional[List[ProjectInputSchema]] = Field(default=None, description="Optional list of current projects to query")


class AssistantQueryResponse(BaseModel):
    query_type: str
    response: str
    project_name: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    flagged_count: Optional[int] = None
    matched_count: Optional[int] = None


class BatchAnalysisResponse(BaseModel):
    project_name: str
    risk: RiskPredictionResponse
    health: HealthScoreResponse
    shap: Dict[str, Any]
    root_cause: RootCauseResponse
    recommendation: RecommendationResponse
    anomaly: AnomalyDetectionResponse

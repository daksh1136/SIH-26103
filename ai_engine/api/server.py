"""
FastAPI Server exposing the complete AI & Decision Intelligence layer for SIH26103.
Provides endpoints for Delay Prediction, Project Health Score, Anomaly Detection,
Root Cause Diagnosis, Corrective Action Recommendations, What-If Simulation, and AI Assistant.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.api.schemas import (
    AnomalyDetectionResponse,
    AssistantQueryRequest,
    AssistantQueryResponse,
    BatchAnalysisResponse,
    HealthScoreResponse,
    ProjectInputSchema,
    RecommendationResponse,
    RiskPredictionResponse,
    RootCauseResponse,
    WhatIfInterventionRequest,
    WhatIfResponse,
)
from ai_engine.assistant.project_qa import get_project_assistant
from ai_engine.explainability.shap_explainer import get_explainer
from ai_engine.intelligence.anomaly_detection import get_anomaly_engine
from ai_engine.intelligence.dependency_impact import get_dependency_engine
from ai_engine.intelligence.recommendations import get_recommendation_engine
from ai_engine.intelligence.root_cause import get_root_cause_engine
from ai_engine.intelligence.what_if import get_what_if_simulator
from ai_engine.prediction.delay_model import get_delay_engine
from ai_engine.prediction.health_score import calculate_project_health_score
from ai_engine.prediction.model_trainer import get_model_benchmarks


app = FastAPI(
    title="MoSPI ProjectPulse — AI & Decision Intelligence Engine",
    version="2.0.0",
    description="Predictive Delay Engine, Explainable AI (SHAP), Dynamic Health Scoring, Anomaly Detection, and What-If Simulator for SIH26103.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "MoSPI ProjectPulse AI Intelligence Layer",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0",
    }


@app.get("/model-benchmarks")
def model_benchmarks():
    """Returns the multi-model tournament results (GBM vs RF vs XGBoost vs Logistic)."""
    return get_model_benchmarks()


@app.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_risk(project: ProjectInputSchema):
    """
    Predicts delay probability, risk score (0-100), risk tier,
    estimated delay days, and computed feature indicators.
    """
    data = project.model_dump()
    delay_engine = get_delay_engine()
    res = delay_engine.predict_single(data)

    explainer = get_explainer()
    shap_res = explainer.explain_prediction(data)
    res["shap_explanation"] = shap_res

    return res


@app.post("/project-health", response_model=HealthScoreResponse)
def project_health(project: ProjectInputSchema):
    """
    Computes dynamic 0-100 Project Health Score with 6 weighted category breakdowns:
    Schedule (25%), Physical Progress (25%), Financial (15%), Milestones (15%),
    Resources (10%), Contractor (10%).
    """
    data = project.model_dump()
    return calculate_project_health_score(data)


@app.post("/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly(project: ProjectInputSchema):
    """
    Evaluates project data integrity using Isolation Forest and statistical checks.
    Produces non-accusatory 'Potential anomaly — verification required' classifications.
    """
    data = project.model_dump()
    engine = get_anomaly_engine()
    return engine.detect_anomalies(data)


@app.post("/root-cause", response_model=RootCauseResponse)
def root_cause(project: ProjectInputSchema):
    """
    Diagnoses primary and secondary operational bottlenecks
    (Contractor resources, Material procurement, Financial imbalance, Milestone slippage).
    """
    data = project.model_dump()
    engine = get_root_cause_engine()
    return engine.diagnose(data)


@app.post("/recommend-action", response_model=RecommendationResponse)
def recommend_action(project: ProjectInputSchema):
    """
    Synthesizes prioritized corrective action recommendations mapped to root cause.
    """
    data = project.model_dump()
    engine = get_recommendation_engine()
    return engine.recommend(data)


@app.post("/what-if", response_model=WhatIfResponse)
def what_if_simulation(req: WhatIfInterventionRequest):
    """
    Simulates counterfactual interventions (funding +20%, workforce +25%, deadline extension)
    and provides a side-by-side comparative delta.
    """
    proj_data = req.project.model_dump()
    interventions = {
        "funding_increase_pct": req.funding_increase_pct,
        "manpower_increase_pct": req.manpower_increase_pct,
        "material_boost_pct": req.material_boost_pct,
        "contractor_support_pct": req.contractor_support_pct,
        "deadline_extension_days": req.deadline_extension_days,
    }
    simulator = get_what_if_simulator()
    return simulator.simulate(proj_data, interventions)


@app.post("/ask-project", response_model=AssistantQueryResponse)
def ask_project(req: AssistantQueryRequest):
    """
    Natural language AI project assistant answering queries about risks, anomalies,
    root causes, and department filters.
    """
    assistant = get_project_assistant()
    pool = [p.model_dump() for p in req.projects_pool] if req.projects_pool else []
    return assistant.ask(req.query, pool)


@app.post("/batch-analyze", response_model=BatchAnalysisResponse)
def batch_analyze(project: ProjectInputSchema):
    """
    Runs the full end-to-end AI intelligence pipeline in a single unified call:
    Predictive Delay + Dynamic Health Score + SHAP Explainability + Root Cause +
    Corrective Actions + Anomaly Detection.
    """
    data = project.model_dump()
    name = data.get("name") or "Infrastructure Project"

    delay_engine = get_delay_engine()
    risk_res = delay_engine.predict_single(data)

    health_res = calculate_project_health_score(data)
    explainer = get_explainer()
    shap_res = explainer.explain_prediction(data)
    risk_res["shap_explanation"] = shap_res

    rc_engine = get_root_cause_engine()
    rc_res = rc_engine.diagnose(data)

    rec_engine = get_recommendation_engine()
    rec_res = rec_engine.recommend(data)

    anom_engine = get_anomaly_engine()
    anom_res = anom_engine.detect_anomalies(data)

    return {
        "project_name": name,
        "risk": risk_res,
        "health": health_res,
        "shap": shap_res,
        "root_cause": rc_res,
        "recommendation": rec_res,
        "anomaly": anom_res,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

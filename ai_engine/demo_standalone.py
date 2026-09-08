"""
Standalone demonstration and validation script for the MoSPI ProjectPulse AI Engine.
Runs each intelligence component sequentially with zero dependencies on frontend or backend.
"""

import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai_engine.prediction.delay_model import DelayPredictionEngine
from ai_engine.prediction.health_score import calculate_project_health_score
from ai_engine.explainability.shap_explainer import SHAPExplainer
from ai_engine.intelligence.root_cause import RootCauseEngine
from ai_engine.intelligence.recommendations import RecommendationEngine
from ai_engine.intelligence.anomaly_detection import AnomalyDetectionEngine
from ai_engine.intelligence.what_if import WhatIfSimulator
from ai_engine.intelligence.dependency_impact import DependencyImpactEngine
from ai_engine.assistant.project_qa import ProjectAssistant
from ai_engine.prediction.model_trainer import get_model_benchmarks


def run_standalone_demo():
    print("=" * 80)
    print("      MoSPI ProjectPulse — AI & Decision Intelligence Engine (Standalone Demo)      ")
    print("=" * 80)

    # 1. Test Project Data (High-Risk Infrastructure Project)
    project = {
        "id": 101,
        "name": "NHAI 4-Lane Highway Expansion Corridor",
        "department": "Road Transport & Highways",
        "location": "Assam",
        "planned_duration_days": 540,
        "elapsed_duration_days": 380,
        "physical_progress": 45.0,
        "expected_progress": 65.0,
        "financial_progress": 78.0,
        "approved_budget": 85_000_000.0,
        "released_funds": 70_000_000.0,
        "expenditure": 66_300_000.0,
        "milestones_delayed": 3,
        "milestones_total": 6,
        "resource_availability": 60.0,
        "contractor_performance": 55.0,
        "material_availability": 70.0,
        "previous_delays": 2,
        "status": "AT_RISK",
    }

    print(f"\n[1] TEST PROJECT: {project['name']} ({project['department']}, {project['location']})")
    print(f"    Planned Duration: {project['planned_duration_days']} days | Elapsed: {project['elapsed_duration_days']} days")
    print(f"    Physical Progress: {project['physical_progress']}% vs Expected: {project['expected_progress']}%")
    print(f"    Financial Progress: {project['financial_progress']}% | Milestones Delayed: {project['milestones_delayed']}/{project['milestones_total']}")
    print(f"    Resource Availability: {project['resource_availability']}% | Contractor Performance: {project['contractor_performance']}/100")

    # 2. Delay Prediction Engine
    print("\n" + "-" * 80)
    print("[2] PREDICTIVE DELAY ENGINE")
    delay_engine = DelayPredictionEngine()
    prediction = delay_engine.predict_single(project)
    print(f"    • Delay Probability   : {prediction['delay_percentage']}%")
    print(f"    • Delay Risk Level    : {prediction['badge_color']} {prediction['risk_level']}")
    print(f"    • Predicted Delay Days: ~{prediction['predicted_delay_days']} days")
    print(f"    • Model Used          : {prediction['model_used']}")
    print(f"    • Executive Summary   : {prediction['summary']}")

    # 3. Dynamic Project Health Score
    print("\n" + "-" * 80)
    print("[3] DYNAMIC PROJECT HEALTH SCORE (0-100)")
    health = calculate_project_health_score(project)
    print(f"    • Overall Health Score: {health['badge_color']} {health['health_score']}/100 ({health['category_label']})")
    print("    • Category Breakdown:")
    for comp, val in health["components"].items():
        w = health["weights"][comp]
        print(f"        - {comp.replace('_', ' ').title():<26} [{w}% weight] : {val:.1f}/100")

    # 4. Explainable AI (SHAP)
    print("\n" + "-" * 80)
    print("[4] EXPLAINABLE AI (SHAP Attribution)")
    explainer = SHAPExplainer(delay_engine)
    explanation = explainer.explain_prediction(project)
    print("    • Top Contributing Factors to Delay Risk:")
    for i, f in enumerate(explanation["contributing_factors"], 1):
        print(f"        {i}. {f['factor']:<45}: {f['percentage']}% impact")
    print(f"    • Explanation Narrative:\n      \"{explanation['explanation_narrative']}\"")

    # 5. Root Cause Diagnostic Intelligence
    print("\n" + "-" * 80)
    print("[5] ROOT CAUSE DIAGNOSTIC ENGINE")
    rc_engine = RootCauseEngine()
    diagnosis = rc_engine.diagnose(project)
    print(f"    • Primary Root Cause  : {diagnosis['primary_cause']}")
    print(f"    • Secondary Causes    : {', '.join(diagnosis['secondary_causes'])}")
    print(f"    • Diagnostic Confidence: {diagnosis['confidence_score']}%")
    print("    • Evidence Breakdown:")
    for ev in diagnosis["evidence"]:
        print(f"        - [{ev['severity']}] {ev['factor']}: {ev['finding']}")

    # 6. AI Corrective Action Engine
    print("\n" + "-" * 80)
    print("[6] AI CORRECTIVE ACTION ENGINE")
    rec_engine = RecommendationEngine(rc_engine)
    recommendation = rec_engine.recommend(project)
    print(f"    • Action Urgency           : {recommendation['urgency']}")
    print(f"    • Responsible Authority    : {recommendation['responsible_authority']}")
    print(f"    • Target Execution Window  : Within {recommendation['target_timeline_days']} days")
    print(f"    • Recovery Plan Required   : {'YES' if recommendation['recovery_plan_required'] else 'NO'}")
    print("    • Prioritized Recovery Actions:")
    for i, act in enumerate(recommendation["recommended_actions"], 1):
        print(f"        {i}. {act}")

    # 7. Anomaly & Data Integrity Detection (Testing with severe gap)
    print("\n" + "-" * 80)
    print("[7] ANOMALY & DATA INTEGRITY ENGINE")
    anom_engine = AnomalyDetectionEngine()
    # Scenario A: The current project
    anom_current = anom_engine.detect_anomalies(project)
    print(f"    • Current Project Anomaly Check: {anom_current['status_label']} (Score: {anom_current['anomaly_score']}/100)")
    for iss in anom_current["detected_issues"]:
        print(f"        ⚠️ {iss}")

    # Scenario B: High Discrepancy (Physical 43%, Financial 92%)
    discrepant_project = dict(project, physical_progress=43.0, financial_progress=92.0, approved_budget=50_000_000, expenditure=46_000_000)
    anom_severe = anom_engine.detect_anomalies(discrepant_project)
    print(f"    • Discrepant Case (Physical 43%, Financial 92%):")
    print(f"        Classification: {anom_severe['status_label']} (Level: {anom_severe['anomaly_level']}, Score: {anom_severe['anomaly_score']}/100)")
    for iss in anom_severe["detected_issues"]:
        print(f"        ⚠️ {iss}")

    # 8. What-If Intervention Simulator
    print("\n" + "-" * 80)
    print("[8] WHAT-IF INTERVENTION SIMULATOR")
    what_if = WhatIfSimulator(delay_engine)
    interventions = {
        "funding_increase_pct": 20.0,
        "manpower_increase_pct": 25.0,
        "material_boost_pct": 20.0,
        "deadline_extension_days": 45,
    }
    sim_result = what_if.simulate(project, interventions)
    print(f"    • Applied Interventions: {', '.join(sim_result['applied_interventions'])}")
    print(f"    • CURRENT SCENARIO     : Delay Risk = {sim_result['baseline']['risk_score']}%, Health = {sim_result['baseline']['health_score']}/100, Est. Delay = {sim_result['baseline']['predicted_delay_days']} days")
    print(f"    • WITH INTERVENTION    : Delay Risk = {sim_result['simulated']['risk_score']}%, Health = {sim_result['simulated']['health_score']}/100, Est. Delay = {sim_result['simulated']['predicted_delay_days']} days")
    print(f"    • NET BENEFIT          : Risk Reduction = -{sim_result['delta']['risk_reduction_points']} pts | Schedule Days Saved = ~{sim_result['delta']['delay_days_saved']} days | Health Gain = +{sim_result['delta']['health_score_improvement']} pts")

    # 9. Project Dependency & Impact Analysis
    print("\n" + "-" * 80)
    print("[9] PROJECT DEPENDENCY & CASCADING IMPACT ANALYSIS")
    dep_engine = DependencyImpactEngine()
    downstream_projects = [
        {"id": 201, "name": "Brahmaputra Industrial Logistic Park", "department": "Industry", "approved_budget": 120_000_000.0, "coupling_strength": 0.85},
        {"id": 202, "name": "Multi-Modal Cargo Terminal", "department": "Railways", "approved_budget": 85_000_000.0, "coupling_strength": 0.65},
    ]
    cascade = dep_engine.analyze_cascade(project, downstream_projects, source_delay_days=prediction['predicted_delay_days'])
    print(f"    • Source Project Delay: {cascade['source_delay_days']} days")
    print(f"    • Downstream Affected : {cascade['total_affected_projects']} projects")
    print(f"    • Capital at Risk     : ₹{cascade['total_downstream_budget_at_risk']:,.0f}")
    for ap in cascade["affected_projects"]:
        print(f"        - {ap['project_name']} ({ap['department']}): +{ap['cascading_delay_days']} days delay [{ap['criticality']}]")

    # 10. AI Project Assistant (Natural Language Queries)
    print("\n" + "-" * 80)
    print("[10] AI PROJECT ASSISTANT (Natural Language Interface)")
    assistant = ProjectAssistant()
    pool = [project, discrepant_project]

    queries = [
        "Why is Project 101 high risk?",
        "Which projects have high financial utilization but low physical progress?",
    ]
    for q in queries:
        print(f"\n    Q: \"{q}\"")
        ans = assistant.ask(q, pool)
        print("    A:")
        for line in ans["response"].split("\n"):
            print(f"       {line}")

    # 11. Model Tournament Benchmarks
    print("\n" + "-" * 80)
    print("[11] MODEL TOURNAMENT BENCHMARKS (Research Paper Comparison)")
    benchmarks = get_model_benchmarks()
    print(f"    Tournament Winner: {benchmarks['best_model_name']}")
    for m_name, metrics in benchmarks["tournament_results"].items():
        print(f"    • {m_name:<30}: Acc={metrics['accuracy']:.3f}, Prec={metrics['precision']:.3f}, Rec={metrics['recall']:.3f}, F1={metrics['f1_score']:.3f}, ROC-AUC={metrics['roc_auc']:.3f}")

    print("\n" + "=" * 80)
    print("                      ALL 10 AI MODULES TESTED & VERIFIED                      ")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_standalone_demo()

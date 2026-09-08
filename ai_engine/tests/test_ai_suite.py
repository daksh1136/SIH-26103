"""
Comprehensive Unit and Integration Test Suite for the MoSPI ProjectPulse AI Intelligence Layer.
"""

import os
import sys
import unittest

# Ensure repo root is on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai_engine.preprocessing.cleaner import clean_project_record
from ai_engine.preprocessing.feature_engineering import engineer_features_single, FEATURE_COLUMNS
from ai_engine.prediction.delay_model import DelayPredictionEngine
from ai_engine.prediction.health_score import calculate_project_health_score
from ai_engine.prediction.risk_score import get_risk_tier
from ai_engine.explainability.shap_explainer import SHAPExplainer
from ai_engine.intelligence.root_cause import RootCauseEngine
from ai_engine.intelligence.recommendations import RecommendationEngine
from ai_engine.intelligence.anomaly_detection import AnomalyDetectionEngine
from ai_engine.intelligence.what_if import WhatIfSimulator
from ai_engine.intelligence.dependency_impact import DependencyImpactEngine
from ai_engine.assistant.query_parser import parse_project_query
from ai_engine.assistant.project_qa import ProjectAssistant


class TestAISuite(unittest.TestCase):

    def setUp(self):
        self.delay_engine = DelayPredictionEngine()
        self.explainer = SHAPExplainer(self.delay_engine)
        self.root_cause_engine = RootCauseEngine()
        self.rec_engine = RecommendationEngine(self.root_cause_engine)
        self.anomaly_engine = AnomalyDetectionEngine()
        self.what_if = WhatIfSimulator(self.delay_engine)
        self.dependency_engine = DependencyImpactEngine()
        self.assistant = ProjectAssistant()

        # Sample high-risk project (matches the example in problem statement)
        self.high_risk_project = {
            "id": 101,
            "name": "NHAI Highway Expansion Corridor",
            "department": "Road Transport & Highways",
            "location": "Assam",
            "planned_duration_days": 540,
            "elapsed_duration_days": 380,
            "physical_progress": 45.0,
            "expected_progress": 65.0,
            "financial_progress": 78.0,
            "approved_budget": 85000000.0,
            "released_funds": 70000000.0,
            "expenditure": 66300000.0,
            "milestones_delayed": 3,
            "milestones_total": 6,
            "resource_availability": 60.0,
            "contractor_performance": 55.0,
            "material_availability": 70.0,
            "previous_delays": 2,
            "status": "AT_RISK",
        }

        # Sample healthy on-track project
        self.healthy_project = {
            "id": 102,
            "name": "District Solar Microgrid Project",
            "department": "Energy",
            "location": "Gujarat",
            "planned_duration_days": 365,
            "elapsed_duration_days": 180,
            "physical_progress": 55.0,
            "expected_progress": 50.0,
            "financial_progress": 52.0,
            "approved_budget": 40000000.0,
            "released_funds": 25000000.0,
            "expenditure": 20800000.0,
            "milestones_delayed": 0,
            "milestones_total": 5,
            "resource_availability": 85.0,
            "contractor_performance": 90.0,
            "material_availability": 88.0,
            "previous_delays": 0,
            "status": "ON_TRACK",
        }

    def test_preprocessing_and_feature_engineering(self):
        cleaned = clean_project_record(self.high_risk_project)
        self.assertEqual(cleaned["physical_progress"], 45.0)
        self.assertEqual(cleaned["milestones_delayed"], 3)

        features = engineer_features_single(cleaned)
        # Slippage = expected (65) - physical (45) = 20
        self.assertEqual(features["schedule_slippage_gap"], 20.0)
        # Financial gap = 78 - 45 = 33
        self.assertEqual(features["financial_physical_gap"], 33.0)
        # Check all features present
        for col in FEATURE_COLUMNS:
            self.assertIn(col, features)

    def test_delay_prediction(self):
        pred = self.delay_engine.predict_single(self.high_risk_project)
        self.assertGreaterEqual(pred["delay_probability"], 0.50)
        self.assertIn(pred["risk_level"], ["HIGH", "CRITICAL"])
        self.assertGreater(pred["predicted_delay_days"], 20)

        # Test healthy project
        pred_healthy = self.delay_engine.predict_single(self.healthy_project)
        self.assertLess(pred_healthy["delay_probability"], 0.35)
        self.assertIn(pred_healthy["risk_level"], ["LOW", "MODERATE"])

    def test_project_health_score(self):
        health = calculate_project_health_score(self.high_risk_project)
        score = health["health_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)
        # High risk project should have low or at-risk health score
        self.assertIn(health["health_category"], ["CRITICAL", "HIGH_RISK", "AT_RISK"])
        # Verify 6 component breakdowns exist
        comps = health["components"]
        self.assertIn("schedule_performance", comps)
        self.assertIn("physical_progress", comps)
        self.assertIn("financial_performance", comps)
        self.assertIn("milestone_performance", comps)
        self.assertIn("resource_health", comps)
        self.assertIn("contractor_health", comps)

    def test_shap_explainability(self):
        explanation = self.explainer.explain_prediction(self.high_risk_project)
        factors = explanation["contributing_factors"]
        self.assertTrue(len(factors) >= 3)
        # Verify sum of percentages is close to 100%
        total_pct = sum(f["percentage"] for f in factors)
        self.assertAlmostEqual(total_pct, 100.0, delta=2.5)
        # Check explanation narrative exists
        self.assertTrue(len(explanation["explanation_narrative"]) > 20)

    def test_root_cause_diagnosis(self):
        diagnosis = self.root_cause_engine.diagnose(self.high_risk_project)
        self.assertIn(
            diagnosis["primary_cause"],
            [
                "Contractor Resource Shortage",
                "Financial-Physical Progress Imbalance",
                "Cumulative Milestone Slippage",
                "Material Procurement Delay"
            ]
        )
        self.assertTrue(len(diagnosis["evidence"]) >= 1)
        self.assertGreater(diagnosis["confidence_score"], 60.0)

    def test_corrective_action_recommendation(self):
        rec = self.rec_engine.recommend(self.high_risk_project)
        self.assertIn(rec["urgency"], ["IMMEDIATE", "HIGH"])
        self.assertTrue(rec["recovery_plan_required"])
        self.assertTrue(len(rec["recommended_actions"]) >= 2)
        self.assertTrue(len(rec["responsible_authority"]) > 0)

    def test_anomaly_detection(self):
        # Progress 43% vs Financial 92% is a severe discrepancy
        anomaly_record = {
            "physical_progress": 43.0,
            "financial_progress": 92.0,
            "approved_budget": 50000000.0,
            "expenditure": 46000000.0,
            "milestones_delayed": 2,
        }
        res = self.anomaly_engine.detect_anomalies(anomaly_record)
        self.assertTrue(res["is_anomaly"])
        self.assertIn("Potential anomaly — verification required", res["status_label"])
        self.assertGreater(res["anomaly_score"], 35.0)

        # Normal project should not be flagged as severe anomaly
        norm_res = self.anomaly_engine.detect_anomalies(self.healthy_project)
        self.assertFalse(norm_res["is_anomaly"])

    def test_what_if_simulation(self):
        interventions = {
            "funding_increase_pct": 20.0,
            "manpower_increase_pct": 25.0,
            "deadline_extension_days": 45,
        }
        sim_res = self.what_if.simulate(self.high_risk_project, interventions)
        delta = sim_res["delta"]
        # Interventions should reduce risk and improve health
        self.assertGreaterEqual(delta["risk_reduction_points"], 0.0)
        self.assertGreaterEqual(delta["delay_days_saved"], 0)
        self.assertGreaterEqual(delta["health_score_improvement"], 0.0)

    def test_dependency_cascade(self):
        child_projects = [
            {"id": 201, "name": "Industrial Logistics Hub", "approved_budget": 120000000.0, "coupling_strength": 0.8},
            {"id": 202, "name": "Multi-Modal Freight Depot", "approved_budget": 60000000.0, "coupling_strength": 0.5},
        ]
        res = self.dependency_engine.analyze_cascade(self.high_risk_project, child_projects, source_delay_days=60)
        self.assertEqual(res["total_affected_projects"], 2)
        self.assertEqual(res["total_downstream_budget_at_risk"], 180000000.0)
        self.assertEqual(res["affected_projects"][0]["cascading_delay_days"], 48)

    def test_ai_assistant_query_parser_and_qa(self):
        # 1. Parse intent
        q1 = "Why is Project 101 high risk?"
        p1 = parse_project_query(q1)
        self.assertEqual(p1["project_id"], 101)
        self.assertEqual(p1["intent"], "PROJECT_EXPLANATION")

        q2 = "Which projects are high risk in Assam?"
        p2 = parse_project_query(q2)
        self.assertEqual(p2["location"], "Assam")
        self.assertEqual(p2["risk_level"], "HIGH")

        # 2. Assistant answering
        pool = [self.high_risk_project, self.healthy_project]
        ans = self.assistant.ask("Why is Project 101 high risk?", pool)
        self.assertEqual(ans["query_type"], "SINGLE_PROJECT_INTELLIGENCE")
        self.assertIn("NHAI Highway Expansion Corridor", ans["response"])
        self.assertIn("Contributing Factors", ans["response"])

        ans_filter = self.assistant.ask("Which projects are high risk in Assam?", pool)
        self.assertIn("Found", ans_filter["response"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

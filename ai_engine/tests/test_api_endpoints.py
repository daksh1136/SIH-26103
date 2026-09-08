"""
FastAPI Endpoints Standalone Test.
Uses Starlette/FastAPI TestClient to verify all REST endpoints in ai_engine.api.server.
"""

import os
import sys
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from fastapi.testclient import TestClient
from ai_engine.api.server import app


class TestAIAPIEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.sample_project = {
            "id": 1,
            "name": "National Highway Demo",
            "department": "Infrastructure",
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

    def test_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_model_benchmarks_endpoint(self):
        res = self.client.get("/model-benchmarks")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("tournament_results", data)
        self.assertIn("best_model_name", data)

    def test_predict_risk_endpoint(self):
        res = self.client.post("/predict-risk", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("delay_probability", data)
        self.assertIn("risk_score", data)
        self.assertIn("risk_level", data)
        self.assertIn("shap_explanation", data)

    def test_project_health_endpoint(self):
        res = self.client.post("/project-health", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("health_score", data)
        self.assertIn("health_category", data)
        self.assertIn("components", data)
        self.assertEqual(len(data["components"]), 6)

    def test_detect_anomaly_endpoint(self):
        res = self.client.post("/detect-anomaly", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("is_anomaly", data)
        self.assertIn("anomaly_score", data)
        self.assertIn("status_label", data)

    def test_root_cause_endpoint(self):
        res = self.client.post("/root-cause", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("primary_cause", data)
        self.assertIn("secondary_causes", data)
        self.assertIn("confidence_score", data)

    def test_recommend_action_endpoint(self):
        res = self.client.post("/recommend-action", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("recommended_actions", data)
        self.assertIn("responsible_authority", data)

    def test_what_if_endpoint(self):
        payload = {
            "project": self.sample_project,
            "funding_increase_pct": 20.0,
            "manpower_increase_pct": 25.0,
            "deadline_extension_days": 30,
        }
        res = self.client.post("/what-if", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("baseline", data)
        self.assertIn("simulated", data)
        self.assertIn("delta", data)

    def test_ask_project_endpoint(self):
        payload = {
            "query": "Why is Project 1 high risk?",
            "projects_pool": [self.sample_project],
        }
        res = self.client.post("/ask-project", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("response", data)
        self.assertEqual(data["query_type"], "SINGLE_PROJECT_INTELLIGENCE")

    def test_batch_analyze_endpoint(self):
        res = self.client.post("/batch-analyze", json=self.sample_project)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("risk", data)
        self.assertIn("health", data)
        self.assertIn("shap", data)
        self.assertIn("root_cause", data)
        self.assertIn("recommendation", data)
        self.assertIn("anomaly", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)

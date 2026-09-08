"""
Unit tests for AI Project Doom & Turnaround Salvage Recommendation Engine.
"""

import os
import sys
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai_engine.intelligence.salvage_engine import SalvageEngine


class TestSalvageEngine(unittest.TestCase):

    def setUp(self):
        self.engine = SalvageEngine()

        # Project 1: High Distress / Doomed Project (e.g. Project #8/10: 92% funds spent, 32% built, 4/5 delayed)
        self.doomed_project = {
            "id": 8,
            "name": "Delhi-Mumbai Dedicated Freight Corridor Ph-II",
            "department": "Railways",
            "physical_progress": 32.0,
            "expected_progress": 85.0,
            "financial_progress": 92.0,
            "approved_budget": 520000000.0,
            "expenditure": 478400000.0,
            "milestones_delayed": 4.0,
            "milestones_total": 5.0,
            "resource_availability": 35.0,
            "contractor_performance": 30.0,
            "material_availability": 40.0,
            "previous_delays": 3.0,
        }

        # Project 2: Pristine Healthy Project (e.g. Project #1: 75% built, 70% funds spent, 0 delays)
        self.healthy_project = {
            "id": 1,
            "name": "Express Highway Section 4",
            "department": "Road Transport",
            "physical_progress": 78.0,
            "expected_progress": 75.0,
            "financial_progress": 72.0,
            "approved_budget": 300000000.0,
            "expenditure": 216000000.0,
            "milestones_delayed": 0.0,
            "milestones_total": 6.0,
            "resource_availability": 95.0,
            "contractor_performance": 92.0,
            "material_availability": 90.0,
            "previous_delays": 0.0,
        }

        # Project 3: Moderate Strain Project
        self.moderate_project = {
            "id": 3,
            "name": "Urban Metro Green Line Ext",
            "department": "Urban Affairs",
            "physical_progress": 55.0,
            "expected_progress": 68.0,
            "financial_progress": 62.0,
            "approved_budget": 400000000.0,
            "expenditure": 248000000.0,
            "milestones_delayed": 1.0,
            "milestones_total": 6.0,
            "resource_availability": 75.0,
            "contractor_performance": 72.0,
            "material_availability": 70.0,
            "previous_delays": 1.0,
        }

    def test_doomed_project_diagnosis(self):
        """Doomed project must be classified as CRITICAL_DOOM with high doom probability."""
        result = self.engine.evaluate_project_salvage(self.doomed_project)

        self.assertTrue(result["is_doomed"])
        self.assertGreaterEqual(result["doom_probability_pct"], 65.0)
        self.assertEqual(result["doom_level"], "CRITICAL_DOOM")
        self.assertIn("Runaway Capital Burnout", result["primary_failure_mode"])

        # Check blueprint structure
        blueprint = result["salvage_blueprint"]
        self.assertEqual(len(blueprint), 3)
        self.assertEqual(blueprint[0]["phase"], "Phase 1: Emergency Stabilization")
        self.assertEqual(blueprint[1]["phase"], "Phase 2: Schedule & Resource Crashing")
        self.assertEqual(blueprint[2]["phase"], "Phase 3: Structural Re-alignment & Governance")

        # Check impact simulation
        sim = result["impact_simulation"]
        self.assertGreater(sim["baseline_delay_days"], 50)
        self.assertGreater(sim["days_saved"], 0)
        self.assertLess(sim["salvaged_delay_days"], sim["baseline_delay_days"])
        self.assertGreater(sim["salvaged_health_score"], sim["baseline_health_score"])
        self.assertGreaterEqual(sim["salvage_success_probability"], 80)

    def test_healthy_project_diagnosis(self):
        """Pristine project must be classified as STABLE_HEALTHY with low doom probability."""
        result = self.engine.evaluate_project_salvage(self.healthy_project)

        self.assertFalse(result["is_doomed"])
        self.assertLess(result["doom_probability_pct"], 25.0)
        self.assertEqual(result["doom_level"], "STABLE_HEALTHY")

    def test_moderate_strain_diagnosis(self):
        """Moderate project must not trigger catastrophic doom."""
        result = self.engine.evaluate_project_salvage(self.moderate_project)
        self.assertFalse(result["is_doomed"])
        self.assertLess(result["doom_probability_pct"], 65.0)

    def test_safety_domain_override(self):
        """Severe capital divergence (90% burn, 30% progress) must always flag high doom probability."""
        divergent_project = {
            "physical_progress": 30.0,
            "expected_progress": 60.0,
            "financial_progress": 90.0,
            "approved_budget": 100000000.0,
            "expenditure": 90000000.0,
            "milestones_delayed": 2.0,
            "milestones_total": 4.0,
            "resource_availability": 60.0,
            "contractor_performance": 60.0,
            "material_availability": 60.0,
            "previous_delays": 1.0,
        }
        result = self.engine.evaluate_project_salvage(divergent_project)
        self.assertTrue(result["is_doomed"])
        self.assertGreaterEqual(result["doom_probability_pct"], 80.0)


if __name__ == "__main__":
    unittest.main()

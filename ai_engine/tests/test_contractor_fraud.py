"""
Unit tests for Contractor Fraud & Tender Eligibility Assessment Engine.
"""

import os
import sys
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai_engine.intelligence.contractor_fraud_engine import ContractorFraudEngine


class TestContractorFraudEngine(unittest.TestCase):

    def setUp(self):
        self.engine = ContractorFraudEngine()

        # Archetype 1: Pristine Tier-1 Contractor
        self.pristine_contractor = {
            "id": 1,
            "name": "Larsen & Mega Infrastructure Ltd",
            "category": "Tier-1",
            "shell_risk_score": 3.2,
            "ghost_billing_flags": 0,
            "litigation_count": 0,
            "tax_compliance_status": "FULLY_COMPLIANT",
            "status": "APPROVED",
            "max_project_budget_handled": 500000000.0,  # 50 Cr
            "avg_cost_overrun_pct": 2.5,
            "avg_delay_days": 15.0,
            "on_time_delivery_rate": 0.95,
            "solvency_score": 92.0,
        }

        # Archetype 2: Fraudulent / Ghost-Billing Contractor
        self.fraudulent_contractor = {
            "id": 8,
            "name": "Apex Shell Engineering Consortium",
            "category": "Tier-3",
            "shell_risk_score": 88.5,
            "ghost_billing_flags": 4,
            "litigation_count": 5,
            "tax_compliance_status": "DEFAULT_SUSPENDED",
            "status": "DISQUALIFIED",
            "max_project_budget_handled": 20000000.0,  # 2 Cr
            "avg_cost_overrun_pct": 48.0,
            "avg_delay_days": 210.0,
            "on_time_delivery_rate": 0.20,
            "solvency_score": 25.0,
        }

        # Archetype 3: Capacity Over-extended Contractor
        self.small_contractor = {
            "id": 6,
            "name": "Hillside Constructions & Earthmovers",
            "category": "Tier-3",
            "shell_risk_score": 22.0,
            "ghost_billing_flags": 0,
            "litigation_count": 1,
            "tax_compliance_status": "COMPLIANT",
            "status": "APPROVED",
            "max_project_budget_handled": 15000000.0,  # 1.5 Cr
            "avg_cost_overrun_pct": 12.0,
            "avg_delay_days": 45.0,
            "on_time_delivery_rate": 0.75,
            "solvency_score": 68.0,
        }

        self.normal_project = {
            "name": "National Highway Corridor",
            "approved_budget": 45000000.0,  # 4.5 Cr
        }

        self.mega_project = {
            "name": "High-Speed Rail Link Package",
            "approved_budget": 200000000.0,  # 20 Cr
        }

    def test_pristine_contractor_approval(self):
        res = self.engine.evaluate_contractor(self.pristine_contractor, self.normal_project)
        self.assertEqual(res["verdict"], "APPROVED")
        self.assertTrue(res["is_recommended"])
        self.assertGreaterEqual(res["eligibility_score"], 80.0)
        self.assertLess(res["fraud_risk_score"], 15.0)
        print("✓ Pristine contractor correctly approved with high eligibility score.")

    def test_fraudulent_contractor_disqualification(self):
        res = self.engine.evaluate_contractor(self.fraudulent_contractor, self.normal_project)
        self.assertEqual(res["verdict"], "DISQUALIFIED")
        self.assertFalse(res["is_recommended"])
        self.assertLess(res["eligibility_score"], 55.0)
        self.assertGreater(res["fraud_risk_score"], 40.0)
        self.assertTrue(any("Ghost-Billing" in d["factor"] for d in res["risk_drivers"]))
        print("✓ Fraudulent contractor correctly disqualified with ghost-billing red flags.")

    def test_capacity_overextension_detection(self):
        # Small contractor bidding on mega project 13x their max historical job
        res = self.engine.evaluate_contractor(self.small_contractor, self.mega_project)
        self.assertIn(res["verdict"], ["CONDITIONAL", "DISQUALIFIED"])
        self.assertGreater(res["budget_scale_ratio"], 2.0)
        self.assertTrue(any("Capacity Over-Extension" in d["factor"] for d in res["risk_drivers"]))
        print("✓ Capacity over-extension correctly flagged.")

    def test_retrain_model(self):
        meta = self.engine.retrain()
        self.assertIn("accuracy", meta)
        self.assertGreater(meta["accuracy"], 0.90)
        print(f"✓ Model re-training completed with {meta['accuracy']*100:.2f}% accuracy.")


if __name__ == "__main__":
    unittest.main()

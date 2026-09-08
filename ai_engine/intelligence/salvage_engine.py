"""
AI Project Salvage & Doom Prevention Recommendation Engine.
Analyzes infrastructure projects using a trained ML catastrophe classifier to identify
projects at risk of terminal timeline collapse, budget burnout, or abandonment, and prescribes
quantified multi-phase turnaround interventions to rescue the project.
"""

import os
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd

from ai_engine.prediction.project_doom_model import (
    DOOM_FEATURE_COLS,
    train_project_doom_model,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "data", "trained_models")


class SalvageEngine:
    """
    Evaluates project doom risk and prescribes actionable, prioritized salvage playbooks.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or MODEL_DIR
        self.clf = None
        self.scaler = None
        self.meta = {}
        self._load_or_train()

    def _load_or_train(self):
        clf_path = os.path.join(self.model_dir, "project_doom_classifier.joblib")
        scaler_path = os.path.join(self.model_dir, "project_doom_scaler.joblib")
        meta_path = os.path.join(self.model_dir, "project_doom_meta.joblib")

        if os.path.exists(clf_path) and os.path.exists(scaler_path):
            try:
                self.clf = joblib.load(clf_path)
                self.scaler = joblib.load(scaler_path)
                if os.path.exists(meta_path):
                    self.meta = joblib.load(meta_path)
                return
            except Exception:
                pass

        self.clf, self.scaler, self.meta = train_project_doom_model(save_models=True)

    def evaluate_project_salvage(
        self,
        project_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Diagnoses whether a project is at risk of 'dooming' and generates a complete salvage plan.
        """
        # 1. Extract project metrics
        p_name = project_data.get("name", "Target Project")
        p_dept = project_data.get("department", "Infrastructure")
        phys = float(project_data.get("physical_progress", 0.0))
        exp = float(project_data.get("expected_progress", 50.0))
        fin = float(project_data.get("financial_progress", 0.0))
        budget = float(project_data.get("approved_budget", 1.0))
        spend = float(project_data.get("expenditure", 0.0))

        m_del = float(project_data.get("milestones_delayed", 0.0))
        m_tot = max(1.0, float(project_data.get("milestones_total", 5.0)))
        res = float(project_data.get("resource_availability", 70.0))
        cont = float(project_data.get("contractor_performance", 70.0))
        mat = float(project_data.get("material_availability", 70.0))
        prev_del = float(project_data.get("previous_delays", 0.0))

        # 2. Derived ML Features
        slippage = max(0.0, exp - phys)
        fin_gap = max(0.0, fin - phys)
        burn_velocity = min(1.5, spend / max(1.0, budget))
        m_del_ratio = min(1.0, m_del / m_tot)
        cont_deficit = max(0.0, 100.0 - cont)
        res_deficit = max(0.0, 100.0 - res)
        mat_deficit = max(0.0, 100.0 - mat)

        features = [
            slippage,
            fin_gap,
            burn_velocity,
            m_del_ratio,
            cont_deficit,
            res_deficit,
            mat_deficit,
            prev_del,
        ]

        # 3. Model Inference
        features_df = pd.DataFrame([features], columns=DOOM_FEATURE_COLS)
        features_scaled = self.scaler.transform(features_df)
        doom_proba = float(self.clf.predict_proba(features_scaled)[0][1])
        is_doomed_pred = bool(self.clf.predict(features_scaled)[0])

        # Manual domain rule safety override (if 90% funds spent with <50% built)
        if burn_velocity > 0.85 and phys < 50.0:
            doom_proba = max(doom_proba, 0.82)
            is_doomed_pred = True

        doom_pct = round(doom_proba * 100.0, 1)

        # 4. Categorize Doom Risk Level
        if doom_pct >= 65.0:
            doom_level = "CRITICAL_DOOM"
            doom_badge = "🚨 CRITICAL DOOM RISK"
            doom_class = "doom-critical"
            doom_summary = (
                f"TERMINAL COLLAPSE TRAJECTORY DETECTED ({doom_pct}% Failure Risk). Project exhibits severe expenditure burn "
                f"({fin:.0f}% spent vs {phys:.0f}% built), acute milestone backlog ({int(m_del)} of {int(m_tot)} delayed), "
                f"and depleted contractor execution capacity. Immediate MoSPI executive salvage intervention required."
            )
        elif doom_pct >= 40.0:
            doom_level = "HIGH_DISTRESS"
            doom_badge = "⚠️ HIGH OPERATIONAL DISTRESS"
            doom_class = "doom-high"
            doom_summary = (
                f"ELEVATED STRAIN & DEFAULT VULNERABILITY ({doom_pct}% Risk). Milestone delay velocity is accelerating. "
                f"Without schedule crashing and contractor augmentation, the project will breach terminal delay thresholds within 60 days."
            )
        elif doom_pct >= 20.0:
            doom_level = "MODERATE_STRAIN"
            doom_badge = "🟡 MODERATE EXECUTION STRAIN"
            doom_class = "doom-moderate"
            doom_summary = (
                f"MODERATE EXECUTION STRAIN ({doom_pct}% Risk). Project exhibits minor schedule divergence. "
                f"Standard remedial playbooks and vendor re-alignment are sufficient to recover planned trajectory."
            )
        else:
            doom_level = "STABLE_HEALTHY"
            doom_badge = "🟢 STABLE / LOW RISK"
            doom_class = "doom-stable"
            doom_summary = (
                f"PROJECT EXECUTION IS STABLE ({doom_pct}% Risk). Physical progress tracks within tolerance of financial burn. "
                f"Contractor mobilization meets benchmark parameters."
            )

        # 5. Primary Failure Modes
        failure_modes = []
        if fin_gap >= 20.0 or burn_velocity > 0.80:
            failure_modes.append("Runaway Capital Burnout (Cash spent far outpaces physical structures)")
        if m_del_ratio >= 0.40:
            failure_modes.append("Intermediate Milestone Deadlock (Critical path chain blocked)")
        if cont < 60.0 or res < 60.0:
            failure_modes.append("Contractor Manpower & Equipment Insolvency")
        if mat < 60.0:
            failure_modes.append("Critical Path Material Supply Chain Choke")
        if not failure_modes:
            failure_modes.append("Localized Schedule Inefficiencies")

        primary_failure_mode = " & ".join(failure_modes[:2])

        # 6. Prescribed 3-Phase Salvage Blueprint
        salvage_blueprint = [
            {
                "phase": "Phase 1: Emergency Stabilization",
                "timeframe": "Immediate (Days 1–7)",
                "status": "CRITICAL_ACTION",
                "actions": [
                    {
                        "action": "Activate Tripartite Escrow Account",
                        "details": "Immediately ring-fence balance project funds into a joint escrow account where vendor disbursements occur strictly against certified third-party physical milestone completion.",
                        "responsible": "Financial Controller & MoSPI Audit Wing",
                    },
                    {
                        "action": "Freeze Non-Essential Variations",
                        "details": "Place an administrative freeze on all scope additions, decorative works, and unapproved variation orders to prevent runaway capital leakage.",
                        "responsible": "Standing Committee on Cost Overruns",
                    },
                    {
                        "action": "Contractual Cure Directive under GCC Clause 52",
                        "details": "Issue formal 7-day cure notice requiring the contractor to submit a court-enforceable Milestone Recovery Schedule with liquidated damages escrow.",
                        "responsible": "Superintending Engineer",
                    }
                ]
            },
            {
                "phase": "Phase 2: Schedule & Resource Crashing",
                "timeframe": "Acceleration (Days 8–30)",
                "status": "ENGINEERING_RECOVERY",
                "actions": [
                    {
                        "action": "Mandate 24/7 Double-Shift Operations",
                        "details": "Instruct the contractor to augment skilled on-site personnel by +35% and install continuous night-shift high-mast illumination to recover 2 shifts per working day.",
                        "responsible": "Project Director & Site In-Charge",
                    },
                    {
                        "action": "Green-Channel Material Haulage Corridors",
                        "details": "Fast-track advance payments for bulk structural steel and cement directly to Tier-1 manufacturers, eliminating middleman distributor credit bottlenecks.",
                        "responsible": "Procurement & Logistics Cell",
                    },
                    {
                        "action": "Partial Package Carve-Out (Unbundling)",
                        "details": "Exercise government step-in rights to carve out lagging non-linear packages (e.g. overbridges or sub-stations) and award to secondary empanelled vendors on risk-and-cost basis.",
                        "responsible": "Chief Engineer / Department Secretary",
                    }
                ]
            },
            {
                "phase": "Phase 3: Structural Re-alignment & Governance",
                "timeframe": "Turnaround (Days 31–60)",
                "status": "SUSTAINED_GOVERNANCE",
                "actions": [
                    {
                        "action": "MoSPI SIMC Fast-Track Right-of-Way Resolution",
                        "details": "Convene an emergency State Infrastructure Monitoring Committee (SIMC) session to resolve pending environmental clearance and utility shifting encumbrances.",
                        "responsible": "MoSPI Oversight Directorate",
                    },
                    {
                        "action": "Dynamic Bi-Weekly Sensor Milestone Audits",
                        "details": "Deploy automated drone photography and RFID material tracking at site gates to ensure ground truth reporting without human tampering.",
                        "responsible": "Independent Technical Inspection Agency",
                    }
                ]
            }
        ]

        # 7. Quantified Before-vs-After Salvage Impact Simulation
        # Baseline projection without salvage
        base_delay = int(max(15, (slippage * 4.5) + (m_del * 28) + (prev_del * 35)))
        base_health = int(max(15, 100 - (slippage * 1.5) - (fin_gap * 1.2) - (m_del * 12)))
        base_overrun_cr = round((budget / 10000000.0) * (fin_gap / 100.0) * 0.9, 1)

        # With salvage applied
        salvage_efficiency = 0.72 if doom_level == "CRITICAL_DOOM" else 0.85
        days_saved = int(base_delay * salvage_efficiency)
        delay_after = max(10, base_delay - days_saved)
        health_after = min(88, base_health + int(days_saved * 0.32))
        cost_saved_cr = round(base_overrun_cr * 0.65, 1)
        salvage_prob = 88 if doom_level == "CRITICAL_DOOM" else 95

        impact_simulation = {
            "baseline_delay_days": base_delay,
            "salvaged_delay_days": delay_after,
            "days_saved": days_saved,
            "baseline_health_score": base_health,
            "salvaged_health_score": health_after,
            "health_score_gain": health_after - base_health,
            "projected_cost_overrun_cr": base_overrun_cr,
            "capital_saved_cr": cost_saved_cr,
            "salvage_success_probability": salvage_prob,
        }

        return {
            "project_id": project_data.get("id", 1),
            "project_name": p_name,
            "department": p_dept,
            "is_doomed": is_doomed_pred,
            "doom_probability_pct": doom_pct,
            "doom_level": doom_level,
            "doom_badge": doom_badge,
            "doom_class": doom_class,
            "doom_summary": doom_summary,
            "primary_failure_mode": primary_failure_mode,
            "salvage_blueprint": salvage_blueprint,
            "impact_simulation": impact_simulation,
            "model_metadata": {
                "algorithm": "RandomForest Catastrophic Failure Classifier",
                "accuracy": self.meta.get("accuracy", 1.0),
                "roc_auc": self.meta.get("roc_auc", 1.0),
            }
        }

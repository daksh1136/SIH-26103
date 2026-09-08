"""
What-If Intervention Simulation Engine.
Enables decision makers to simulate the counterfactual impact of policy interventions
(e.g. +20% funding, +25% workforce, deadline extension) on delay risk and project health.
"""

from copy import deepcopy
from datetime import date, timedelta
from typing import Any, Dict, Optional

from ai_engine.prediction.delay_model import DelayPredictionEngine, get_delay_engine
from ai_engine.prediction.health_score import calculate_project_health_score


class WhatIfSimulator:
    """
    Simulates counterfactual project outcomes under varied management interventions.
    """

    def __init__(self, delay_engine: Optional[DelayPredictionEngine] = None):
        self.delay_engine = delay_engine or get_delay_engine()

    def simulate(
        self,
        project_data: Dict[str, Any],
        interventions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs counterfactual comparison between baseline and simulated intervention.
        Intervention parameters:
            - funding_increase_pct: float (e.g. 20.0 for +20% budget release)
            - manpower_increase_pct: float (e.g. 25.0 for +25% workforce)
            - material_boost_pct: float (e.g. 20.0 for +20% material supply)
            - contractor_support_pct: float (e.g. 15.0 for supervision support)
            - deadline_extension_days: int (e.g. 60 days extension)
        """
        # 1. Baseline Evaluation
        base_pred = self.delay_engine.predict_single(project_data)
        base_health = calculate_project_health_score(project_data)

        # 2. Construct Counterfactual State
        sim_data = deepcopy(project_data)

        # Interventions
        funding_inc = float(interventions.get("funding_increase_pct") or 0.0)
        manpower_inc = float(interventions.get("manpower_increase_pct") or 0.0)
        material_inc = float(interventions.get("material_boost_pct") or 0.0)
        contractor_inc = float(interventions.get("contractor_support_pct") or 0.0)
        ext_days = int(interventions.get("deadline_extension_days") or 0)

        # Apply resource boosts
        if manpower_inc > 0:
            cur_res = float(sim_data.get("resource_availability") or 70.0)
            sim_data["resource_availability"] = min(100.0, cur_res * (1.0 + manpower_inc / 100.0))

        if material_inc > 0:
            cur_mat = float(sim_data.get("material_availability") or 70.0)
            sim_data["material_availability"] = min(100.0, cur_mat * (1.0 + material_inc / 100.0))

        if contractor_inc > 0:
            cur_cont = float(sim_data.get("contractor_performance") or 65.0)
            sim_data["contractor_performance"] = min(100.0, cur_cont * (1.0 + contractor_inc / 100.0))

        # Apply funding boost
        if funding_inc > 0:
            cur_rel = float(sim_data.get("released_funds") or 0.0)
            cur_bud = float(sim_data.get("approved_budget") or 1.0)
            sim_data["released_funds"] = min(cur_bud, cur_rel * (1.0 + funding_inc / 100.0))

        # Adjust duration for deadline extension
        if ext_days > 0:
            p_dur = float(sim_data.get("planned_duration_days") or 365.0)
            extension_ratio = p_dur / (p_dur + ext_days)
            sim_data["planned_duration_days"] = p_dur + ext_days

            # Recalculate expected progress relief granted by extension
            cur_exp = float(sim_data.get("expected_progress") or 50.0)
            sim_data["expected_progress"] = round(max(0.0, cur_exp * extension_ratio), 1)

        # Expected physical acceleration from resource + material + contractor boosts
        total_resource_boost = (manpower_inc * 0.4 + material_inc * 0.4 + contractor_inc * 0.2) / 100.0
        if total_resource_boost > 0:
            cur_phys = float(sim_data.get("physical_progress") or 0.0)
            sim_data["physical_progress"] = min(100.0, cur_phys * (1.0 + total_resource_boost * 0.35))
            # Delayed milestones can be partially recovered
            cur_delayed_m = int(sim_data.get("milestones_delayed") or 0)
            if cur_delayed_m > 0 and total_resource_boost >= 0.20:
                sim_data["milestones_delayed"] = max(0, cur_delayed_m - 1)

        # 3. Post-Intervention Evaluation
        sim_pred = self.delay_engine.predict_single(sim_data)
        sim_health = calculate_project_health_score(sim_data)

        # 4. Deltas
        risk_reduction = round(base_pred["risk_score"] - sim_pred["risk_score"], 1)
        delay_days_saved = max(0, base_pred["predicted_delay_days"] - sim_pred["predicted_delay_days"])
        health_improvement = round(sim_health["health_score"] - base_health["health_score"], 1)

        # Calculate estimated completion dates
        today = date.today()
        base_completion_date = today + timedelta(days=base_pred["predicted_delay_days"])
        sim_completion_date = today + timedelta(days=sim_pred["predicted_delay_days"])

        is_effective = risk_reduction >= 10.0 or delay_days_saved >= 15 or health_improvement >= 8.0

        applied_interventions_list = []
        if funding_inc > 0:
            applied_interventions_list.append(f"Funding Release: +{funding_inc:.0f}%")
        if manpower_inc > 0:
            applied_interventions_list.append(f"Manpower Augmentation: +{manpower_inc:.0f}%")
        if material_inc > 0:
            applied_interventions_list.append(f"Material Supply Boost: +{material_inc:.0f}%")
        if ext_days > 0:
            applied_interventions_list.append(f"Schedule Extension: +{ext_days} days")

        summary = (
            f"Intervention Simulation ({', '.join(applied_interventions_list) if applied_interventions_list else 'No change'}): "
            f"Reduces delay risk from {base_pred['risk_score']}% to {sim_pred['risk_score']}% "
            f"(-{risk_reduction} pts), saving ~{delay_days_saved} calendar days. "
            f"Project Health Score shifts from {base_health['health_score']}/100 to {sim_health['health_score']}/100."
        )

        return {
            "is_effective": is_effective,
            "applied_interventions": applied_interventions_list,
            "baseline": {
                "risk_score": base_pred["risk_score"],
                "risk_level": base_pred["risk_level"],
                "delay_probability": base_pred["delay_probability"],
                "predicted_delay_days": base_pred["predicted_delay_days"],
                "health_score": base_health["health_score"],
                "health_category": base_health["health_category"],
                "estimated_delay_completion": base_completion_date.isoformat(),
            },
            "simulated": {
                "risk_score": sim_pred["risk_score"],
                "risk_level": sim_pred["risk_level"],
                "delay_probability": sim_pred["delay_probability"],
                "predicted_delay_days": sim_pred["predicted_delay_days"],
                "health_score": sim_health["health_score"],
                "health_category": sim_health["health_category"],
                "estimated_delay_completion": sim_completion_date.isoformat(),
            },
            "delta": {
                "risk_reduction_points": risk_reduction,
                "delay_days_saved": delay_days_saved,
                "health_score_improvement": health_improvement,
            },
            "simulation_summary": summary,
        }


# Global singleton
_what_if_simulator: Optional[WhatIfSimulator] = None


def get_what_if_simulator() -> WhatIfSimulator:
    global _what_if_simulator
    if _what_if_simulator is None:
        _what_if_simulator = WhatIfSimulator()
    return _what_if_simulator

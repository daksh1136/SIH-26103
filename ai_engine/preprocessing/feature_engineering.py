"""
Feature engineering module for infrastructure delay risk modeling.
Calculates key schedule, financial, resource, and milestone variance features.
"""

from typing import Any, Dict, List
import numpy as np
import pandas as pd

# Core numeric feature names used for ML model training and inference
NUMERIC_FEATURES: List[str] = [
    "planned_duration_days",
    "elapsed_duration_days",
    "physical_progress",
    "expected_progress",
    "financial_progress",
    "approved_budget",
    "expenditure",
    "milestones_delayed",
    "milestones_total",
    "resource_availability",
    "contractor_performance",
    "material_availability",
    "previous_delays",
    "schedule_slippage_gap",
    "financial_physical_gap",
    "budget_utilization_pct",
    "time_elapsed_ratio",
    "milestone_slippage_rate",
    "composite_resource_index",
    "burn_rate_vs_progress_ratio",
]

FEATURE_COLUMNS = list(NUMERIC_FEATURES)

# Human-readable labels for explainable AI outputs
FEATURE_DISPLAY_NAMES: Dict[str, str] = {
    "schedule_slippage_gap": "Physical progress below expected schedule",
    "milestone_slippage_rate": "Milestone slippage ratio",
    "milestones_delayed": "Delayed milestone count",
    "financial_physical_gap": "Financial vs physical progress imbalance",
    "resource_availability": "Resource and manpower shortages",
    "material_availability": "Material procurement bottleneck",
    "contractor_performance": "Contractor performance index",
    "composite_resource_index": "Composite resource readiness",
    "budget_utilization_pct": "High budget consumption rate",
    "time_elapsed_ratio": "Project timeline elapsed fraction",
    "previous_delays": "Historical delay occurrences",
    "physical_progress": "Low physical progress completed",
    "financial_progress": "Financial progress level",
    "burn_rate_vs_progress_ratio": "Financial burn rate relative to progress",
    "planned_duration_days": "Scale of planned project duration",
    "elapsed_duration_days": "Elapsed project duration",
    "approved_budget": "Total approved project budget",
    "expenditure": "Cumulative project expenditure",
    "expected_progress": "Target expected progress level",
    "milestones_total": "Total tracked milestones",
}


def engineer_features_single(cleaned_record: Dict[str, Any]) -> Dict[str, float]:
    """
    Computes engineered features from a single cleaned project record.
    Returns a dictionary of all numeric feature values.
    """
    p_dur = float(cleaned_record.get("planned_duration_days", 365.0))
    e_dur = float(cleaned_record.get("elapsed_duration_days", 0.0))
    phys = float(cleaned_record.get("physical_progress", 0.0))
    exp = float(cleaned_record.get("expected_progress", 0.0))
    fin = float(cleaned_record.get("financial_progress", 0.0))
    budget = float(cleaned_record.get("approved_budget", 0.0))
    spend = float(cleaned_record.get("expenditure", 0.0))
    m_del = float(cleaned_record.get("milestones_delayed", 0.0))
    m_tot = max(float(cleaned_record.get("milestones_total", 1.0)), 1.0)
    res = float(cleaned_record.get("resource_availability", 75.0))
    cont = float(cleaned_record.get("contractor_performance", 70.0))
    mat = float(cleaned_record.get("material_availability", 75.0))
    prev_d = float(cleaned_record.get("previous_delays", 0.0))

    # Engineered metrics
    schedule_slippage_gap = round(exp - phys, 2)
    financial_physical_gap = round(fin - phys, 2)
    budget_utilization_pct = round((spend / (budget + 1e-5)) * 100.0, 2) if budget > 0 else 0.0
    time_elapsed_ratio = round(e_dur / (p_dur + 1e-5), 3)
    milestone_slippage_rate = round(m_del / m_tot, 3)
    composite_resource_index = round(0.35 * res + 0.35 * mat + 0.30 * cont, 2)
    burn_rate_vs_progress_ratio = round(fin / (phys + 1.0), 2)

    features: Dict[str, float] = {
        "planned_duration_days": p_dur,
        "elapsed_duration_days": e_dur,
        "physical_progress": phys,
        "expected_progress": exp,
        "financial_progress": fin,
        "approved_budget": budget,
        "expenditure": spend,
        "milestones_delayed": m_del,
        "milestones_total": m_tot,
        "resource_availability": res,
        "contractor_performance": cont,
        "material_availability": mat,
        "previous_delays": prev_d,
        "schedule_slippage_gap": schedule_slippage_gap,
        "financial_physical_gap": financial_physical_gap,
        "budget_utilization_pct": budget_utilization_pct,
        "time_elapsed_ratio": time_elapsed_ratio,
        "milestone_slippage_rate": milestone_slippage_rate,
        "composite_resource_index": composite_resource_index,
        "burn_rate_vs_progress_ratio": burn_rate_vs_progress_ratio,
    }
    return features


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms a DataFrame of cleaned project records into a feature-engineered DataFrame.
    """
    records = df.to_dict(orient="records")
    features_list = [engineer_features_single(r) for r in records]
    feat_df = pd.DataFrame(features_list)

    # Preserve target columns if present
    for target in ("delay_occurred", "delay_days", "project_id", "name", "department", "location"):
        if target in df.columns:
            feat_df[target] = df[target].values

    return feat_df

"""
Data cleaning and validation module for Indian infrastructure project monitoring data.
Handles missing values, data type normalization, range bounding, and format standardization.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Union
import numpy as np
import pandas as pd


def _parse_date(val: Any) -> Union[date, None]:
    if val is None or pd.isna(val):
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, str):
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(val.split("T")[0], fmt).date()
            except ValueError:
                continue
    return None


def clean_project_record(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cleans and standardizes a single project dictionary.
    Ensures correct types, bounded percentages, and fallback defaults.
    """
    cleaned = dict(data)

    # Clean numeric fields with safe defaults
    numeric_fields = {
        "planned_duration_days": (float(data.get("planned_duration_days") or 365), 30, 3650),
        "elapsed_duration_days": (float(data.get("elapsed_duration_days") or 0), 0, 3650),
        "physical_progress": (float(data.get("physical_progress") or 0), 0.0, 100.0),
        "financial_progress": (float(data.get("financial_progress") or 0), 0.0, 100.0),
        "expected_progress": (float(data.get("expected_progress") or 0), 0.0, 100.0),
        "approved_budget": (float(data.get("approved_budget") or 0), 0.0, 1e12),
        "released_funds": (float(data.get("released_funds") or 0), 0.0, 1e12),
        "expenditure": (float(data.get("expenditure") or 0), 0.0, 1e12),
        "milestones_delayed": (int(data.get("milestones_delayed") or 0), 0, 100),
        "milestones_total": (int(data.get("milestones_total") or max(int(data.get("milestones_delayed") or 0), 1)), 1, 100),
        "resource_availability": (float(data.get("resource_availability") if data.get("resource_availability") is not None else 75.0), 0.0, 100.0),
        "contractor_performance": (float(data.get("contractor_performance") if data.get("contractor_performance") is not None else 70.0), 0.0, 100.0),
        "material_availability": (float(data.get("material_availability") if data.get("material_availability") is not None else 75.0), 0.0, 100.0),
        "previous_delays": (int(data.get("previous_delays") or 0), 0, 50),
    }

    for key, (val, min_v, max_v) in numeric_fields.items():
        cleaned[key] = max(min_v, min(val, max_v))

    # Dates handling if start_date & planned_completion are supplied
    start_date = _parse_date(cleaned.get("start_date"))
    planned_completion = _parse_date(cleaned.get("planned_completion"))

    if start_date and planned_completion:
        delta_days = (planned_completion - start_date).days
        if delta_days > 0 and cleaned["planned_duration_days"] == 365:
            cleaned["planned_duration_days"] = float(delta_days)

        today = date.today()
        elapsed = (today - start_date).days
        if elapsed >= 0 and cleaned["elapsed_duration_days"] == 0:
            cleaned["elapsed_duration_days"] = float(elapsed)

    # S-curve or linear expected progress estimation if expected_progress is 0
    if cleaned["expected_progress"] == 0 and cleaned["planned_duration_days"] > 0:
        ratio = cleaned["elapsed_duration_days"] / cleaned["planned_duration_days"]
        cleaned["expected_progress"] = round(min(100.0, max(0.0, ratio * 100.0)), 2)

    # Text fields
    cleaned["department"] = str(cleaned.get("department") or "Infrastructure").strip()
    cleaned["location"] = str(cleaned.get("location") or "General").strip()
    cleaned["status"] = str(cleaned.get("status") or "ON_TRACK").strip().upper()

    return cleaned


def clean_project_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans an entire pandas DataFrame of project monitoring records.
    """
    cleaned_rows = [clean_project_record(row) for row in df.to_dict(orient="records")]
    return pd.DataFrame(cleaned_rows)

"""
Project Health Score Calculation Engine.
Implements the 6-component weighted health score model (0 to 100):
- Schedule Performance (25%)
- Physical Progress (25%)
- Financial Performance (15%)
- Milestone Performance (15%)
- Resource Health (10%)
- Contractor Health (10%)
"""

from typing import Any, Dict


def calculate_project_health_score(cleaned_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes dynamic 0-100 Project Health Score and individual component scores.
    Returns:
        {
            "health_score": float (0-100),
            "health_category": "HEALTHY" | "AT_RISK" | "HIGH_RISK" | "CRITICAL",
            "category_label": str,
            "badge_color": str,
            "components": {
                "schedule_performance": float,
                "physical_progress": float,
                "financial_performance": float,
                "milestone_performance": float,
                "resource_health": float,
                "contractor_health": float
            },
            "weights": { ... }
        }
    """
    phys = float(cleaned_record.get("physical_progress", 0.0))
    exp = float(cleaned_record.get("expected_progress", 0.0))
    fin = float(cleaned_record.get("financial_progress", 0.0))
    budget = float(cleaned_record.get("approved_budget", 0.0))
    spend = float(cleaned_record.get("expenditure", 0.0))
    m_del = float(cleaned_record.get("milestones_delayed", 0.0))
    m_tot = max(float(cleaned_record.get("milestones_total", 1.0)), 1.0)
    res = float(cleaned_record.get("resource_availability", 75.0))
    mat = float(cleaned_record.get("material_availability", 75.0))
    cont = float(cleaned_record.get("contractor_performance", 70.0))
    p_dur = float(cleaned_record.get("planned_duration_days", 365.0))
    e_dur = float(cleaned_record.get("elapsed_duration_days", 0.0))

    # 1. Schedule Performance (25%)
    slippage = exp - phys
    if slippage <= 0:
        schedule_score = 100.0
    elif slippage <= 10:
        schedule_score = 100.0 - (slippage * 3.0)  # 70 to 100
    elif slippage <= 25:
        schedule_score = 70.0 - ((slippage - 10.0) * 2.5)  # 32.5 to 70
    else:
        schedule_score = max(5.0, 32.5 - ((slippage - 25.0) * 1.5))

    # Time overrun penalty
    if e_dur > p_dur:
        overrun_days = e_dur - p_dur
        schedule_score = max(0.0, schedule_score - min(30.0, (overrun_days / 30.0) * 10.0))

    # 2. Physical Progress (25%)
    if exp <= 0:
        physical_score = 100.0 if phys >= 0 else 50.0
    else:
        ratio = phys / exp
        if ratio >= 1.0:
            physical_score = 100.0
        elif ratio >= 0.85:
            physical_score = 80.0 + (ratio - 0.85) * 133.3
        elif ratio >= 0.65:
            physical_score = 55.0 + (ratio - 0.65) * 125.0
        else:
            physical_score = max(5.0, ratio * 84.6)

    # 3. Financial Performance (15%)
    # Evaluates financial vs physical gap and budget utilization efficiency
    fin_gap = fin - phys
    if fin_gap <= 5:
        fin_gap_score = 100.0
    elif fin_gap <= 15:
        fin_gap_score = 85.0 - (fin_gap - 5) * 2.5
    elif fin_gap <= 30:
        fin_gap_score = 60.0 - (fin_gap - 15) * 2.0
    else:
        fin_gap_score = max(10.0, 30.0 - (fin_gap - 30) * 1.0)

    # Spend sanity vs budget
    budget_util = (spend / (budget + 1e-5)) * 100 if budget > 0 else fin
    if budget_util > 90 and phys < 60:
        util_penalty = 25.0
    elif budget_util > 75 and phys < 50:
        util_penalty = 15.0
    else:
        util_penalty = 0.0

    financial_score = max(0.0, min(100.0, fin_gap_score - util_penalty))

    # 4. Milestone Performance (15%)
    milestone_success_rate = max(0.0, (m_tot - m_del) / m_tot)
    milestone_score = round(milestone_success_rate * 100.0, 1)

    # 5. Resource Health (10%)
    resource_score = round(0.50 * res + 0.50 * mat, 1)

    # 6. Contractor Health (10%)
    contractor_score = round(cont, 1)

    # Composite Health Score
    weights = {
        "schedule_performance": 0.25,
        "physical_progress": 0.25,
        "financial_performance": 0.15,
        "milestone_performance": 0.15,
        "resource_health": 0.10,
        "contractor_health": 0.10,
    }

    raw_health = (
        schedule_score * weights["schedule_performance"]
        + physical_score * weights["physical_progress"]
        + financial_score * weights["financial_performance"]
        + milestone_score * weights["milestone_performance"]
        + resource_score * weights["resource_health"]
        + contractor_score * weights["contractor_health"]
    )

    final_health = round(max(0.0, min(100.0, raw_health)), 1)

    # Categorization per MoSPI guidelines
    if final_health >= 80.0:
        category = "HEALTHY"
        label = "Healthy"
        badge = "🟢"
    elif final_health >= 60.0:
        category = "AT_RISK"
        label = "At Risk"
        badge = "🟡"
    elif final_health >= 40.0:
        category = "HIGH_RISK"
        label = "High Risk"
        badge = "🟠"
    else:
        category = "CRITICAL"
        label = "Critical"
        badge = "🔴"

    return {
        "health_score": final_health,
        "health_category": category,
        "category_label": label,
        "badge_color": badge,
        "components": {
            "schedule_performance": round(schedule_score, 1),
            "physical_progress": round(physical_score, 1),
            "financial_performance": round(financial_score, 1),
            "milestone_performance": round(milestone_score, 1),
            "resource_health": round(resource_score, 1),
            "contractor_health": round(contractor_score, 1),
        },
        "weights": {k: int(v * 100) for k, v in weights.items()},
    }

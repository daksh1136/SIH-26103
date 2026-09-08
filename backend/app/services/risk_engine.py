from datetime import date
from typing import Dict, Any


def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return max(minimum, min(value, maximum))


def calculate_schedule_risk(project) -> float:
    """
    Measures schedule risk using physical progress,
    project timeline and project status.
    """

    today = date.today()

    start_date = project.start_date
    completion_date = project.planned_completion

    total_days = max(
        (completion_date - start_date).days,
        1,
    )

    elapsed_days = max(
        (today - start_date).days,
        0,
    )

    time_progress = clamp(
        (elapsed_days / total_days) * 100
    )

    physical_progress = clamp(
        float(project.physical_progress or 0)
    )

    progress_gap = max(
        time_progress - physical_progress,
        0,
    )

    risk = progress_gap * 1.2

    if project.status == "AT_RISK":
        risk += 20

    elif project.status == "DELAYED":
        risk += 35

    elif project.status == "CRITICAL":
        risk += 50

    return clamp(risk)


def calculate_financial_risk(project) -> float:
    """
    Detects financial stress by comparing expenditure,
    released funds and physical progress.
    """

    released = float(
        project.released_funds or 0
    )

    expenditure = float(
        project.expenditure or 0
    )

    physical_progress = clamp(
        float(project.physical_progress or 0)
    )

    if released <= 0:
        return 0

    expenditure_ratio = (
        expenditure / released
    ) * 100

    spending_gap = max(
        expenditure_ratio - physical_progress,
        0,
    )

    risk = spending_gap * 1.5

    if expenditure > released:
        risk += 35

    return clamp(risk)


def calculate_progress_risk(project) -> float:
    """
    Measures risk from mismatch between
    physical and financial progress.
    """

    physical = clamp(
        float(project.physical_progress or 0)
    )

    financial = clamp(
        float(project.financial_progress or 0)
    )

    gap = max(
        financial - physical,
        0,
    )

    return clamp(
        gap * 1.4
    )


def calculate_budget_risk(project) -> float:
    """
    Measures budget utilization and remaining
    financial capacity.
    """

    approved = float(
        project.approved_budget or 0
    )

    expenditure = float(
        project.expenditure or 0
    )

    if approved <= 0:
        return 0

    utilization = (
        expenditure / approved
    ) * 100

    physical = clamp(
        float(project.physical_progress or 0)
    )

    # Spending significantly ahead of physical progress
    gap = max(
        utilization - physical,
        0,
    )

    return clamp(
        gap * 1.2
    )


def calculate_risk(project) -> Dict[str, Any]:
    """
    Main ProjectPulse risk calculation.

    Produces:
    - overall risk score
    - risk level
    - contributing factors
    - warning
    - recommendation
    """

    schedule_risk = calculate_schedule_risk(
        project
    )

    financial_risk = calculate_financial_risk(
        project
    )

    progress_risk = calculate_progress_risk(
        project
    )

    budget_risk = calculate_budget_risk(
        project
    )


    # Weighted model
    risk_score = (
        schedule_risk * 0.35
        + financial_risk * 0.25
        + progress_risk * 0.25
        + budget_risk * 0.15
    )

    risk_score = round(
        clamp(risk_score),
        1,
    )


    # Explicit status escalation
    status = (
        project.status or ""
    ).upper()

    if status == "CRITICAL":
        risk_score = max(
            risk_score,
            75,
        )

    elif status == "DELAYED":
        risk_score = max(
            risk_score,
            60,
        )

    elif status == "AT_RISK":
        risk_score = max(
            risk_score,
            50,
        )


    # Risk classification
    if risk_score >= 75:
        risk_level = "CRITICAL"

    elif risk_score >= 50:
        risk_level = "HIGH"

    elif risk_score >= 25:
        risk_level = "MODERATE"

    else:
        risk_level = "LOW"


    factors = [
        {
            "name": "Schedule Risk",
            "score": round(
                schedule_risk,
                1,
            ),
            "weight": 35,
        },
        {
            "name": "Financial Risk",
            "score": round(
                financial_risk,
                1,
            ),
            "weight": 25,
        },
        {
            "name": "Progress Risk",
            "score": round(
                progress_risk,
                1,
            ),
            "weight": 25,
        },
        {
            "name": "Budget Risk",
            "score": round(
                budget_risk,
                1,
            ),
            "weight": 15,
        },
    ]


    reasons = []


    if schedule_risk >= 50:
        reasons.append(
            "Project progress is significantly behind the planned schedule."
        )

    elif schedule_risk >= 25:
        reasons.append(
            "Project progress shows a schedule deviation."
        )


    if financial_risk >= 50:
        reasons.append(
            "Expenditure is significantly ahead of physical progress."
        )

    elif financial_risk >= 25:
        reasons.append(
            "Financial utilization requires monitoring."
        )


    if progress_risk >= 40:
        reasons.append(
            "Financial and physical progress are substantially misaligned."
        )


    if budget_risk >= 40:
        reasons.append(
            "Budget utilization is high compared with project completion."
        )


    if status == "CRITICAL":
        reasons.append(
            "Project is currently marked CRITICAL."
        )

    elif status == "DELAYED":
        reasons.append(
            "Project is currently marked DELAYED."
        )

    elif status == "AT_RISK":
        reasons.append(
            "Project is currently marked AT_RISK."
        )


    if not reasons:
        reasons.append(
            "Current project indicators are within acceptable monitoring limits."
        )


    warning = risk_score >= 50


    if risk_level == "CRITICAL":
        recommendation = (
            "Immediate senior-level intervention is recommended. "
            "Review schedule, expenditure and implementation bottlenecks."
        )

    elif risk_level == "HIGH":
        recommendation = (
            "Enhanced monitoring is recommended. "
            "Review schedule deviation and financial utilization."
        )

    elif risk_level == "MODERATE":
        recommendation = (
            "Continue close monitoring and address emerging "
            "schedule or financial deviations."
        )

    else:
        recommendation = (
            "Project indicators are currently stable. "
            "Continue routine monitoring."
        )


    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "warning": warning,
        "factors": factors,
        "reasons": reasons,
        "recommendation": recommendation,
    }
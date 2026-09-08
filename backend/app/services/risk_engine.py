from datetime import date


def calculate_risk(project):
    """
    Calculate an explainable risk score for a project.

    Returns:
        {
            "risk_score": 0-100,
            "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
            "risk_factors": [],
            "recommendation": ""
        }
    """

    score = 0
    factors = []

    # --------------------------------------------------
    # PROJECT DATA
    # --------------------------------------------------

    physical = float(project.physical_progress or 0)
    financial = float(project.financial_progress or 0)

    approved_budget = float(project.approved_budget or 0)
    expenditure = float(project.expenditure or 0)

    planned_completion = project.planned_completion

    # --------------------------------------------------
    # 1. PHYSICAL VS FINANCIAL VARIANCE
    # --------------------------------------------------

    variance = financial - physical

    if variance >= 30:
        score += 30

        factors.append(
            f"Financial progress is {variance:.1f}% ahead "
            f"of physical progress"
        )

    elif variance >= 20:
        score += 20

        factors.append(
            f"Financial progress is {variance:.1f}% ahead "
            f"of physical progress"
        )

    elif variance >= 10:
        score += 10

        factors.append(
            f"Financial progress is {variance:.1f}% ahead "
            f"of physical progress"
        )

    # --------------------------------------------------
    # 2. BUDGET UTILIZATION
    # --------------------------------------------------

    budget_utilization = 0

    if approved_budget > 0:
        budget_utilization = (
            expenditure / approved_budget
        ) * 100

    if budget_utilization >= 95 and physical < 70:

        score += 25

        factors.append(
            f"{budget_utilization:.1f}% of approved "
            f"budget consumed"
        )

    elif budget_utilization >= 85 and physical < 60:

        score += 20

        factors.append(
            f"{budget_utilization:.1f}% of approved "
            f"budget consumed"
        )

    elif budget_utilization >= 75 and physical < 50:

        score += 12

        factors.append(
            f"{budget_utilization:.1f}% of approved "
            f"budget consumed"
        )

    # --------------------------------------------------
    # 3. LOW PHYSICAL PROGRESS
    # --------------------------------------------------

    if physical < 30:

        score += 20

        factors.append(
            "Physical progress is below 30%"
        )

    elif physical < 45:

        score += 12

        factors.append(
            "Physical progress is below 45%"
        )

    elif physical < 55:

        score += 6

        factors.append(
            "Physical progress is below 55%"
        )

    # --------------------------------------------------
    # 4. COMPLETION DATE
    # --------------------------------------------------

    today = date.today()

    if planned_completion:

        days_remaining = (
            planned_completion - today
        ).days

        # Project deadline already passed
        if days_remaining < 0:

            score += 30

            factors.append(
                "Planned completion date has passed"
            )

        # Deadline within 30 days
        elif days_remaining <= 30 and physical < 80:

            score += 25

            factors.append(
                "Project is within 30 days of "
                "planned completion"
            )

        # Deadline within 90 days
        elif days_remaining <= 90 and physical < 60:

            score += 15

            factors.append(
                "Project is within 90 days of "
                "planned completion"
            )

    # --------------------------------------------------
    # 5. EXISTING PROJECT STATUS
    # --------------------------------------------------

    existing_status = str(
        project.status or ""
    ).upper()

    if existing_status == "CRITICAL":

        score += 15

    elif existing_status == "DELAYED":

        score += 12

    elif existing_status == "AT_RISK":

        score += 7

    # --------------------------------------------------
    # CAP SCORE
    # --------------------------------------------------

    score = min(score, 100)

    # --------------------------------------------------
    # RISK LEVEL
    # --------------------------------------------------

    if score >= 75:

        risk_level = "CRITICAL"

    elif score >= 50:

        risk_level = "HIGH"

    elif score >= 25:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    # --------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------

    if risk_level == "CRITICAL":

        recommendation = (
            "Immediate intervention required. "
            "Review expenditure, schedule and "
            "implementation progress with the "
            "project authority."
        )

    elif risk_level == "HIGH":

        recommendation = (
            "Escalate for closer monitoring. "
            "Review schedule recovery actions "
            "and expenditure."
        )

    elif risk_level == "MEDIUM":

        recommendation = (
            "Increase monitoring frequency and "
            "verify implementation progress "
            "against expenditure."
        )

    else:

        recommendation = (
            "Project is currently progressing "
            "within acceptable risk parameters."
        )

    # --------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------

    return {
        "risk_score": round(score, 1),
        "risk_level": risk_level,
        "risk_factors": factors,
        "recommendation": recommendation,
    }
"""
Risk categorization and scoring utilities for project monitoring.
Maps continuous model delay probabilities into actionable risk levels:
- LOW: < 25% probability
- MODERATE: 25% - 49.9% probability
- HIGH: 50% - 74.9% probability
- CRITICAL: >= 75% probability
"""

from typing import Dict, Tuple


def get_risk_tier(delay_probability: float) -> Tuple[str, str, str]:
    """
    Returns (risk_level, label, badge) for a given probability between 0.0 and 1.0.
    """
    prob_pct = delay_probability * 100.0 if delay_probability <= 1.0 else delay_probability

    if prob_pct >= 75.0:
        return "CRITICAL", "Critical Risk", "🔴"
    elif prob_pct >= 50.0:
        return "HIGH", "High Risk", "🟠"
    elif prob_pct >= 25.0:
        return "MODERATE", "Moderate Risk", "🟡"
    else:
        return "LOW", "Low Risk", "🟢"


def format_risk_summary(delay_prob: float, predicted_delay_days: int) -> str:
    """
    Generates an executive summary sentence for the risk level.
    """
    tier, label, badge = get_risk_tier(delay_prob)
    prob_pct = round(delay_prob * 100.0, 1)

    if tier == "CRITICAL":
        return f"{badge} {label}: Project exhibits severe delay probability of {prob_pct}%, with an estimated schedule slippage of {predicted_delay_days} days. Urgent intervention required."
    elif tier == "HIGH":
        return f"{badge} {label}: Significant delay probability of {prob_pct}% detected. Milestone slippage and resource bottlenecks threaten delivery within {predicted_delay_days} days."
    elif tier == "MODERATE":
        return f"{badge} {label}: Moderate delay probability of {prob_pct}%. Preemptive monitoring advised to prevent milestone slippage ({predicted_delay_days} estimated delay days)."
    else:
        return f"{badge} {label}: Project is progressing within healthy tolerance parameters (delay probability: {prob_pct}%)."

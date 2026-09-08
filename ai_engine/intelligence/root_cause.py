"""
Root Cause Diagnostic Intelligence Engine.
Analyzes project operational metrics, milestone records, and ML feature attributions
to diagnose the primary and secondary root causes of project delay risk.
"""

from typing import Any, Dict, List
from ai_engine.preprocessing.cleaner import clean_project_record
from ai_engine.preprocessing.feature_engineering import engineer_features_single


class RootCauseEngine:
    """
    Multi-factor causal reasoning engine diagnosing root bottlenecks
    across Contractor Resources, Material Logistics, Financial Imbalance,
    Administrative Approvals, and Scope Execution.
    """

    def diagnose(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Diagnoses root causes for a project.
        Returns:
            {
                "primary_cause": str,
                "secondary_causes": List[str],
                "confidence_score": float,
                "evidence": List[Dict[str, Any]],
                "diagnostic_summary": str
            }
        """
        cleaned = clean_project_record(project_data)
        features = engineer_features_single(cleaned)

        phys = features["physical_progress"]
        exp = features["expected_progress"]
        fin = features["financial_progress"]
        res = features["resource_availability"]
        mat = features["material_availability"]
        cont = features["contractor_performance"]
        m_del = features["milestones_delayed"]
        slippage = features["schedule_slippage_gap"]
        fin_gap = features["financial_physical_gap"]
        spend = features["expenditure"]
        budget = features["approved_budget"]
        budget_util = features["budget_utilization_pct"]
        prev_delays = features["previous_delays"]

        causes_ranked = []
        evidence_list = []

        # 1. Contractor Resource Shortage
        if res < 65.0 or cont < 60.0:
            severity = (70.0 - res) * 1.5 + (70.0 - cont) * 1.2
            causes_ranked.append(("Contractor Resource Shortage", severity))
            evidence_list.append({
                "factor": "Manpower & Equipment Shortage",
                "finding": f"Resource availability is at {res}% (benchmark >= 75%) and contractor execution index is {cont}/100.",
                "severity": "HIGH" if res < 50 or cont < 50 else "MODERATE"
            })

        # 2. Material Procurement Delay
        if mat < 65.0:
            severity = (70.0 - mat) * 2.0
            causes_ranked.append(("Material Procurement Delay", severity))
            evidence_list.append({
                "factor": "Supply Chain Bottleneck",
                "finding": f"Material availability is at {mat}% (benchmark >= 75%), causing construction idling.",
                "severity": "HIGH" if mat < 50 else "MODERATE"
            })

        # 3. Financial-Physical Imbalance / Fund Utilization Block
        if fin_gap > 15.0:
            severity = fin_gap * 1.8
            causes_ranked.append(("Financial-Physical Progress Imbalance", severity))
            evidence_list.append({
                "factor": "Progress-Expenditure Decoupling",
                "finding": f"Financial disbursement ({fin}%) exceeds verified physical progress ({phys}%) by {fin_gap:.1f}%.",
                "severity": "HIGH" if fin_gap > 25 else "MODERATE"
            })

        # 4. Critical Milestone Slippage
        if m_del > 0:
            severity = m_del * 20.0 + slippage * 0.8
            causes_ranked.append(("Cumulative Milestone Slippage", severity))
            evidence_list.append({
                "factor": "Milestone Default",
                "finding": f"{int(m_del)} key milestone(s) have slipped past deadline; schedule lag is {slippage:.1f}%.",
                "severity": "CRITICAL" if m_del >= 3 else "HIGH" if m_del >= 1 else "MODERATE"
            })

        # 5. Budget Exhaustion Risk
        if budget_util > 85.0 and phys < 65.0:
            severity = (budget_util - phys) * 1.5
            causes_ranked.append(("Premature Budget Consumption", severity))
            evidence_list.append({
                "factor": "Cost Overrun Velocity",
                "finding": f"{budget_util:.1f}% of approved budget consumed with only {phys}% physical work completed.",
                "severity": "CRITICAL"
            })

        # 6. Recurrent Historical Delays / Institutional Stalling
        if prev_delays >= 2:
            severity = prev_delays * 15.0
            causes_ranked.append(("Chronic Schedule Slippage Pattern", severity))
            evidence_list.append({
                "factor": "Historical Delay Repetition",
                "finding": f"Project has recorded {int(prev_delays)} prior extension/delay events.",
                "severity": "MODERATE"
            })

        # Fallback if project is healthy
        if not causes_ranked:
            return {
                "primary_cause": "No Significant Root Cause Identified",
                "secondary_causes": [],
                "confidence_score": 92.0,
                "evidence": [{
                    "factor": "Operational Health",
                    "finding": f"Physical ({phys}%) and financial ({fin}%) execution remain balanced.",
                    "severity": "LOW"
                }],
                "diagnostic_summary": "Project is operating within acceptable tolerances; no critical operational bottlenecks detected."
            }

        # Rank causes by calculated severity
        causes_ranked.sort(key=lambda x: x[1], reverse=True)
        primary_cause = causes_ranked[0][0]
        secondary_causes = [c[0] for c in causes_ranked[1:4]]

        top_sev = causes_ranked[0][1]
        confidence = round(min(96.0, max(65.0, 70.0 + (top_sev / 5.0))), 1)

        summary = (
            f"Primary bottleneck identified as '{primary_cause}'. "
            + (f"Secondary contributors include: {', '.join(secondary_causes)}. " if secondary_causes else "")
            + f"Verified against {len(evidence_list)} operational data indicators."
        )

        return {
            "primary_cause": primary_cause,
            "secondary_causes": secondary_causes,
            "confidence_score": confidence,
            "evidence": evidence_list,
            "diagnostic_summary": summary,
        }


# Global singleton
_root_cause_engine: RootCauseEngine = RootCauseEngine()


def get_root_cause_engine() -> RootCauseEngine:
    return _root_cause_engine

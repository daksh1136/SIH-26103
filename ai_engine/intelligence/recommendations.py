"""
Corrective Action Engine for Infrastructure Monitoring.
Translates diagnosed root causes and milestone delays into structured,
prioritized, and defensible action recommendations for project officers.
"""

from typing import Any, Dict, List
from ai_engine.intelligence.root_cause import RootCauseEngine, get_root_cause_engine


# Structured action playbooks keyed by root cause
ACTION_PLAYBOOKS: Dict[str, Dict[str, Any]] = {
    "Contractor Resource Shortage": {
        "immediate_actions": [
            "Direct contractor to augment skilled workforce deployment by at least 25%.",
            "Mandate double-shift working on critical path activities.",
            "Deploy additional earthmoving and fabrication machinery within 7 days.",
        ],
        "strategic_actions": [
            "Convene emergency progress review meeting with contractor leadership.",
            "Institute contractual penalty clause warnings under general conditions of contract (GCC).",
            "Establish daily on-site attendance and equipment mobilization logging.",
        ],
        "responsible_authority": "Superintending Engineer / Project Director",
        "target_timeline_days": 7,
    },
    "Material Procurement Delay": {
        "immediate_actions": [
            "Issue emergency supply authorizations for critical raw materials (cement, steel, aggregate).",
            "Identify alternate empanelled vendors within state boundary to resolve transit delays.",
            "Establish green-channel clearance for project freight and haulage vehicles.",
        ],
        "strategic_actions": [
            "Audit supply chain logistics and buffer inventory levels at project store depots.",
            "Fast-track advance invoice clearances to unlock vendor credit lines.",
        ],
        "responsible_authority": "Procurement & Materials Management Cell",
        "target_timeline_days": 10,
    },
    "Financial-Physical Progress Imbalance": {
        "immediate_actions": [
            "Initiate physical verification audit of all works billed in the last two billing cycles.",
            "Withhold subsequent milestone disbursements until field progress reconciles with expenditure.",
            "Instruct third-party inspection agency (TPIA) to submit verified measurement sheet.",
        ],
        "strategic_actions": [
            "Align future fund releases strictly to physical milestone milestones certified by engineer-in-charge.",
            "Audit mobilization advance recovery schedule.",
        ],
        "responsible_authority": "Financial Controller & Chief Accounts Officer",
        "target_timeline_days": 14,
    },
    "Cumulative Milestone Slippage": {
        "immediate_actions": [
            "Formalize a Milestone Recovery Plan (MRP) compressing downstream activity durations.",
            "Crash the critical path schedule by reallocating non-critical float resources.",
            "Escalate delay to State Infrastructure Monitoring Committee (SIMC).",
        ],
        "strategic_actions": [
            "Issue revised baseline schedule with bi-weekly milestone checkpoints.",
            "Conduct joint site walk-through with all executing agencies.",
        ],
        "responsible_authority": "Chief Engineer / Department Secretary",
        "target_timeline_days": 14,
    },
    "Premature Budget Consumption": {
        "immediate_actions": [
            "Freeze non-essential contingency expenditures immediately.",
            "Perform comprehensive variation order (VO) and quantity reconciliation review.",
            "Assess requirement for Revised Cost Estimate (RCE) submission to MoSPI.",
        ],
        "strategic_actions": [
            "Audit unit rate variations and contractual escalation claims.",
            "Review design changes to eliminate non-critical expenditure elements.",
        ],
        "responsible_authority": "Standing Committee on Cost Overruns",
        "target_timeline_days": 21,
    },
    "Chronic Schedule Slippage Pattern": {
        "immediate_actions": [
            "Issue formal show-cause notice regarding prolonged execution delays.",
            "Evaluate risk of partial contract termination or risk-and-cost execution of balance works.",
        ],
        "strategic_actions": [
            "Restructure package into smaller, parallel execution lots if contractor capacity is saturated.",
        ],
        "responsible_authority": "Ministry Project Oversight Directorate",
        "target_timeline_days": 15,
    },
}


class RecommendationEngine:
    """
    Produces actionable, structured decision-support recommendations.
    """

    def __init__(self, root_cause_engine: RootCauseEngine = None):
        self.root_cause_engine = root_cause_engine or get_root_cause_engine()

    def recommend(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates prioritized action recommendations based on root cause diagnosis.
        Returns:
            {
                "primary_cause": str,
                "urgency": "IMMEDIATE" | "HIGH" | "ROUTINE",
                "recommended_actions": List[str],
                "recovery_plan_required": bool,
                "responsible_authority": str,
                "target_timeline_days": int,
                "action_summary": str
            }
        """
        diagnosis = self.root_cause_engine.diagnose(project_data)
        primary_cause = diagnosis["primary_cause"]

        playbook = ACTION_PLAYBOOKS.get(
            primary_cause,
            {
                "immediate_actions": [
                    "Continue routine bi-weekly project performance review.",
                    "Verify milestone completion dates against approved baseline schedule.",
                ],
                "strategic_actions": [
                    "Maintain continuous monitoring in accordance with standard MoSPI guidelines.",
                ],
                "responsible_authority": "Executive Engineer",
                "target_timeline_days": 30,
            }
        )

        # Check if project requires an active recovery plan
        m_delayed = int(project_data.get("milestones_delayed", 0) or 0)
        phys = float(project_data.get("physical_progress", 0) or 0)
        exp = float(project_data.get("expected_progress", 0) or 0)
        slippage = exp - phys

        recovery_plan_required = m_delayed > 0 or slippage > 15.0 or primary_cause in [
            "Contractor Resource Shortage",
            "Cumulative Milestone Slippage",
            "Premature Budget Consumption"
        ]

        # Combine actions into prioritized list
        actions = list(playbook["immediate_actions"])
        if recovery_plan_required and "Milestone Recovery Plan (MRP)" not in "".join(actions):
            actions.append(f"Initiate formal Milestone Recovery Plan to recover {max(15, round(slippage * 3))} lost schedule days.")
        actions.extend(playbook["strategic_actions"])

        urgency = "IMMEDIATE" if (m_delayed >= 2 or slippage > 20) else "HIGH" if (m_delayed >= 1 or slippage > 10) else "ROUTINE"

        summary = (
            f"Action Priority: {urgency}. "
            f"Address root cause '{primary_cause}' via {len(actions)} prescribed interventions. "
            f"Responsible authority: {playbook['responsible_authority']} within {playbook['target_timeline_days']} days."
        )

        return {
            "primary_cause": primary_cause,
            "secondary_causes": diagnosis.get("secondary_causes", []),
            "urgency": urgency,
            "recommended_actions": actions,
            "recovery_plan_required": recovery_plan_required,
            "responsible_authority": playbook["responsible_authority"],
            "target_timeline_days": playbook["target_timeline_days"],
            "action_summary": summary,
        }


# Global singleton
_recommendation_engine: RecommendationEngine = RecommendationEngine()


def get_recommendation_engine() -> RecommendationEngine:
    return _recommendation_engine

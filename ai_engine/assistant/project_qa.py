"""
Project Intelligence Question-Answering (QA) Engine.
Integrates natural language parsing with the AI Risk, Health, SHAP, Root Cause,
and Recommendation engines to answer managerial inquiries.
"""

from typing import Any, Dict, List, Optional
from ai_engine.assistant.query_parser import parse_project_query
from ai_engine.explainability.shap_explainer import get_explainer
from ai_engine.intelligence.anomaly_detection import get_anomaly_engine
from ai_engine.intelligence.recommendations import get_recommendation_engine
from ai_engine.intelligence.root_cause import get_root_cause_engine
from ai_engine.prediction.delay_model import get_delay_engine
from ai_engine.prediction.health_score import calculate_project_health_score


class ProjectAssistant:
    """
    Synthesizes conversational, fact-grounded answers to project monitoring queries.
    """

    def __init__(self):
        self.delay_engine = get_delay_engine()
        self.explainer = get_explainer()
        self.root_cause_engine = get_root_cause_engine()
        self.rec_engine = get_recommendation_engine()
        self.anomaly_engine = get_anomaly_engine()

    def ask(self, query: str, projects_pool: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Processes a natural language query against a pool of project records.
        """
        parsed = parse_project_query(query)
        intent = parsed["intent"]
        proj_id = parsed["project_id"]
        dept = parsed["department"]
        state = parsed["location"]
        risk_level = parsed["risk_level"]

        # 1. Single Project Explanation: "Why is Project X high risk?"
        if (intent in ["PROJECT_EXPLANATION", "PROJECT_RECOMMENDATION", "PROJECT_HEALTH"] or proj_id is not None) and proj_id is not None:
            target = next((p for p in projects_pool if p.get("id") == proj_id or p.get("project_id") == proj_id), None)
            if target:
                return self._answer_single_project(target, intent)

        # Try to find target by name keyword if no ID was found
        if intent in ["PROJECT_EXPLANATION", "PROJECT_RECOMMENDATION", "PROJECT_HEALTH"]:
            for p in projects_pool:
                p_name = p.get("name", "").lower()
                if any(w in p_name for w in query.lower().split() if len(w) > 4):
                    return self._answer_single_project(p, intent)

        # 2. Anomaly Filter: "Which projects have high financial utilization but low physical progress?"
        if intent == "ANOMALY_QUERY":
            return self._answer_anomaly_query(projects_pool)

        # 3. Filter Query: "Which projects are high risk in Assam?"
        if intent in ["FILTER_QUERY", "PORTFOLIO_SUMMARY", "GENERAL_QUERY"]:
            return self._answer_filter_query(projects_pool, dept, state, risk_level)

        # Default summary response
        return self._answer_filter_query(projects_pool, None, None, None)

    def _answer_single_project(self, project: Dict[str, Any], intent: str) -> Dict[str, Any]:
        name = project.get("name", f"Project #{project.get('id')}")
        pred = self.delay_engine.predict_single(project)
        health = calculate_project_health_score(project)
        explanation = self.explainer.explain_prediction(project)
        root_cause = self.root_cause_engine.diagnose(project)
        recommendation = self.rec_engine.recommend(project)

        top_factors_str = "\n".join([
            f"  • {f['factor']}: {f['percentage']}% impact"
            for f in explanation["contributing_factors"][:4]
        ])

        rec_actions_str = "\n".join([
            f"  1. {a}" if i == 0 else f"  {i+1}. {a}"
            for i, a in enumerate(recommendation["recommended_actions"][:3])
        ])

        text = (
            f"### 📊 Project Intelligence: **{name}**\n\n"
            f"- **Delay Risk:** {pred['badge_color']} **{pred['risk_score']}% ({pred['risk_level']})**\n"
            f"- **Health Score:** {health['badge_color']} **{health['health_score']}/100 ({health['category_label']})**\n"
            f"- **Estimated Schedule Delay:** ~{pred['predicted_delay_days']} days\n"
            f"- **Physical vs Financial:** {project.get('physical_progress', 0)}% completed vs {project.get('financial_progress', 0)}% funds utilized\n\n"
            f"#### 🔍 Key Contributing Factors (SHAP XAI):\n{top_factors_str}\n\n"
            f"#### ⚙️ Diagnosed Root Cause:\n"
            f"**{root_cause['primary_cause']}** (Confidence: {root_cause['confidence_score']}%)\n"
            f"_{root_cause['diagnostic_summary']}_\n\n"
            f"#### 🚀 Recommended Corrective Actions ({recommendation['urgency']} Priority):\n{rec_actions_str}\n\n"
            f"**Responsible Authority:** {recommendation['responsible_authority']} (Turnaround: {recommendation['target_timeline_days']} days)"
        )

        return {
            "query_type": "SINGLE_PROJECT_INTELLIGENCE",
            "project_name": name,
            "response": text,
            "structured_data": {
                "risk": pred,
                "health": health,
                "explanation": explanation,
                "root_cause": root_cause,
                "recommendation": recommendation,
            },
        }

    def _answer_anomaly_query(self, projects: List[Dict[str, Any]]) -> Dict[str, Any]:
        flagged = []
        for p in projects:
            anom = self.anomaly_engine.detect_anomalies(p)
            if anom["is_anomaly"]:
                flagged.append((p, anom))

        if not flagged:
            return {
                "query_type": "ANOMALY_REPORT",
                "response": "✅ **Data Integrity Check Complete**: No project reporting anomalies detected across the current portfolio.",
                "flagged_count": 0,
            }

        lines = [f"⚠️ **Potential Anomalies Detected ({len(flagged)} Projects Requiring Verification)**:\n"]
        for p, a in flagged:
            name = p.get("name", f"Project #{p.get('id')}")
            lines.append(
                f"- **{name}** ({p.get('department', 'General')}, {p.get('location', 'India')})\n"
                f"  • Physical Progress: {p.get('physical_progress', 0)}% | Financial Progress: {p.get('financial_progress', 0)}%\n"
                f"  • Status: _{a['status_label']}_\n"
                f"  • Issues: {'; '.join(a['detected_issues'])}\n"
            )

        lines.append("\n*Note: Flagged items represent unusual progress-expenditure velocity patterns requiring administrative verification, not direct determinations of irregularity.*")

        return {
            "query_type": "ANOMALY_REPORT",
            "response": "\n".join(lines),
            "flagged_count": len(flagged),
        }

    def _answer_filter_query(
        self,
        projects: List[Dict[str, Any]],
        dept: Optional[str],
        state: Optional[str],
        risk_level: Optional[str]
    ) -> Dict[str, Any]:
        filtered = list(projects)

        if dept:
            filtered = [p for p in filtered if dept.lower() in p.get("department", "").lower()]
        if state:
            filtered = [p for p in filtered if state.lower() in p.get("location", "").lower()]

        # Evaluate risk for each project
        evaluated = []
        for p in filtered:
            r = self.delay_engine.predict_single(p)
            evaluated.append((p, r))

        if risk_level:
            evaluated = [item for item in evaluated if item[1]["risk_level"] == risk_level]

        # Sort highest risk first
        evaluated.sort(key=lambda x: x[1]["risk_score"], reverse=True)

        header = f"Found **{len(evaluated)} project(s)**"
        if dept:
            header += f" in department **{dept}**"
        if state:
            header += f" located in **{state}**"
        if risk_level:
            header += f" with risk tier **{risk_level}**"

        lines = [f"{header}:\n"]
        for p, r in evaluated[:10]:
            name = p.get("name", f"Project #{p.get('id')}")
            h = calculate_project_health_score(p)
            lines.append(
                f"- {r['badge_color']} **{name}** ({p.get('department', 'General')}) — "
                f"Delay Risk: **{r['risk_score']}%**, Health: **{h['health_score']}/100** ({h['category_label']}), "
                f"Progress: {p.get('physical_progress', 0)}% physical / {p.get('financial_progress', 0)}% financial."
            )

        if len(evaluated) > 10:
            lines.append(f"\n_...and {len(evaluated) - 10} additional projects._")

        return {
            "query_type": "PROJECT_FILTER_RESULTS",
            "matched_count": len(evaluated),
            "response": "\n".join(lines),
        }


# Global singleton
_assistant_instance: Optional[ProjectAssistant] = None


def get_project_assistant() -> ProjectAssistant:
    global _assistant_instance
    if _assistant_instance is None:
        _assistant_instance = ProjectAssistant()
    return _assistant_instance

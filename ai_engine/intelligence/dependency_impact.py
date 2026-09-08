"""
Project Dependency and Cascading Impact Analysis Engine.
Analyzes interconnections between infrastructure projects (e.g. Highway -> Industrial Zone -> Power Grid)
and calculates secondary and downstream delay impacts across dependent projects.
"""

from typing import Any, Dict, List, Optional


class DependencyImpactEngine:
    """
    Evaluates directed project dependency graphs and downstream delay cascades.
    """

    def analyze_cascade(
        self,
        source_project: Dict[str, Any],
        dependent_projects: List[Dict[str, Any]],
        source_delay_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyzes the downstream impact if the source project is delayed.
        Returns:
            {
                "source_project": str,
                "source_delay_days": int,
                "total_affected_projects": int,
                "total_downstream_budget_at_risk": float,
                "affected_projects": [
                    {
                        "project_name": str,
                        "dependency_type": str,
                        "cascading_delay_days": int,
                        "budget": float,
                        "criticality": "HIGH" | "MEDIUM"
                    }
                ],
                "impact_summary": str
            }
        """
        src_name = source_project.get("name") or f"Project #{source_project.get('id', 'X')}"
        src_delay = int(source_delay_days or source_project.get("predicted_delay_days") or 45)

        affected = []
        total_at_risk_budget = 0.0

        for dep in dependent_projects:
            dep_name = dep.get("name", "Dependent Project")
            dep_budget = float(dep.get("approved_budget") or 0.0)
            dep_type = dep.get("dependency_type", "Operational Prerequisite")
            coupling = float(dep.get("coupling_strength") or 0.75)  # 0.0 to 1.0

            cascade_delay = int(round(src_delay * coupling))
            total_at_risk_budget += dep_budget

            crit = "CRITICAL" if cascade_delay >= 45 else "HIGH" if cascade_delay >= 20 else "MODERATE"

            affected.append({
                "project_id": dep.get("id"),
                "project_name": dep_name,
                "department": dep.get("department", "General"),
                "dependency_type": dep_type,
                "cascading_delay_days": cascade_delay,
                "budget_at_risk": dep_budget,
                "criticality": crit,
            })

        summary = (
            f"Cascading Delay Alert: A projected delay of {src_delay} days in '{src_name}' "
            f"propagates downstream to {len(affected)} linked infrastructure projects, "
            f"placing ₹{total_at_risk_budget:,.0f} in capital investment at schedule risk."
        )

        return {
            "source_project": src_name,
            "source_delay_days": src_delay,
            "total_affected_projects": len(affected),
            "total_downstream_budget_at_risk": total_at_risk_budget,
            "affected_projects": affected,
            "impact_summary": summary,
        }


# Global singleton
_dependency_engine: DependencyImpactEngine = DependencyImpactEngine()


def get_dependency_engine() -> DependencyImpactEngine:
    return _dependency_engine

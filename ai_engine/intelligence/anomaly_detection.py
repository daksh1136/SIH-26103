"""
Anomaly and Data Integrity Detection Engine.
Combines Isolation Forest ML with deterministic domain integrity rules
to identify unusual reporting anomalies without making direct fraud accusations.
Labels flags as 'Potential anomaly — verification required'.
"""

import os
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from ai_engine.preprocessing.cleaner import clean_project_record


class AnomalyDetectionEngine:
    """
    Detects irregular project reporting patterns using Isolation Forest
    and statistical threshold envelopes.
    """

    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(base_dir, "..", "data", "trained_models")

        self.model_dir = model_dir
        self.iso_forest: Optional[IsolationForest] = None
        self._load_or_train()

    def _load_or_train(self):
        path = os.path.join(self.model_dir, "isolation_forest.joblib")
        if os.path.exists(path):
            try:
                self.iso_forest = joblib.load(path)
                return
            except Exception:
                pass

        # Fit a baseline Isolation Forest on synthetic normal envelope
        np.random.seed(42)
        n_normal = 1000
        # Normal projects: physical progress correlates closely with financial progress
        phys = np.random.uniform(5, 95, n_normal)
        fin = phys + np.random.normal(2, 6, n_normal)
        fin = np.clip(fin, 0, 100)
        gap = fin - phys

        X_normal = np.column_stack([phys, fin, gap])
        self.iso_forest = IsolationForest(contamination=0.05, random_state=42)
        self.iso_forest.fit(X_normal)

        try:
            os.makedirs(self.model_dir, exist_ok=True)
            joblib.dump(self.iso_forest, path)
        except Exception:
            pass

    def detect_anomalies(
        self,
        project_data: Dict[str, Any],
        historical_monthly_increase: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Evaluates project reporting integrity.
        Returns:
            {
                "is_anomaly": bool,
                "anomaly_score": float (0-100),
                "anomaly_level": "NORMAL" | "MODERATE" | "HIGH",
                "status_label": "Potential anomaly — verification required" | "Data Consistent",
                "detected_issues": List[str],
                "explanation": str
            }
        """
        cleaned = clean_project_record(project_data)
        phys = float(cleaned.get("physical_progress", 0.0))
        fin = float(cleaned.get("financial_progress", 0.0))
        budget = float(cleaned.get("approved_budget", 0.0))
        spend = float(cleaned.get("expenditure", 0.0))
        m_del = int(cleaned.get("milestones_delayed", 0) or 0)
        m_tot = max(int(cleaned.get("milestones_total", 1) or 1), 1)

        fin_gap = fin - phys
        budget_util = (spend / (budget + 1e-5)) * 100.0 if budget > 0 else fin

        issues: List[str] = []
        severity_score = 0.0

        # Check 1: Severe Financial vs Physical Gap (e.g. 92% financial vs 43% physical)
        if fin_gap >= 35.0:
            severity_score += 45.0
            issues.append(
                f"Significant Financial-Physical Discrepancy: Financial progress ({fin:.1f}%) "
                f"exceeds physical progress ({phys:.1f}%) by {fin_gap:.1f}%."
            )
        elif fin_gap >= 20.0:
            severity_score += 25.0
            issues.append(
                f"Notable Financial Lead: Financial progress is {fin_gap:.1f}% ahead of physical completion."
            )

        # Check 2: Budget Consumption Mismatch
        if budget_util > 85.0 and phys < 50.0:
            severity_score += 35.0
            issues.append(
                f"Disproportionate Budget Consumption: {budget_util:.1f}% of funds expended "
                f"while physical progress remains at {phys:.1f}%."
            )

        # Check 3: Abnormal Progress Jump relative to historical monthly increase
        reported_monthly_jump = cleaned.get("recent_progress_jump")
        if reported_monthly_jump is not None:
            jump = float(reported_monthly_jump)
            hist_rate = float(historical_monthly_increase or 3.0)
            if jump > 25.0 and jump > (hist_rate * 5):
                severity_score += 40.0
                issues.append(
                    f"Unusual Progress Acceleration: Reported monthly progress increase of {jump:.1f}% "
                    f"deviates sharply from historical average of {hist_rate:.1f}%."
                )

        # Check 4: Zero progress with substantial expenditure
        if phys <= 1.0 and spend > 1_000_000 and budget_util > 15.0:
            severity_score += 30.0
            issues.append(
                f"Expenditure with Nil Progress: {budget_util:.1f}% budget utilized but physical execution has not commenced."
            )

        # Check 5: Isolation Forest Score
        iso_flag = False
        if self.iso_forest is not None:
            try:
                vec = np.array([[phys, fin, fin_gap]])
                pred = self.iso_forest.predict(vec)[0]  # -1 is outlier
                if pred == -1:
                    iso_flag = True
                    severity_score += 20.0
            except Exception:
                pass

        if iso_flag and not issues:
            issues.append("Statistical Outlier: Progress-expenditure vector falls outside multi-variate density envelope.")

        anomaly_score = round(min(100.0, max(0.0, severity_score)), 1)
        is_anomaly = anomaly_score >= 35.0

        if anomaly_score >= 60.0:
            anomaly_level = "HIGH"
            status_label = "Potential anomaly — verification required"
            explanation = (
                f"High anomaly score ({anomaly_score}/100). The recorded indicators display substantial "
                f"inconsistencies requiring field verification by the supervisory officer."
            )
        elif anomaly_score >= 35.0:
            anomaly_level = "MODERATE"
            status_label = "Potential anomaly — verification required"
            explanation = (
                f"Moderate anomaly score ({anomaly_score}/100). Minor data divergence detected between financial "
                f"releases and physical milestones."
            )
        else:
            anomaly_level = "NORMAL"
            status_label = "Data Consistent"
            explanation = "Project progress and expenditure data conform to standard execution envelopes."

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "anomaly_level": anomaly_level,
            "status_label": status_label,
            "detected_issues": issues,
            "explanation": explanation,
            "metrics": {
                "physical_progress": phys,
                "financial_progress": fin,
                "financial_physical_gap": round(fin_gap, 1),
                "budget_utilization_pct": round(budget_util, 1),
            },
        }


# Global singleton
_anomaly_engine: Optional[AnomalyDetectionEngine] = None


def get_anomaly_engine() -> AnomalyDetectionEngine:
    global _anomaly_engine
    if _anomaly_engine is None:
        _anomaly_engine = AnomalyDetectionEngine()
    return _anomaly_engine

"""
Machine Learning Project Doom & Catastrophic Failure Prediction Model.
Trained on infrastructure project execution histories to identify early warning signatures
of terminal timeline collapse, massive budget overruns, and project abandonment.
"""

import os
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODEL_DIR = os.path.join(DATA_DIR, "trained_models")
DOOM_DATASET_PATH = os.path.join(DATA_DIR, "project_doom_dataset.csv")

DOOM_FEATURE_COLS = [
    "schedule_slippage_pct",       # expected_progress - physical_progress
    "financial_physical_gap",      # financial_progress - physical_progress
    "expenditure_burn_velocity",   # expenditure / approved_budget ratio
    "milestones_delayed_ratio",    # milestones_delayed / milestones_total
    "contractor_health_deficit",   # 100 - contractor_performance
    "resource_deficit",            # 100 - resource_availability
    "material_deficit",            # 100 - material_availability
    "previous_delays_count",       # count of past delayed phases
]


def generate_synthetic_doom_dataset(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic training data characterizing projects across health spectra:
    Healthy (40%), Moderately Strained (30%), Catastrophic Doom (30%).
    """
    np.random.seed(random_state)
    records = []

    for i in range(n_samples):
        # 0: Healthy, 1: Moderate, 2: Doomed
        archetype = np.random.choice([0, 1, 2], p=[0.40, 0.30, 0.30])

        if archetype == 0:
            # Healthy project
            slippage = max(0.0, np.random.normal(2.0, 3.0))
            fin_gap = np.random.normal(1.0, 4.0)
            burn_vel = np.random.uniform(0.1, 0.7)
            m_del_ratio = np.random.uniform(0.0, 0.15)
            cont_deficit = np.random.uniform(5.0, 20.0)
            res_deficit = np.random.uniform(5.0, 20.0)
            mat_deficit = np.random.uniform(5.0, 20.0)
            prev_delays = np.random.choice([0, 1], p=[0.85, 0.15])
            is_doomed = 0
            doom_level = "STABLE"

        elif archetype == 1:
            # Moderately strained
            slippage = max(5.0, np.random.normal(14.0, 5.0))
            fin_gap = max(5.0, np.random.normal(15.0, 6.0))
            burn_vel = np.random.uniform(0.5, 0.85)
            m_del_ratio = np.random.uniform(0.20, 0.45)
            cont_deficit = np.random.uniform(25.0, 45.0)
            res_deficit = np.random.uniform(25.0, 45.0)
            mat_deficit = np.random.uniform(25.0, 45.0)
            prev_delays = np.random.choice([1, 2], p=[0.6, 0.4])
            is_doomed = 0
            doom_level = "MODERATE_RISK"

        else:
            # Catastrophic Doom (terminal collapse / runaway cost)
            slippage = max(25.0, np.random.normal(38.0, 8.0))
            fin_gap = max(25.0, np.random.normal(45.0, 10.0))  # 90% funds spent, 45% built!
            burn_vel = np.random.uniform(0.85, 0.98)
            m_del_ratio = np.random.uniform(0.50, 0.90)       # Half or more milestones blown
            cont_deficit = np.random.uniform(45.0, 75.0)
            res_deficit = np.random.uniform(50.0, 75.0)
            mat_deficit = np.random.uniform(50.0, 75.0)
            prev_delays = np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3])
            is_doomed = 1
            doom_level = "CRITICAL_DOOM"

        records.append({
            "project_id": i + 1,
            "schedule_slippage_pct": round(slippage, 2),
            "financial_physical_gap": round(fin_gap, 2),
            "expenditure_burn_velocity": round(burn_vel, 3),
            "milestones_delayed_ratio": round(m_del_ratio, 3),
            "contractor_health_deficit": round(cont_deficit, 1),
            "resource_deficit": round(res_deficit, 1),
            "material_deficit": round(mat_deficit, 1),
            "previous_delays_count": int(prev_delays),
            "is_doomed": int(is_doomed),
            "doom_level": doom_level,
        })

    df = pd.DataFrame(records)
    return df


def train_project_doom_model(
    save_models: bool = True
) -> Tuple[RandomForestClassifier, StandardScaler, Dict[str, Any]]:
    """
    Trains and saves the Project Doom Classifier and Scaler.
    Returns: (classifier, scaler, metrics_dict)
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = generate_synthetic_doom_dataset(n_samples=1000, random_state=42)
    df.to_csv(DOOM_DATASET_PATH, index=False)

    X = df[DOOM_FEATURE_COLS]
    y = df["is_doomed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    y_proba = clf.predict_proba(X_test_scaled)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_proba))

    feature_importances = {
        col: float(imp)
        for col, imp in zip(DOOM_FEATURE_COLS, clf.feature_importances_)
    }

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "roc_auc": round(auc, 4),
        "total_samples": len(df),
        "feature_importances": feature_importances,
    }

    if save_models:
        joblib.dump(clf, os.path.join(MODEL_DIR, "project_doom_classifier.joblib"))
        joblib.dump(scaler, os.path.join(MODEL_DIR, "project_doom_scaler.joblib"))
        joblib.dump(metrics, os.path.join(MODEL_DIR, "project_doom_meta.joblib"))

    return clf, scaler, metrics


if __name__ == "__main__":
    print("Training Project Doom ML Classifier...")
    clf, scaler, metrics = train_project_doom_model(save_models=True)
    print("Training complete!")
    print(f"Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print("Top Feature Drivers for Project Dooming:")
    for f, imp in sorted(metrics['feature_importances'].items(), key=lambda x: x[1], reverse=True):
        print(f"  - {f}: {imp*100:.2f}%")

"""
Contractor Fraud & Eligibility Prediction Model.
Trains a supervised machine learning ensemble (RandomForest + Logistic Calibration)
to assess whether a contractor is eligible and safe to work on an infrastructure project,
or poses severe fraud, ghost-billing, or capacity default risks.
"""

import os
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODEL_DIR = os.path.join(DATA_DIR, "trained_models")
DATASET_PATH = os.path.join(DATA_DIR, "contractors_dataset.csv")

FEATURE_COLS = [
    "avg_cost_overrun_pct",
    "avg_delay_days",
    "on_time_delivery_rate",
    "ghost_billing_flags",
    "litigation_count",
    "shell_risk_score",
    "solvency_score",
    "max_budget_handled_cr",
    "budget_scale_ratio",
    "blacklisted",
]


def generate_synthetic_contractors_dataset(n_samples: int = 600, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic historical dataset of contractor track records,
    fraud audit findings, capacity scales, and ground-truth eligibility outcomes.
    """
    np.random.seed(random_state)
    records = []

    for i in range(n_samples):
        # Archetype distribution
        # 0: High-integrity Tier 1/2 (45%)
        # 1: Moderate/Average Tier 2/3 (25%)
        # 2: Capacity Over-extended / Under-capitalized (15%)
        # 3: Fraudulent / Ghost-Billing / Shell Entity (15%)
        archetype = np.random.choice([0, 1, 2, 3], p=[0.45, 0.25, 0.15, 0.15])

        if archetype == 0:
            # Pristine / High Integrity
            overrun = max(0.0, np.random.normal(3.0, 2.5))
            delay = max(0.0, np.random.normal(20.0, 15.0))
            delivery_rate = min(1.0, max(0.80, np.random.normal(0.92, 0.05)))
            ghost_flags = 0
            litigation = np.random.choice([0, 1], p=[0.85, 0.15])
            shell_risk = np.random.uniform(1.0, 15.0)
            solvency = np.random.uniform(75.0, 98.0)
            max_budget_cr = np.random.uniform(50.0, 500.0)
            budget_scale = np.random.uniform(0.3, 1.2)  # Well within capacity
            blacklisted = 0
            target_disqualified = 0
            target_tier = "APPROVED"

        elif archetype == 1:
            # Moderate / Conditional
            overrun = max(5.0, np.random.normal(18.0, 6.0))
            delay = max(20.0, np.random.normal(65.0, 25.0))
            delivery_rate = min(0.85, max(0.55, np.random.normal(0.70, 0.08)))
            ghost_flags = np.random.choice([0, 1], p=[0.80, 0.20])
            litigation = np.random.choice([1, 2, 3], p=[0.5, 0.35, 0.15])
            shell_risk = np.random.uniform(10.0, 35.0)
            solvency = np.random.uniform(55.0, 75.0)
            max_budget_cr = np.random.uniform(20.0, 100.0)
            budget_scale = np.random.uniform(0.8, 1.8)
            blacklisted = 0
            target_disqualified = 0 if ghost_flags == 0 and overrun < 25.0 else 1
            target_tier = "CONDITIONAL" if target_disqualified == 0 else "DISQUALIFIED"

        elif archetype == 2:
            # Capacity Over-extended (Small contractor bidding on mega project)
            overrun = max(10.0, np.random.normal(28.0, 10.0))
            delay = max(40.0, np.random.normal(110.0, 35.0))
            delivery_rate = min(0.75, max(0.40, np.random.normal(0.58, 0.10)))
            ghost_flags = np.random.choice([0, 1], p=[0.85, 0.15])
            litigation = np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2])
            shell_risk = np.random.uniform(15.0, 45.0)
            solvency = np.random.uniform(40.0, 65.0)
            max_budget_cr = np.random.uniform(5.0, 30.0)
            budget_scale = np.random.uniform(2.5, 8.0)  # Severe over-leverage
            blacklisted = 0
            target_disqualified = 1  # High default risk due to over-extension
            target_tier = "DISQUALIFIED"

        else:
            # Fraudulent / Ghost-Billing / Shell Entity
            overrun = max(30.0, np.random.normal(48.0, 12.0))
            delay = max(90.0, np.random.normal(220.0, 60.0))
            delivery_rate = min(0.50, max(0.10, np.random.normal(0.28, 0.10)))
            ghost_flags = np.random.choice([2, 3, 4, 5], p=[0.3, 0.35, 0.25, 0.1])
            litigation = np.random.choice([3, 4, 5, 7], p=[0.25, 0.35, 0.25, 0.15])
            shell_risk = np.random.uniform(65.0, 98.0)
            solvency = np.random.uniform(15.0, 42.0)
            max_budget_cr = np.random.uniform(10.0, 40.0)
            budget_scale = np.random.uniform(1.2, 5.0)
            blacklisted = np.random.choice([0, 1], p=[0.4, 0.6])
            target_disqualified = 1
            target_tier = "DISQUALIFIED"

        records.append({
            "contractor_id": i + 1,
            "avg_cost_overrun_pct": round(overrun, 2),
            "avg_delay_days": round(delay, 1),
            "on_time_delivery_rate": round(delivery_rate, 3),
            "ghost_billing_flags": int(ghost_flags),
            "litigation_count": int(litigation),
            "shell_risk_score": round(shell_risk, 1),
            "solvency_score": round(solvency, 1),
            "max_budget_handled_cr": round(max_budget_cr, 2),
            "budget_scale_ratio": round(budget_scale, 2),
            "blacklisted": int(blacklisted),
            "is_fraud_or_default": int(target_disqualified),
            "eligibility_tier": target_tier,
        })

    df = pd.DataFrame(records)
    return df


def train_contractor_fraud_model(
    save_models: bool = True
) -> Tuple[RandomForestClassifier, StandardScaler, Dict[str, Any]]:
    """
    Trains and saves the Contractor Fraud Classifier and Scaler.
    Returns: (classifier, scaler, metrics_dict)
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = generate_synthetic_contractors_dataset(n_samples=800, random_state=42)
    df.to_csv(DATASET_PATH, index=False)

    X = df[FEATURE_COLS]
    y = df["is_fraud_or_default"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=7,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = clf.predict(X_test_scaled)
    y_proba = clf.predict_proba(X_test_scaled)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_proba))

    feature_importances = {
        col: float(imp)
        for col, imp in zip(FEATURE_COLS, clf.feature_importances_)
    }

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_importances": feature_importances,
    }

    if save_models:
        joblib.dump(clf, os.path.join(MODEL_DIR, "contractor_fraud_classifier.joblib"))
        joblib.dump(scaler, os.path.join(MODEL_DIR, "contractor_scaler.joblib"))
        joblib.dump(metrics, os.path.join(MODEL_DIR, "contractor_model_meta.joblib"))

    return clf, scaler, metrics


if __name__ == "__main__":
    print("Training Contractor Fraud ML Model...")
    clf, scaler, metrics = train_contractor_fraud_model(save_models=True)
    print("Model Training Completed Successfully!")
    print(f"Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"Precision: {metrics['precision']*100:.2f}%")
    print(f"Recall:    {metrics['recall']*100:.2f}%")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print("\nFeature Importances:")
    for f, imp in sorted(metrics['feature_importances'].items(), key=lambda x: x[1], reverse=True):
        print(f"  - {f}: {imp*100:.2f}%")

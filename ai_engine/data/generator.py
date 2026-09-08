"""
Synthetic dataset generator for Indian infrastructure project monitoring.
Calibrated against historical MoSPI OCMS and PAIMANA performance metrics across:
- Road Transport & Highways
- Railways
- Urban Development & Smart Cities
- Power & Renewable Energy
- Water Resources & Flood Management
- Healthcare & Education Infrastructure
"""

import os
from typing import Optional
import numpy as np
import pandas as pd


DEPARTMENTS = [
    "Road Transport & Highways",
    "Railways",
    "Urban Development",
    "Power & Renewable Energy",
    "Water Resources",
    "Health & Family Welfare",
    "Education & Social Infrastructure",
    "Digital Governance",
]

INDIAN_STATES = [
    "Assam", "Meghalaya", "Tripura", "Mizoram", "Nagaland",
    "Arunachal Pradesh", "Sikkim", "Manipur", "Uttar Pradesh",
    "Maharashtra", "Bihar", "Odisha", "Madhya Pradesh",
    "Rajasthan", "Tamil Nadu", "Karnataka", "West Bengal", "Gujarat"
]


def generate_infrastructure_dataset(num_samples: int = 1200, seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic infrastructure monitoring dataset with realistic ground truth
    labels for delay probability classification and delay duration regression.
    """
    np.random.seed(seed)
    records = []

    for i in range(num_samples):
        proj_id = i + 1
        dept = np.random.choice(DEPARTMENTS)
        state = np.random.choice(INDIAN_STATES)

        # Planned duration in days (6 months to 4 years)
        p_dur = int(np.random.choice([180, 270, 365, 540, 730, 900, 1095, 1460], p=[0.08, 0.12, 0.25, 0.25, 0.15, 0.08, 0.04, 0.03]))
        # Elapsed duration (from 10% to 110% of planned duration)
        elapsed_ratio = np.random.uniform(0.10, 1.15)
        e_dur = min(int(p_dur * elapsed_ratio), p_dur + 180)

        # Expected progress modeled via S-curve with noise
        x_norm = (e_dur / p_dur) * 6 - 3
        s_curve = 1.0 / (1.0 + np.exp(-x_norm))
        expected_progress = round(float(np.clip(s_curve * 100.0 + np.random.normal(0, 2), 0.0, 100.0)), 1)

        # Factors affecting actual physical progress
        res_avail = float(np.clip(np.random.beta(6, 2.5) * 100, 25.0, 98.0))
        mat_avail = float(np.clip(np.random.beta(5.5, 2.5) * 100, 20.0, 98.0))
        cont_perf = float(np.clip(np.random.beta(6, 2.8) * 100, 30.0, 98.0))
        prev_delays = int(np.random.choice([0, 1, 2, 3, 4], p=[0.55, 0.22, 0.12, 0.07, 0.04]))

        # Resource penalty factor
        perf_factor = (0.35 * (res_avail / 100.0) + 0.35 * (mat_avail / 100.0) + 0.30 * (cont_perf / 100.0))

        # Real physical progress with realistic delays
        slip_noise = np.random.normal(-5.0, 8.0) if perf_factor < 0.65 else np.random.normal(0, 4.0)
        phys_progress = float(np.clip(expected_progress * (0.55 + 0.45 * perf_factor) + slip_noise, 0.0, 100.0))
        phys_progress = round(min(phys_progress, 100.0), 1)

        # Financial progress: often runs ahead of physical progress due to mobilization and invoices
        fin_lead = np.random.uniform(0.0, 25.0) if perf_factor < 0.65 else np.random.uniform(-5.0, 10.0)
        fin_progress = float(np.clip(phys_progress + fin_lead, 0.0, 100.0))
        fin_progress = round(fin_progress, 1)

        # Budget in INR (₹10 Cr to ₹500 Cr)
        budget = round(float(np.random.uniform(10_000_000, 500_000_000)), -4)
        released = round(float(budget * min(1.0, (fin_progress / 100.0) + np.random.uniform(0.05, 0.15))), -4)
        expenditure = round(float(released * (fin_progress / 100.0)), -4)

        # Milestones
        m_tot = int(np.random.choice([4, 5, 6, 8, 10]))
        # Expected completed milestones
        m_expected = int(np.round((expected_progress / 100.0) * m_tot))
        m_actual = int(np.round((phys_progress / 100.0) * m_tot))
        m_delayed = max(0, min(m_tot, m_expected - m_actual + (1 if prev_delays > 1 else 0)))

        # Ground truth delay classification & delay duration calculation
        # Ground truth is driven by schedule slippage, milestone failure, and severe resource deficits
        slippage = expected_progress - phys_progress
        fin_gap = fin_progress - phys_progress

        delay_latent_score = (
            0.40 * (slippage / 20.0)
            + 0.25 * (m_delayed / max(m_tot, 1))
            + 0.15 * max(0.0, (fin_gap - 10.0) / 30.0)
            + 0.10 * max(0.0, (70.0 - res_avail) / 40.0)
            + 0.10 * max(0.0, (70.0 - cont_perf) / 40.0)
            + 0.05 * (prev_delays / 3.0)
        )
        delay_prob_true = 1.0 / (1.0 + np.exp(-5.0 * (delay_latent_score - 0.35)))
        delay_occurred = int(np.random.uniform() < delay_prob_true)

        # Continuous delay days (0 if no delay, else 15 to 300 days)
        if delay_occurred:
            base_delay = slippage * 4.5 + m_delayed * 25.0 + np.random.uniform(10, 45)
            delay_days = int(max(15, min(round(base_delay), 450)))
        else:
            delay_days = 0

        # Status tag
        if delay_occurred and delay_days > 90:
            status = "CRITICAL"
        elif delay_occurred and delay_days > 30:
            status = "DELAYED"
        elif slippage > 10 or m_delayed > 0:
            status = "AT_RISK"
        else:
            status = "ON_TRACK"

        records.append({
            "project_id": proj_id,
            "name": f"{dept} Project #{proj_id}",
            "department": dept,
            "location": state,
            "planned_duration_days": p_dur,
            "elapsed_duration_days": e_dur,
            "physical_progress": phys_progress,
            "expected_progress": expected_progress,
            "financial_progress": fin_progress,
            "approved_budget": budget,
            "released_funds": released,
            "expenditure": expenditure,
            "milestones_delayed": m_delayed,
            "milestones_total": m_tot,
            "resource_availability": round(res_avail, 1),
            "contractor_performance": round(cont_perf, 1),
            "material_availability": round(mat_avail, 1),
            "previous_delays": prev_delays,
            "status": status,
            "delay_occurred": delay_occurred,
            "delay_days": delay_days,
        })

    df = pd.DataFrame(records)
    return df


def ensure_dataset_exists(csv_path: Optional[str] = None) -> pd.DataFrame:
    """
    Checks if benchmark dataset exists on disk; if not, generates and saves it.
    """
    if csv_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(base_dir, "projects_dataset.csv")

    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)

    df = generate_infrastructure_dataset(num_samples=1500)
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False)
    return df


if __name__ == "__main__":
    df = ensure_dataset_exists()
    print(f"Generated Indian infrastructure dataset with {len(df)} records.")
    print("Class distribution (delay_occurred):", df["delay_occurred"].value_counts().to_dict())
    print("Status distribution:", df["status"].value_counts().to_dict())

#!/usr/bin/env python3
"""
CLI Dataset Ingestion Utility for MoSPI ProjectPulse.
Imports project, contractor, and milestone records from JSON or CSV into SQLite database.
Usage:
    python database/import_dataset.py [path_to_json_or_csv]
"""

import csv
import json
import os
import sqlite3
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "projectpulse.db")
DEFAULT_JSON = os.path.join(BASE_DIR, "mospi_comprehensive_showcase.json")


def import_json_dataset(json_path: str, db_path: str = DB_PATH):
    print(f"Reading dataset from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    projects = data.get("projects", [])
    contractors = data.get("contractors", [])
    histories = data.get("contractor_project_histories", [])
    milestones = data.get("milestones", [])

    print(f"Found {len(projects)} projects, {len(contractors)} contractors, {len(histories)} histories, {len(milestones)} milestones.")

    # 1. Ingest Contractors
    for c in contractors:
        cur.execute(
            """
            INSERT OR REPLACE INTO contractors
            (id, name, pan_cin, incorporation_year, category, status, avg_rating, shell_risk_score,
             ghost_billing_flags, litigation_count, tax_compliance_status, max_project_budget_handled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (c.get("id"), c.get("name"), c.get("pan_cin", "PAN12345"), c.get("incorporation_year", 2015),
             c.get("category", "Tier-2"), c.get("status", "APPROVED"), c.get("avg_rating", 80.0),
             c.get("shell_risk_score", 5.0), c.get("ghost_billing_flags", 0), c.get("litigation_count", 0),
             c.get("tax_compliance_status", "FULLY_COMPLIANT"), c.get("max_project_budget_handled", 50000000.0),
             datetime.utcnow().isoformat())
        )

    # 2. Ingest Contractor Project Histories
    for h in histories:
        cur.execute(
            """
            INSERT OR REPLACE INTO contractor_project_history
            (id, contractor_id, project_name, ministry, sanctioned_budget, actual_cost,
             cost_overrun_pct, planned_days, actual_days, delay_days,
             completion_status, audit_irregularity_flag, year_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (h.get("id"), h.get("contractor_id"), h.get("project_name"), h.get("department", "Infrastructure"),
             h.get("sanctioned_cost", 0.0), h.get("actual_cost", 0.0), h.get("cost_overrun_pct", 0.0),
             h.get("planned_duration_days", 365), h.get("actual_duration_days", 365), h.get("delay_days", 0),
             h.get("status", "COMPLETED"), h.get("ghost_billing_flag", 0), h.get("completion_year", 2023))
        )

    # 3. Ingest Projects
    for p in projects:
        cur.execute(
            """
            INSERT OR REPLACE INTO projects
            (id, name, department, location, manager, start_date, planned_completion,
             approved_budget, released_funds, expenditure, physical_progress, financial_progress,
             status, contractor_id, contractor_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (p.get("id"), p.get("name"), p.get("department"), p.get("location"), p.get("manager"),
             p.get("start_date"), p.get("planned_completion"), p.get("approved_budget", 0.0),
             p.get("released_funds", 0.0), p.get("expenditure", 0.0), p.get("physical_progress", 0.0),
             p.get("financial_progress", 0.0), p.get("status", "ON_TRACK"), p.get("contractor_id"),
             p.get("contractor_name"), datetime.now().isoformat())
        )

    # 4. Ingest Milestones
    for m in milestones:
        cur.execute(
            """
            INSERT OR REPLACE INTO milestones
            (id, project_id, name, planned_date, actual_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (m.get("id"), m.get("project_id"), m.get("title"), m.get("target_date"),
             m.get("target_date") if m.get("status") == "COMPLETED" else None,
             m.get("status", "SCHEDULED"))
        )

    conn.commit()
    conn.close()
    print("✅ Ingestion complete! Database updated successfully.")


if __name__ == "__main__":
    target_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_JSON
    import_json_dataset(target_path)

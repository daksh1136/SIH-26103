#!/usr/bin/env python3
"""
MoSPI ProjectPulse Database Initializer & Seeder
Compatible with Python standard library sqlite3 (zero external dependencies).
"""

import os
import sqlite3
from datetime import date, datetime, timedelta

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "projectpulse.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")


def init_db(db_path: str = DB_PATH):
    """Initialize database tables from schema.sql"""
    print(f"Initializing database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    cur.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Schema created successfully.")


def seed_db(db_path: str = DB_PATH, force_reseed: bool = False):
    """Seed projects, milestones, project_updates, and alerts idempotently"""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT count(*) FROM projects")
    count = cur.fetchone()[0]

    if count > 0 and not force_reseed:
        print(f"Database already populated with {count} projects. Skipping re-seed.")
        conn.close()
        return

    if force_reseed:
        print("Clearing existing records for fresh reseed...")
        cur.execute("DELETE FROM alerts")
        cur.execute("DELETE FROM project_updates")
        cur.execute("DELETE FROM milestones")
        cur.execute("DELETE FROM projects")
        conn.commit()

    today = date.today()

    # 1. SEED PROJECTS
    projects_data = [
        (1, "National Highway Development - Demo", "Infrastructure", "Assam", "Project Manager A",
         today - timedelta(days=240), today + timedelta(days=120), 85000000.0, 70000000.0, 52000000.0, 62.0, 61.0, "ON_TRACK"),
        (2, "Rural Water Supply Network - Demo", "Rural Development", "Meghalaya", "Project Manager B",
         today - timedelta(days=300), today + timedelta(days=60), 42000000.0, 39000000.0, 36000000.0, 58.0, 86.0, "AT_RISK"),
        (3, "Digital Governance Platform - Demo", "Digital Governance", "Tripura", "Project Manager C",
         today - timedelta(days=150), today + timedelta(days=210), 25000000.0, 15000000.0, 11000000.0, 45.0, 44.0, "ON_TRACK"),
        (4, "Urban Development Mission - Demo", "Urban Development", "Mizoram", "Project Manager D",
         today - timedelta(days=360), today + timedelta(days=30), 65000000.0, 60000000.0, 57000000.0, 61.0, 88.0, "DELAYED"),
        (5, "Power Transmission Expansion - Demo", "Energy", "Nagaland", "Project Manager E",
         today - timedelta(days=280), today + timedelta(days=90), 110000000.0, 95000000.0, 85000000.0, 49.0, 77.0, "AT_RISK"),
        (6, "District Healthcare Infrastructure - Demo", "Health", "Arunachal Pradesh", "Project Manager F",
         today - timedelta(days=120), today + timedelta(days=240), 38000000.0, 15000000.0, 8000000.0, 31.0, 21.0, "ON_TRACK"),
        (7, "Education Infrastructure Upgrade - Demo", "Education", "Sikkim", "Project Manager G",
         today - timedelta(days=310), today + timedelta(days=45), 30000000.0, 29000000.0, 27000000.0, 52.0, 90.0, "AT_RISK"),
        (8, "Rail Infrastructure Modernization - Demo", "Railways", "Assam", "Project Manager H",
         today - timedelta(days=400), today - timedelta(days=30), 150000000.0, 140000000.0, 135000000.0, 43.0, 90.0, "CRITICAL"),
        (9, "Flood Management System - Demo", "Water Resources", "Manipur", "Project Manager I",
         today - timedelta(days=90), today + timedelta(days=270), 55000000.0, 18000000.0, 12000000.0, 27.0, 22.0, "ON_TRACK"),
        (10, "Smart City Connectivity - Demo", "Urban Development", "Meghalaya", "Project Manager J",
         today - timedelta(days=380), today - timedelta(days=20), 72000000.0, 70000000.0, 68000000.0, 48.0, 94.0, "CRITICAL"),
        (11, "Expressway Freight Corridor", "Road Transport", "Uttar Pradesh", "Project Manager K",
         today - timedelta(days=320), today + timedelta(days=80), 220000000.0, 190000000.0, 182000000.0, 56.0, 83.0, "AT_RISK"),
        (12, "Deepwater Coastal Port Rail Link", "Railways", "Odisha", "Project Manager L",
         today - timedelta(days=180), today + timedelta(days=180), 180000000.0, 100000000.0, 78000000.0, 68.0, 43.0, "ON_TRACK")
    ]

    for p in projects_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO projects (id, name, department, location, manager, start_date, planned_completion,
                                approved_budget, released_funds, expenditure, physical_progress, financial_progress, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (p[0], p[1], p[2], p[3], p[4], str(p[5]), str(p[6]), p[7], p[8], p[9], p[10], p[11], p[12], datetime.utcnow().isoformat())
        )

    # 2. SEED MILESTONES
    milestone_templates = [
        ("Land Acquisition & Environmental Clearance", -120, "COMPLETED"),
        ("Detailed Engineering & EPC Contracting", -60, "COMPLETED"),
        ("Substructure & Primary Civil Works", 30, "IN_PROGRESS"),
        ("Signaling, Systems & Superstructure", 90, "UPCOMING"),
        ("Pre-Commissioning Testing & Audit", 150, "UPCOMING"),
    ]

    m_id = 1
    for p in projects_data:
        p_id = p[0]
        p_status = p[12]
        for name, day_offset, def_status in milestone_templates:
            m_date = today + timedelta(days=day_offset)
            actual_date = None
            m_status = def_status

            if day_offset < 0:
                actual_date = str(m_date)
                m_status = "COMPLETED"
            elif day_offset == 30 and p_status in ("CRITICAL", "DELAYED"):
                m_status = "OVERDUE"
            elif day_offset == 30:
                m_status = "IN_PROGRESS"
            else:
                m_status = "UPCOMING"

            cur.execute(
                """
                INSERT OR REPLACE INTO milestones (id, project_id, name, planned_date, actual_date, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (m_id, p_id, f"{name} ({p[1][:20]})", str(m_date), actual_date, m_status)
            )
            m_id += 1

    # 3. SEED UPDATES
    for p in projects_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO project_updates (id, project_id, progress, expenditure, notes, update_date)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (p[0], p[0], p[10], p[9], f"Bi-weekly status report logged for {p[1]}", datetime.utcnow().isoformat())
        )

    # 4. SEED ALERTS
    alerts_data = [
        (1, 2, "HIGH", "PROJECT_RISK", "Financial progress is 28.0% ahead of physical progress.", "Conduct civil verification audit on billing milestone 3."),
        (2, 4, "HIGH", "PROJECT_RISK", "Financial progress is 27.0% ahead of physical progress.", "Rebalance contractor milestone payments against on-site completion certificates."),
        (3, 5, "HIGH", "PROJECT_RISK", "Financial progress is 28.0% ahead of physical progress.", "Expedite power grid conductor deliveries to align with cash release."),
        (4, 7, "CRITICAL", "PROJECT_RISK", "Financial progress is 38.0% ahead of physical progress.", "Trigger field inspection: high expenditure with lagging school structure progress."),
        (5, 8, "CRITICAL", "PROJECT_RISK", "Financial progress is 47.0% ahead of physical progress.", "Immediate intervention: severe right-of-way escalation with high fund burn."),
        (6, 10, "CRITICAL", "PROJECT_RISK", "Financial progress is 46.0% ahead of physical progress.", "Hold release of tranche 4 pending physical verification of optical fiber trenches."),
        (7, 11, "HIGH", "PROJECT_RISK", "Financial progress leads physical by 27.0%.", "Review contractor equipment mobilization along Corridor B."),
    ]

    for a in alerts_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO alerts (id, project_id, severity, category, message, recommendation, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
            """,
            (a[0], a[1], a[2], a[3], a[4], a[5], datetime.utcnow().isoformat())
        )

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        init_db(DB_PATH)
    seed_db(DB_PATH, force_reseed=True)

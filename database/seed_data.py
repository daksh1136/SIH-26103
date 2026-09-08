#!/usr/bin/env python3
"""
MoSPI ProjectPulse Database Initializer & Seeder
Includes Projects, Milestones, Project Updates, Alerts,
and Contractor Track Record & Fraud Due Diligence Profiles.
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
    """Seed projects, contractors, contractor_histories, milestones, updates, and alerts idempotently"""
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
        cur.execute("DELETE FROM contractor_project_history")
        cur.execute("DELETE FROM contractors")
        cur.execute("DELETE FROM projects")
        conn.commit()

    today = date.today()

    # 1. SEED CONTRACTORS MASTER
    contractors_data = [
        (1, "Larsen & Mega Infrastructure Ltd", "AAACL1234F", 2004, "Tier-1", "APPROVED", 94.5, 3.2, 0, 0, "FULLY_COMPLIANT", 500000000.0),
        (2, "National Bridge & Tunnel Engineering Corp", "AABCN5678K", 2008, "Tier-1", "APPROVED", 91.0, 4.5, 0, 1, "FULLY_COMPLIANT", 350000000.0),
        (3, "Brahmaputra Engineering Works", "AAEFB9012M", 2012, "Tier-2", "APPROVED", 84.0, 8.0, 0, 0, "FULLY_COMPLIANT", 90000000.0),
        (4, "Eastern Regional Infra Solutions", "AACCE3456P", 2015, "Tier-2", "APPROVED", 80.5, 11.5, 0, 1, "FULLY_COMPLIANT", 60000000.0),
        (5, "Pinnacle Urban Civil Contractors", "AABCP7890Q", 2016, "Tier-2", "APPROVED", 76.0, 14.0, 0, 2, "COMPLIANT", 45000000.0),
        (6, "Hillside Constructions & Earthmovers", "AABCH2345R", 2018, "Tier-3", "WATCHLIST", 62.0, 26.5, 1, 3, "UNDER_SCRUTINY", 25000000.0),
        (7, "Vanguard Power & Utility Infra", "AACCV6789S", 2011, "Tier-2", "APPROVED", 82.5, 9.5, 0, 1, "FULLY_COMPLIANT", 120000000.0),
        (8, "Apex Shell Engineering Consortium", "AAXCA1122T", 2021, "Tier-3", "DISQUALIFIED", 28.0, 88.5, 4, 5, "DEFAULT_SUSPENDED", 20000000.0),
        (9, "Shadow Ridge Mega Projects Pvt Ltd", "AAXCS3344U", 2020, "Tier-3", "DISQUALIFIED", 34.0, 79.0, 3, 4, "DEFAULT_SUSPENDED", 15000000.0),
        (10, "Sunrise Smart Grid Technologies", "AABCS5566V", 2017, "Tier-2", "APPROVED", 88.0, 5.0, 0, 0, "FULLY_COMPLIANT", 80000000.0),
    ]

    for c in contractors_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO contractors (id, name, pan_cin, incorporation_year, category, status,
                                                avg_rating, shell_risk_score, ghost_billing_flags, litigation_count,
                                                tax_compliance_status, max_project_budget_handled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11], datetime.utcnow().isoformat())
        )

    # 2. SEED CONTRACTOR PROJECT HISTORIES
    histories_data = [
        # Contractor 1: Larsen & Mega (Tier-1, pristine record)
        (1, 1, "Eastern Peripheral Expressway Sec 4", "Road Transport", 320000000.0, 328000000.0, 2.5, 720, 740, 20, "COMPLETED", 0, 2023),
        (2, 1, "Brahmaputra Major Cable Stayed Bridge", "Infrastructure", 450000000.0, 465000000.0, 3.3, 900, 935, 35, "COMPLETED", 0, 2024),
        (3, 1, "Kolkata Metro Extension Lot 2", "Railways", 280000000.0, 282000000.0, 0.7, 600, 610, 10, "COMPLETED", 0, 2022),

        # Contractor 2: National Bridge & Tunnel Corp (Tier-1, high capability)
        (4, 2, "Himalayan Tunnel Package 3", "Railways", 300000000.0, 318000000.0, 6.0, 850, 910, 60, "COMPLETED", 0, 2023),
        (5, 2, "Coastal Viaduct Rail Overbridge", "Railways", 160000000.0, 166000000.0, 3.7, 540, 565, 25, "COMPLETED", 0, 2024),
        (6, 2, "Teesta River Rail Link", "Railways", 210000000.0, 219000000.0, 4.3, 620, 650, 30, "COMPLETED", 0, 2022),

        # Contractor 3: Brahmaputra Engineering Works (Tier-2 regional, good water/road)
        (7, 3, "Guwahati Water Distribution Phase 1", "Rural Development", 55000000.0, 58000000.0, 5.4, 480, 510, 30, "COMPLETED", 0, 2023),
        (8, 3, "Barpeta Embankment Protection", "Water Resources", 40000000.0, 41500000.0, 3.7, 360, 380, 20, "COMPLETED", 0, 2024),
        (9, 3, "Tezpur Rural Road Ring", "Rural Development", 32000000.0, 33000000.0, 3.1, 300, 312, 12, "COMPLETED", 0, 2022),

        # Contractor 4: Eastern Regional Infra Solutions (Tier-2, tech/health)
        (10, 4, "Tripura E-Seva Datacenter Staging", "Digital Governance", 22000000.0, 22500000.0, 2.3, 240, 250, 10, "COMPLETED", 0, 2023),
        (11, 4, "Itanagar District Diagnostic Wing", "Health", 34000000.0, 36000000.0, 5.9, 360, 390, 30, "COMPLETED", 0, 2024),

        # Contractor 5: Pinnacle Urban Civil Contractors (Tier-2, moderate urban)
        (12, 5, "Shillong Municipal Drain Renovation", "Urban Development", 38000000.0, 44000000.0, 15.8, 360, 430, 70, "COMPLETED", 0, 2023),
        (13, 5, "Aizawl North Arterial Flyover", "Urban Development", 45000000.0, 52000000.0, 15.5, 420, 510, 90, "COMPLETED", 0, 2024),

        # Contractor 6: Hillside Constructions (Tier-3, Watchlist - overruns & disputes)
        (14, 6, "Gangtok Model School Renovation", "Education", 18000000.0, 24500000.0, 36.1, 270, 390, 120, "COMPLETED", 1, 2023),
        (15, 6, "Pelling Water Storage Sump", "Rural Development", 12000000.0, 15800000.0, 31.7, 210, 305, 95, "COMPLETED", 0, 2024),

        # Contractor 7: Vanguard Power & Utility Infra (Tier-2, strong energy)
        (16, 7, "Dimapur 220kV Substation Switchyard", "Energy", 95000000.0, 99000000.0, 4.2, 480, 505, 25, "COMPLETED", 0, 2023),
        (17, 7, "Kohima Ring Power Transmission Line", "Energy", 75000000.0, 78500000.0, 4.7, 420, 440, 20, "COMPLETED", 0, 2024),

        # Contractor 8: Apex Shell Engineering (Tier-3, DISQUALIFIED - ghost invoices & audit failure)
        (18, 8, "Nagaon Rural Health Centre Package", "Health", 15000000.0, 22000000.0, 46.7, 240, 480, 240, "TERMINATED", 1, 2023),
        (19, 8, "Cachar Canal Desilting Works", "Water Resources", 12000000.0, 18500000.0, 54.2, 180, 390, 210, "TERMINATED", 1, 2024),
        (20, 8, "Silchar Municipal Road Patching", "Urban Development", 8000000.0, 11500000.0, 43.8, 120, 260, 140, "TERMINATED", 1, 2022),

        # Contractor 9: Shadow Ridge Mega Projects (Tier-3, DISQUALIFIED - debarred, sub-standard materials)
        (21, 9, "Khonsa Mountain Access Road", "Infrastructure", 14000000.0, 20000000.0, 42.9, 210, 420, 210, "TERMINATED", 1, 2023),
        (22, 9, "Tawang Secondary School Hostel", "Education", 11000000.0, 16200000.0, 47.3, 180, 340, 160, "TERMINATED", 1, 2024),

        # Contractor 10: Sunrise Smart Grid Technologies (Tier-2, tech smart grid)
        (23, 10, "Imphal Smart Metering Rollout", "Energy", 45000000.0, 46500000.0, 3.3, 300, 315, 15, "COMPLETED", 0, 2023),
        (24, 10, "Shillong Traffic Sensor Integration", "Urban Development", 28000000.0, 29000000.0, 3.6, 240, 250, 10, "COMPLETED", 0, 2024),
    ]

    for h in histories_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO contractor_project_history (id, contractor_id, project_name, ministry,
                                                               sanctioned_budget, actual_cost, cost_overrun_pct,
                                                               planned_days, actual_days, delay_days,
                                                               completion_status, audit_irregularity_flag, year_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], h[8], h[9], h[10], h[11], h[12])
        )

    # 3. SEED PROJECTS (linked to contractors)
    projects_data = [
        (1, "National Highway Development - Demo", "Infrastructure", "Assam", "Project Manager A",
         today - timedelta(days=240), today + timedelta(days=120), 85000000.0, 70000000.0, 52000000.0, 62.0, 61.0, "ON_TRACK",
         1, "Larsen & Mega Infrastructure Ltd"),
        (2, "Rural Water Supply Network - Demo", "Rural Development", "Meghalaya", "Project Manager B",
         today - timedelta(days=300), today + timedelta(days=60), 42000000.0, 39000000.0, 36000000.0, 58.0, 86.0, "AT_RISK",
         3, "Brahmaputra Engineering Works"),
        (3, "Digital Governance Platform - Demo", "Digital Governance", "Tripura", "Project Manager C",
         today - timedelta(days=150), today + timedelta(days=210), 25000000.0, 15000000.0, 11000000.0, 45.0, 44.0, "ON_TRACK",
         4, "Eastern Regional Infra Solutions"),
        (4, "Urban Development Mission - Demo", "Urban Development", "Mizoram", "Project Manager D",
         today - timedelta(days=360), today + timedelta(days=30), 65000000.0, 60000000.0, 57000000.0, 61.0, 88.0, "DELAYED",
         5, "Pinnacle Urban Civil Contractors"),
        (5, "Power Transmission Expansion - Demo", "Energy", "Nagaland", "Project Manager E",
         today - timedelta(days=280), today + timedelta(days=90), 110000000.0, 95000000.0, 85000000.0, 49.0, 77.0, "AT_RISK",
         7, "Vanguard Power & Utility Infra"),
        (6, "District Healthcare Infrastructure - Demo", "Health", "Arunachal Pradesh", "Project Manager F",
         today - timedelta(days=120), today + timedelta(days=240), 38000000.0, 15000000.0, 8000000.0, 31.0, 21.0, "ON_TRACK",
         4, "Eastern Regional Infra Solutions"),
        (7, "Education Infrastructure Upgrade - Demo", "Education", "Sikkim", "Project Manager G",
         today - timedelta(days=310), today + timedelta(days=45), 30000000.0, 29000000.0, 27000000.0, 52.0, 90.0, "AT_RISK",
         6, "Hillside Constructions & Earthmovers"),
        (8, "Rail Infrastructure Modernization - Demo", "Railways", "Assam", "Project Manager H",
         today - timedelta(days=400), today - timedelta(days=30), 150000000.0, 140000000.0, 135000000.0, 43.0, 90.0, "CRITICAL",
         2, "National Bridge & Tunnel Engineering Corp"),
        (9, "Flood Management System - Demo", "Water Resources", "Manipur", "Project Manager I",
         today - timedelta(days=90), today + timedelta(days=270), 55000000.0, 18000000.0, 12000000.0, 27.0, 22.0, "ON_TRACK",
         3, "Brahmaputra Engineering Works"),
        (10, "Smart City Connectivity - Demo", "Urban Development", "Meghalaya", "Project Manager J",
         today - timedelta(days=380), today - timedelta(days=20), 72000000.0, 70000000.0, 68000000.0, 48.0, 94.0, "CRITICAL",
         5, "Pinnacle Urban Civil Contractors"),
        (11, "Expressway Freight Corridor", "Road Transport", "Uttar Pradesh", "Project Manager K",
         today - timedelta(days=320), today + timedelta(days=80), 220000000.0, 190000000.0, 182000000.0, 56.0, 83.0, "AT_RISK",
         1, "Larsen & Mega Infrastructure Ltd"),
        (12, "Deepwater Coastal Port Rail Link", "Railways", "Odisha", "Project Manager L",
         today - timedelta(days=180), today + timedelta(days=180), 180000000.0, 100000000.0, 78000000.0, 68.0, 43.0, "ON_TRACK",
         2, "National Bridge & Tunnel Engineering Corp")
    ]

    for p in projects_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO projects (id, name, department, location, manager, start_date, planned_completion,
                                approved_budget, released_funds, expenditure, physical_progress, financial_progress, status,
                                contractor_id, contractor_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (p[0], p[1], p[2], p[3], p[4], str(p[5]), str(p[6]), p[7], p[8], p[9], p[10], p[11], p[12], p[13], p[14], datetime.utcnow().isoformat())
        )

    # 4. SEED MILESTONES
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

    # 5. SEED UPDATES
    for p in projects_data:
        cur.execute(
            """
            INSERT OR REPLACE INTO project_updates (id, project_id, progress, expenditure, notes, update_date)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (p[0], p[0], p[10], p[9], f"Bi-weekly status report logged for {p[1]}", datetime.utcnow().isoformat())
        )

    # 6. SEED ALERTS
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
    print("Database seeding completed successfully with Contractors and Historical Records!")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        init_db(DB_PATH)
    else:
        # Re-initialize to ensure new tables exist
        init_db(DB_PATH)
    seed_db(DB_PATH, force_reseed=True)

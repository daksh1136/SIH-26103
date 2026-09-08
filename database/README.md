# MoSPI ProjectPulse Database Subsystem

## Overview
This directory contains the database schema, relational SQLite database, and automated seeder for the **MoSPI Web-Based Integrated Project-Monitoring Platform (SIH26103)**.

## Schema Structure
The schema is defined in [`schema.sql`](schema.sql) and consists of 4 relational entities:

1. **`projects`**: Core register of monitored infrastructure projects.
   - `id`, `name`, `department`, `location`, `manager`, `start_date`, `planned_completion`, `approved_budget`, `released_funds`, `expenditure`, `physical_progress`, `financial_progress`, `status`, `created_at`
2. **`milestones`**: Key critical-path activities tied to projects.
   - `id`, `project_id` (FK), `name`, `planned_date`, `actual_date`, `status`
3. **`project_updates`**: Periodic physical and expenditure progress logs.
   - `id`, `project_id` (FK), `progress`, `expenditure`, `notes`, `update_date`
4. **`alerts`**: System-generated and AI-driven early warning escalations.
   - `id`, `project_id` (FK), `severity`, `category`, `message`, `recommendation`, `status`, `created_at`

## Quick Start / Seeding
To initialize or reset the database with standard national infrastructure projects:

```bash
python3 database/seed_data.py
```

The database file will be created at `database/projectpulse.db`.

## Connection Configuration
Backend services connect to this database via the dynamic connection string:
- **Default path**: `sqlite:///../database/projectpulse.db`
- **Override**: Set the `DATABASE_URL` environment variable.

# ProjectPulse 🚀

## SIH26103 — MoSPI Web-Based Integrated Project-Monitoring Platform

ProjectPulse is an enterprise-grade, AI-powered project monitoring and decision intelligence platform built for the **SIH26103** problem statement by the **Ministry of Statistics and Programme Implementation (MoSPI)**.

The platform transforms infrastructure monitoring from passive retrospective reporting into proactive, predictive governance through explainable ML risk analysis (SHAP), dynamic 0–100 health scoring, What-If policy intervention simulation, unsupervised anomaly screening, and conversational intelligence.

---

## 🏗️ Platform Architecture

```
SIH-26103/
├── frontend/               # React 19 + Vite: Executive Dashboard, What-If Lab, GIS, AI Assistant
├── backend/                # FastAPI Gateway: Project APIs, Milestones, Alerts, & AI Bridge
├── database/               # Relational SQLite DB (projectpulse.db), Schema DDL, & Python Seeder
└── ai_engine/              # Standalone Intelligence: Random Forest, XGBoost, Isolation Forest, SHAP
```

---

## 🎯 Key Intelligence Capabilities

1. **National Executive Dashboard & KPIs**: Monitored capital outlay, physical vs. financial execution gap alert callouts, and priority intervention queues.
2. **Dynamic 0–100 Health Score**: 6-component weighted scoring across Schedule (25%), Physical (25%), Financial (15%), Milestones (15%), Resources (10%), and Contractor Performance (10%).
3. **What-If Intervention Simulator**: Real-time policy modeling for funding (+0–50%), contractor manpower (+0–60%), materials (+0–50%), and schedule extensions (+0–180 days) with quantified delay reduction and calendar days saved.
4. **Explainable AI (SHAP Factor Attribution)**: Precise quantitative breakdown of delay risk drivers (Right-of-Way disputes, utility shifting, material price volatility).
5. **Unsupervised Anomaly Screening**: Isolation Forest detection of progress-expenditure decoupling and reporting irregularities adhering to MoSPI non-accusatory protocols.
6. **Infrastructure Dependency Network**: Cascading delay analysis modeling upstream prerequisite linkages to downstream industrial hubs.
7. **GIS Regional Risk Intelligence**: State-wise risk concentration and capital distribution profiles.
8. **MoSPI AI Project Assistant**: Conversational grounded Q&A over live database projects and risk diagnostics.

---

## 🚀 How to Run the Complete Platform

### 1. Database Setup & Seeding
```bash
python3 database/seed_data.py
```

### 2. Run Backend Service (FastAPI)
```bash
cd backend
./run.sh
# or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Documentation & Swagger UI available at:* **`http://localhost:8000/docs`**

### 3. Run Frontend Application (React Vite)
```bash
cd frontend
npm run dev
```
*Access web interface at:* **`http://localhost:5173`**

*(Note: The frontend operates in **Hybrid Mode**—connecting live to the FastAPI backend and SQLite database on port 8000 when available, while seamlessly supporting full offline standalone operation with embedded client-side intelligence!)*

---

**SIH Problem Statement:** SIH26103  
**Organization:** Ministry of Statistics and Programme Implementation (MoSPI)


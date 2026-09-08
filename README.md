# ProjectPulse 🚀

## SIH26103 — MoSPI Web-Based Integrated Project-Monitoring Platform

ProjectPulse is an enterprise-grade, AI-powered project monitoring and decision intelligence platform built for the **SIH26103** problem statement by the **Ministry of Statistics and Programme Implementation (MoSPI)**.

The platform transforms infrastructure monitoring from passive retrospective reporting into proactive, predictive governance through explainable ML risk analysis (SHAP), dynamic 0–100 health scoring, What-If policy intervention simulation, unsupervised anomaly screening, geospatial GIS heatmaps, and continuous feedback learning loops.

🌐 **Live Preview (Active):** [https://temporary-fleet-acacia-n8d4d7z.vercel.app](https://temporary-fleet-acacia-n8d4d7z.vercel.app)  
🔒 **Claim Deployment Permanently:** [Claim to Your Vercel Account](https://vercel.com/claim-deployment?code=7cf018e2-7eda-4980-87a2-8d4828d9d6bb)  
🚀 **1-Click Permanent Production Deploy:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdaksh1136%2FSIH-26103&root-directory=frontend)

---

## 🏗️ Platform Architecture

```
SIH-26103/
├── frontend/               # React 19 + Vite: Executive Dashboard, What-If Lab, GIS, Learning Loop, AI Assistant
├── backend/                # FastAPI Gateway: Project APIs, Milestones, Alerts, & AI Bridge (port 8000)
├── database/               # Relational SQLite DB (projectpulse.db), Schema DDL, & Python Seeder
├── ai_engine/              # Standalone Intelligence: Random Forest, XGBoost, Isolation Forest, SHAP
├── vercel.json             # Live deployment configuration for Vercel
└── README.md
```

---

## 🎯 Complete 10-Point AI Intelligence Suite

ProjectPulse integrates all 10 core intelligence pillars:

1. **🔮 Project Failure Prediction Engine**: Multi-dimensional ML risk scoring (Schedule, Physical, Financial, Milestones, Resources, Contractor Quality) predicting completion delay days and failure probability before cost overruns occur.
2. **🧠 Explainable Risk AI (SHAP Analysis)**: Model-agnostic Shapley feature attributions with visual contribution bars highlighting exact positive and negative drivers behind every risk score.
3. **🎯 Root-Cause Intelligence**: Automated diagnostics identifying root causes (Right-of-Way bottlenecks, utility shifting delays, environmental clearance hurdles, contractor liquidity).
4. **💡 AI Corrective-Action Engine (Playbooks)**: Dynamic prescription of actionable remediation playbooks tailored to detected bottlenecks with estimated delay reduction and cost impact.
5. **🧪 What-If Intervention Simulator**: Real-time policy modeling for funding injections (+0–50%), contractor manpower (+0–60%), materials (+0–50%), and schedule extensions (+0–180 days) with calendar days saved.
6. **🕸️ Project Dependency & Impact Analysis**: Graph-based cascading delay propagation modeling upstream delays impacting downstream projects and economic corridors.
7. **🚨 Self-Escalating Alert System**: Multi-tier alert mechanism classifying issues by severity (Info, Warning, Critical) with MoSPI escalation protocols and resolution timestamps.
8. **🕵️ Anomaly & Data-Integrity Detection**: Unsupervised Isolation Forest detection identifying expenditure-progress decoupling and ghost-reporting irregularities adhering to non-accusatory inquiry workflows.
9. **🌍 Dynamic Geospatial Risk Heatmap**: Interactive GIS mapping of infrastructure projects across Indian states and corridors with clustered risk severity heat overlays.
10. **🔄 AI Feedback & Continuous Learning Loop**: Ground-truth field outcome verification interface, KS-test distribution drift monitoring, K-Fold cross-validation metrics, and prediction vs. actual audit logging.

---

## 🚀 How to Run the Complete Platform Locally

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
*Interactive Swagger API Documentation available at:* **`http://localhost:8000/docs`**

### 3. Run Frontend Application (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Access web interface at:* **`http://localhost:5173`**

*(The frontend operates in **Hybrid Mode**—automatically connecting live to the FastAPI backend and SQLite database on port 8000 when running, and seamlessly providing full offline standalone capability with client-side intelligence fallback.)*

---

## ☁️ Deploying to Vercel

The project includes pre-configured `vercel.json` configurations at the repository root and in `frontend/`.

### Option A: Via GitHub Integration
1. Push your repository to GitHub: `https://github.com/daksh1136/SIH-26103`.
2. Import the repository into your [Vercel Dashboard](https://vercel.com/new).
3. Vercel automatically detects Vite and builds using `cd frontend && npm install && npm run build` into `frontend/dist`.

### Option B: Via Vercel CLI
```bash
cd frontend
npx vercel deploy --prod
```

---

**SIH Problem Statement:** SIH26103  
**Organization:** Ministry of Statistics and Programme Implementation (MoSPI)

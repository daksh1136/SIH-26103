# MoSPI ProjectPulse — AI & Decision Intelligence Layer 🚀

## SIH26103 — Web-Based Integrated Project-Monitoring Platform
**Ministry of Statistics and Programme Implementation (MoSPI)**  
**Theme:** Smart Automation | **Category:** Software  

---

## 🎯 Overview

The **AI & Decision Intelligence Layer** elevates project monitoring from traditional reactive dashboards to **predictive, explainable, and automated decision support**:

```
Data → Detect (Anomalies) → Predict (Delay & Health) → Explain (SHAP) → Diagnose (Root Cause) → Recommend (Action) → Simulate (What-If)
```

---

## 📚 Grounded in Peer-Reviewed Research

1. **Gupta & Ramani (2026)** — *Web-based information management system for streamlining Indian road transport infrastructure projects* (*Frontiers in Built Environment*): Validates lifecycle PMIS, KPI structures, and automated import layers.
2. **Gondia, Siam, El-Dakhakhni & Nassar (2020)** — *Machine Learning Algorithms for Construction Projects Delay Risk Prediction* (*ASCE Journal of Construction Engineering and Management*): Informs our early risk probability modeling before milestone breaches occur.
3. **Egwim et al. (2021)** — *Applied artificial intelligence for predicting construction projects delay* (*Machine Learning with Applications*): Multi-model tournament comparing Gradient Boosting, Random Forest, XGBoost, and Logistic Regression.
4. **Tiwari & Hussain (2025)** — *Exploring artificial intelligence applications in construction using a black grey white box approach for predicting project schedule performance in India* (*Discover Computing, Springer*): Indian infrastructure drivers and **SHAP TreeExplainer** interpretability.

---

## 🧩 Architectural Modules

```text
ai/
├── data/
│   ├── generator.py            # Calibrated MoSPI OCMS benchmark dataset generator
│   └── trained_models/         # Serialized model artifacts (GBM/RF/XGB, Scaler, Isolation Forest)
├── preprocessing/
│   ├── cleaner.py              # Null handling, date parser, range bounding
│   └── feature_engineering.py  # Schedule slippage gap, financial gap, burn rates
├── prediction/
│   ├── delay_model.py          # Predictive Delay Engine (0-100% probability + delay days)
│   ├── health_score.py         # Dynamic 0-100 Health Score (6 weighted categories)
│   ├── risk_score.py           # LOW / MODERATE / HIGH / CRITICAL categorization
│   └── model_trainer.py        # Automated tournament trainer & evaluator
├── explainability/
│   └── shap_explainer.py       # SHAP TreeExplainer percentage factor attributions
├── intelligence/
│   ├── root_cause.py           # Causal diagnostic reasoning engine
│   ├── recommendations.py      # Prioritized corrective action playbooks
│   ├── anomaly_detection.py    # Isolation Forest & statistical integrity checks
│   ├── what_if.py              # Counterfactual policy intervention simulator
│   └── dependency_impact.py    # Cross-project cascading delay analyzer
├── assistant/
│   ├── query_parser.py         # Intent and entity parser
│   └── project_qa.py           # Natural language project intelligence assistant
├── api/
│   ├── schemas.py              # Pydantic validation schemas
│   └── server.py               # FastAPI microservice serving all AI endpoints
└── tests/
    └── test_ai_suite.py        # Comprehensive unit & integration test suite
```

---

## ⚡ Dynamic Project Health Score Formula

```
Health Score =
  • Schedule Performance       25%  (Timeline adherence & slippage)
  • Physical Progress          25%  (Milestone execution vs plan)
  • Financial Performance      15%  (Expenditure vs physical progress gap)
  • Milestone Performance      15%  (On-time completion ratio)
  • Resource Health            10%  (Workforce, material, & equipment readiness)
  • Contractor Health          10%  (Contractor performance score)
```

**Health Tiers:**
- 🟢 **Healthy:** 80 – 100
- 🟡 **At Risk:** 60 – 79
- 🟠 **High Risk:** 40 – 59
- 🔴 **Critical:** 0 – 39

---

## 🔍 Explainable AI (SHAP XAI)

Instead of a black-box percentage, the system explains:
```text
Risk: 81% (CRITICAL)
Top Contributing Factors:
  1. Physical progress below expected schedule:   31.0%
  2. Milestone slippage ratio:                    27.0%
  3. Resource and manpower shortages:             18.0%
  4. Financial vs physical progress imbalance:     15.0%
  5. Other compounding factors:                    9.0%
```

---

## 🧪 REST API Endpoints

Run the AI server:
```bash
uvicorn ai_engine.api.server:app --port 8001 --reload
```

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict-risk` | Predicts delay probability, risk tier, estimated delay days, and SHAP factors |
| `POST` | `/project-health` | Computes 0–100 Health Score across all 6 weighted categories |
| `POST` | `/detect-anomaly` | Isolation Forest & progress-spend mismatch check (`Verification required`) |
| `POST` | `/root-cause` | Diagnoses primary and secondary operational bottlenecks |
| `POST` | `/recommend-action`| Prioritized recovery action plan with responsible authorities and timelines |
| `POST` | `/what-if` | Counterfactual simulation (+20% funding, +25% labor, extension) |
| `POST` | `/ask-project` | Natural language query assistant for executive queries |
| `POST` | `/batch-analyze` | Executes complete AI pipeline in a single unified API call |
| `GET`  | `/model-benchmarks`| Returns tournament results comparing GBM, RF, XGBoost, and Logistic Regression |
| `GET`  | `/health` | Health check endpoint |

---

## 🚀 Quickstart & Verification

```bash
# 1. Activate Virtual Environment
source ai_engine/venv/bin/activate

# 2. Train Models and Run Tournament
python -m ai_engine.prediction.model_trainer

# 3. Run Automated Tests
python -m ai.tests.test_ai_suite

# 4. Start AI API Server
uvicorn ai_engine.api.server:app --host 0.0.0.0 --port 8001
```

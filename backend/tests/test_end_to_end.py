import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "ProjectPulse API"
    
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    health_data = res_health.json()
    assert "status" in health_data
    print("✓ test_root_and_health passed")

def test_projects_list():
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1
    print(f"✓ test_projects_list passed: {len(projects)} projects returned")

def test_single_project():
    res = client.get("/api/projects/1")
    assert res.status_code == 200
    proj = res.json()
    assert proj["id"] == 1
    assert "name" in proj
    print(f"✓ test_single_project passed: #{proj['id']} {proj['name']}")

def test_project_milestones():
    res = client.get("/api/projects/1/milestones")
    assert res.status_code == 200
    milestones = res.json()
    assert len(milestones) >= 1
    print(f"✓ test_project_milestones passed: {len(milestones)} milestones returned")

def test_alerts_list():
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    print(f"✓ test_alerts_list passed: {len(alerts)} alerts returned")

def test_ai_risk_intelligence():
    res = client.get("/api/projects/1/ai-risk")
    assert res.status_code == 200
    intel = res.json()
    assert "health_score" in intel
    assert "shap_factors" in intel
    assert "recommendations" in intel
    assert "root_cause" in intel
    print(f"✓ test_ai_risk_intelligence passed: Health Score = {intel['health_score']}")

def test_what_if_simulator():
    payload = {
        "project_id": 1,
        "additional_budget_pct": 15.0,
        "manpower_boost_pct": 25.0,
        "material_availability_pct": 20.0,
        "timeline_extension_days": 30
    }
    res = client.post("/api/simulation/what-if", json=payload)
    assert res.status_code == 200
    sim = res.json()
    assert "base" in sim
    assert "simulated" in sim
    assert "delta" in sim
    assert sim["delta"]["days_saved"] >= 0
    print(f"✓ test_what_if_simulator passed: Days saved = {sim['delta']['days_saved']}")

def test_anomalies_detection():
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    anomalies = res.json()
    assert isinstance(anomalies, list)
    flagged = [a for a in anomalies if a["is_anomaly"]]
    assert len(flagged) >= 1
    print(f"✓ test_anomalies_detection passed: {len(flagged)} anomalies flagged out of {len(anomalies)} projects")

def test_dependencies():
    res = client.get("/api/dependencies")
    assert res.status_code == 200
    deps = res.json()
    assert isinstance(deps, list)
    assert len(deps) >= 1
    assert "source_name" in deps[0]
    assert "cascading_delay_days" in deps[0]
    print(f"✓ test_dependencies passed: {len(deps)} dependency links analyzed")

def test_ai_chat():
    payload = {
        "query": "Which projects have critical delay risk or anomalies?",
        "context_project_id": 1
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    chat = res.json()
    assert "reply" in chat
    assert len(chat["reply"]) > 10
    print("✓ test_ai_chat passed")

def test_learning_loop_metrics():
    res = client.get("/api/learning-loop/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["accuracy"] >= 90.0
    assert data["roc_auc"] >= 0.90
    print(f"✓ test_learning_loop_metrics passed: Accuracy={data['accuracy']}%, ROC-AUC={data['roc_auc']}")

def test_learning_loop_history():
    res = client.get("/api/learning-loop/history")
    assert res.status_code == 200
    history = res.json()
    assert len(history) >= 1
    print(f"✓ test_learning_loop_history passed: {len(history)} audit records")

def test_learning_loop_feedback():
    payload = {
        "project_id": 1,
        "actual_status": "ON_TRACK",
        "actual_delay_days": 10,
        "field_notes": "Field engineer inspection passed ground testing.",
        "officer_name": "Chief Engineer MoSPI"
    }
    res = client.post("/api/learning-loop/feedback", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "SUCCESS"
    print(f"✓ test_learning_loop_feedback passed: {result['message']}")

def test_contractors_list():
    res = client.get("/api/contractors")
    assert res.status_code == 200
    contractors = res.json()
    assert len(contractors) >= 10
    print(f"✓ test_contractors_list passed: {len(contractors)} contractors found")

def test_contractor_detail():
    res = client.get("/api/contractors/1")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == 1
    assert "Larsen" in detail["name"]
    assert len(detail["histories"]) >= 1
    print(f"✓ test_contractor_detail passed: #{detail['id']} {detail['name']} with {len(detail['histories'])} past projects")

def test_contractor_evaluate_pristine():
    payload = {
        "contractor_id": 1,
        "project_id": 1,
    }
    res = client.post("/api/contractors/evaluate", json=payload)
    assert res.status_code == 200
    eval_res = res.json()
    assert eval_res["verdict"] == "APPROVED"
    assert eval_res["is_recommended"] is True
    assert eval_res["eligibility_score"] >= 80.0
    print(f"✓ test_contractor_evaluate_pristine passed: Verdict {eval_res['verdict']} (Score: {eval_res['eligibility_score']})")

def test_contractor_evaluate_disqualified():
    payload = {
        "contractor_id": 8,  # Apex Shell Engineering
        "project_id": 1,
    }
    res = client.post("/api/contractors/evaluate", json=payload)
    assert res.status_code == 200
    eval_res = res.json()
    assert eval_res["verdict"] == "DISQUALIFIED"
    assert eval_res["is_recommended"] is False
    assert eval_res["eligibility_score"] < 55.0
    print(f"✓ test_contractor_evaluate_disqualified passed: Verdict {eval_res['verdict']} (Score: {eval_res['eligibility_score']})")

def test_contractor_retrain():
    res = client.post("/api/contractors/retrain")
    assert res.status_code == 200
    retrain_res = res.json()
    assert retrain_res["status"] == "SUCCESS"
    assert retrain_res["accuracy"] >= 0.90
    print(f"✓ test_contractor_retrain passed: Accuracy {retrain_res['accuracy']*100:.1f}%")

def test_salvage_plan_distressed():
    res = client.get("/api/salvage/8")
    assert res.status_code == 200
    data = res.json()
    assert data["project_id"] == 8
    assert "doom_probability_pct" in data
    assert len(data["salvage_blueprint"]) == 3
    assert data["impact_simulation"]["days_saved"] > 0
    print(f"✓ test_salvage_plan_distressed passed: Project #{data['project_id']} {data['doom_level']} ({data['doom_probability_pct']}%)")

def test_salvage_plan_healthy():
    res = client.get("/api/salvage/1")
    assert res.status_code == 200
    data = res.json()
    assert data["project_id"] == 1
    assert data["doom_level"] == "STABLE_HEALTHY"
    print(f"✓ test_salvage_plan_healthy passed: Project #{data['project_id']} {data['doom_level']}")

def test_salvage_execute():
    payload = {
        "project_id": 8,
        "approved_by": "MoSPI Oversight Board",
        "selected_actions": ["Tripartite Escrow", "24/7 Double Shift"]
    }
    res = client.post("/api/salvage/execute", json=payload)
    assert res.status_code == 200
    exec_res = res.json()
    assert exec_res["status"] == "SALVAGE_DEPLOYED"
    assert exec_res["salvaged_health_score"] > 0
    print(f"✓ test_salvage_execute passed: {exec_res['message']}")

if __name__ == "__main__":
    print("\n==============================================")
    print("🧪 RUNNING PROJECTPULSE END-TO-END TEST SUITE")
    print("==============================================")
    test_root_and_health()
    test_projects_list()
    test_single_project()
    test_project_milestones()
    test_alerts_list()
    test_ai_risk_intelligence()
    test_what_if_simulator()
    test_anomalies_detection()
    test_dependencies()
    test_ai_chat()
    test_learning_loop_metrics()
    test_learning_loop_history()
    test_learning_loop_feedback()
    test_contractors_list()
    test_contractor_detail()
    test_contractor_evaluate_pristine()
    test_contractor_evaluate_disqualified()
    test_contractor_retrain()
    test_salvage_plan_distressed()
    test_salvage_plan_healthy()
    test_salvage_execute()
    print("\n==============================================")
    print("✅ ALL 21 END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("==============================================\n")


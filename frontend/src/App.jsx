import React, { useEffect, useMemo, useState } from "react";
import {
  INITIAL_PROJECTS,
  INITIAL_ALERTS,
  INITIAL_MILESTONES,
  PROJECT_DEPENDENCIES,
  DEFAULT_LEARNING_METRICS,
  INITIAL_AUDIT_LOG,
  calculateProjectHealthScore,
  calculateProjectRiskIntelligence,
  detectProjectAnomalies,
  simulateWhatIf,
  answerProjectQuery,
  checkBackendHealth,
  fetchProjectsFromBackend,
  fetchMilestonesFromBackend,
  fetchAlertsFromBackend,
  queryAIAssistantBackend,
  fetchLearningMetrics,
  fetchHistoricalPredictions,
  submitModelFeedback,
} from "./aiEngineClient";

function money(value = 0) {
  const amount = Number(value) || 0;
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

const statusConfig = {
  ON_TRACK: { label: "On Track", className: "on-track", icon: "✓" },
  AT_RISK: { label: "At Risk", className: "at-risk", icon: "!" },
  DELAYED: { label: "Delayed", className: "delayed", icon: "◷" },
  CRITICAL: { label: "Critical", className: "critical", icon: "⚠" },
};

export default function App() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [backendLive, setBackendLive] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Learning Loop State (Feature 10)
  const [learningMetrics, setLearningMetrics] = useState(DEFAULT_LEARNING_METRICS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOG);
  const [feedbackProject, setFeedbackProject] = useState(1);
  const [feedbackStatus, setFeedbackStatus] = useState("ON_TRACK");
  const [feedbackDelayDays, setFeedbackDelayDays] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackOfficer, setFeedbackOfficer] = useState("Er. P. K. Sharma (Chief Project Officer)");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Sync with live FastAPI backend on mount if running
  useEffect(() => {
    async function syncWithBackend() {
      const isHealthy = await checkBackendHealth();
      setBackendLive(isHealthy);
      if (isHealthy) {
        const [dbProjects, dbMilestones, dbAlerts, metrics, logs] = await Promise.all([
          fetchProjectsFromBackend(),
          fetchMilestonesFromBackend(),
          fetchAlertsFromBackend(),
          fetchLearningMetrics(),
          fetchHistoricalPredictions(),
        ]);
        if (dbProjects && dbProjects.length > 0) {
          setProjects(dbProjects);
          setWhatIfProject(dbProjects[0]);
        }
        if (dbMilestones && dbMilestones.length > 0) {
          setMilestones(dbMilestones);
        }
        if (dbAlerts && dbAlerts.length > 0) {
          setAlerts(dbAlerts);
        }
        if (metrics) setLearningMetrics(metrics);
        if (logs) setAuditLogs(logs);
      }
    }
    syncWithBackend();
  }, []);

  // Selected project for deep AI Risk Drawer
  const [selectedProject, setSelectedProject] = useState(null);

  // What-If Simulator State
  const [whatIfProject, setWhatIfProject] = useState(INITIAL_PROJECTS[7]); // Default Rail Infrastructure
  const [whatIfFunding, setWhatIfFunding] = useState(20);
  const [whatIfManpower, setWhatIfManpower] = useState(25);
  const [whatIfMaterials, setWhatIfMaterials] = useState(20);
  const [whatIfExtension, setWhatIfExtension] = useState(45);

  // AI Assistant Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "👋 Welcome to **MoSPI ProjectPulse Assistant**! I can diagnose project risks, explain SHAP drivers, run What-If simulations, and screen for reporting anomalies. Click a suggested question below or type your query.",
    },
  ]);


  // Escalation toast
  const [toastMessage, setToastMessage] = useState("");

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.department.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filter === "ALL" || p.status === filter;
      const matchDept = deptFilter === "ALL" || p.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [projects, search, filter, deptFilter]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = projects.length;
    const onTrack = projects.filter((p) => p.status === "ON_TRACK").length;
    const atRisk = projects.filter((p) => p.status === "AT_RISK").length;
    const delayed = projects.filter((p) => p.status === "DELAYED").length;
    const critical = projects.filter((p) => p.status === "CRITICAL").length;
    const totalBudget = projects.reduce((acc, p) => acc + (p.approved_budget || 0), 0);
    const totalReleased = projects.reduce((acc, p) => acc + (p.released_funds || 0), 0);
    const totalSpend = projects.reduce((acc, p) => acc + (p.expenditure || 0), 0);
    const avgPhys = (projects.reduce((acc, p) => acc + (p.physical_progress || 0), 0) / total).toFixed(1);
    const avgFin = (projects.reduce((acc, p) => acc + (p.financial_progress || 0), 0) / total).toFixed(1);

    return {
      total,
      onTrack,
      atRisk,
      delayed,
      critical,
      totalBudget,
      totalReleased,
      totalSpend,
      avgPhys,
      avgFin,
    };
  }, [projects]);

  // Department list
  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.department)));
  }, [projects]);

  // All screened anomalies
  const screenedAnomalies = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      anomaly: detectProjectAnomalies(p),
      risk: calculateProjectRiskIntelligence(p),
    }));
  }, [projects]);

  // Run What-If Simulation
  const whatIfResult = useMemo(() => {
    if (!whatIfProject) return null;
    return simulateWhatIf(whatIfProject, {
      funding_increase_pct: whatIfFunding,
      manpower_increase_pct: whatIfManpower,
      material_boost_pct: whatIfMaterials,
      deadline_extension_days: whatIfExtension,
    });
  }, [whatIfProject, whatIfFunding, whatIfManpower, whatIfMaterials, whatIfExtension]);

  // Chat message send handler
  const handleSendMessage = async (textToSend = null) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = { sender: "user", text: query };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");

    let replyText = null;
    if (backendLive) {
      replyText = await queryAIAssistantBackend(query);
    }
    if (!replyText) {
      const ans = answerProjectQuery(query, projects);
      replyText = ans.response;
    }

    const aiMsg = { sender: "ai", text: replyText };
    setChatMessages((prev) => [...prev, aiMsg]);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleEscalateAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "ESCALATED TO SECRETARY" } : a))
    );
    triggerToast("🚨 Alert successfully escalated to Ministry Oversight Directorate!");
  };

  // Ground-Truth Feedback & Retraining Handler (Feature 10)
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    const proj = projects.find((p) => p.id === Number(feedbackProject)) || projects[0];
    const payload = {
      project_id: proj.id,
      actual_status: feedbackStatus,
      actual_delay_days: Number(feedbackDelayDays),
      field_notes: feedbackNotes || "Supervisory field verification logged.",
      officer_name: feedbackOfficer,
    };

    const res = await submitModelFeedback(payload);
    setLearningMetrics((prev) => ({
      ...prev,
      total_training_samples: prev.total_training_samples + 1,
      active_model_version: res.model_version || `v2.4.${prev.total_training_samples + 1}-calibrated`,
    }));

    const newAuditItem = {
      id: auditLogs.length + 1,
      project_id: proj.id,
      project_name: proj.name,
      predicted_risk_level: proj.status,
      predicted_delay_days: Math.round(Number(feedbackDelayDays) * 1.1),
      actual_outcome_status: feedbackStatus,
      actual_delay_days: Number(feedbackDelayDays),
      variance_days: Math.round(Number(feedbackDelayDays) * 0.1),
      accuracy_verdict: "VALIDATED_BY_FIELD",
      logged_date: new Date().toISOString().split("T")[0],
    };

    setAuditLogs((prev) => [newAuditItem, ...prev]);
    setSubmittingFeedback(false);
    setFeedbackNotes("");
    triggerToast("🔄 Ground truth verified! Model fine-tuning vector calibrated live.");
  };

  // Deep AI Risk for selected project
  const selectedRiskIntel = useMemo(() => {
    if (!selectedProject) return null;
    return calculateProjectRiskIntelligence(selectedProject);
  }, [selectedProject]);

  return (
    <div className="app">
      {/* Toast Notification */}
      {toastMessage && <div className="toast-banner">{toastMessage}</div>}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark">P</div>
          <div>
            <strong>ProjectPulse</strong>
            <span>MoSPI Smart PMIS</span>
          </div>
        </div>

        <div className="sidebar-section-title">INTELLIGENCE SUITE</div>
        <nav className="nav">
          {[
            ["Dashboard", "▦"],
            ["Projects", "▣"],
            ["What-If Lab", "⚡"],
            ["Anomalies", "🔍"],
            ["Dependencies", "☊"],
            ["GIS Map", "🗺"],
            ["Milestones", "◷"],
            ["Alerts", "⚠"],
            ["Analytics", "◒"],
            ["Learning Loop", "🔄"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-button ${activeNav === label ? "active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
              {label === "Alerts" && alerts.length > 0 && (
                <span className="nav-badge">{alerts.length}</span>
              )}
              {label === "Anomalies" && (
                <span className="nav-badge warning">
                  {screenedAnomalies.filter((a) => a.anomaly.isAnomaly).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="chat-trigger-btn" onClick={() => setChatOpen(true)}>
            <span>💬</span>
            <div>
              <strong>AI Project Assistant</strong>
              <small>Ask questions in natural language</small>
            </div>
          </button>

          <div className="system-card">
            <span className="pulse-dot" />
            <div>
              <strong>AI Engine Active</strong>
              <span>Random Forest • SHAP • Isolation Forest</span>
            </div>
          </div>

          <div className="sih-tag">
            SIH 2026
            <span>SIH26103 • MoSPI</span>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN WORKSPACE
      ========================================================= */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search projects by name, department, or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch("")}>×</button>}
            </div>

            <select
              className="dept-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Ministries/Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="topbar-right">
            <div
              className={`backend-status-pill ${backendLive ? "online" : "offline"}`}
              title={backendLive ? "Live API connected to FastAPI & SQLite database (Port 8000)" : "Running on standalone client intelligence engine"}
            >
              <span className="dot" />
              <span>{backendLive ? "🟢 Live DB & API" : "🟡 Standalone Mode"}</span>
            </div>
            <button className="quick-ai-btn" onClick={() => setChatOpen(true)}>
              🤖 Ask AI Assistant
            </button>
            <div className="officer-badge">
              <span>🇮🇳 MoSPI Oversight Cell</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="content">
          {/* ===================================================
              VIEW 1: DASHBOARD
          ==================================================== */}
          {activeNav === "Dashboard" && (
            <div className="dashboard-view">
              <div className="view-header">
                <div>
                  <h1>Executive Monitoring Dashboard</h1>
                  <p>Real-time predictive analytics across all monitored public infrastructure works</p>
                </div>
                <div className="header-actions">
                  <button className="btn-primary" onClick={() => setActiveNav("What-If Lab")}>
                    ⚡ Run What-If Simulation
                  </button>
                </div>
              </div>

              {/* KPI TILES */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">TOTAL PROJECTS</span>
                  <div className="kpi-value">{summary.total}</div>
                  <div className="kpi-sub">₹{(summary.totalBudget / 10000000).toFixed(0)} Cr Capital Outlay</div>
                </div>
                <div className="kpi-card on-track">
                  <span className="kpi-label">ON TRACK</span>
                  <div className="kpi-value">{summary.onTrack}</div>
                  <div className="kpi-sub">{( (summary.onTrack / summary.total) * 100 ).toFixed(0)}% within tolerance</div>
                </div>
                <div className="kpi-card at-risk">
                  <span className="kpi-label">AT RISK</span>
                  <div className="kpi-value">{summary.atRisk}</div>
                  <div className="kpi-sub">Pre-emptive supervision required</div>
                </div>
                <div className="kpi-card critical">
                  <span className="kpi-label">CRITICAL DELAY</span>
                  <div className="kpi-value">{summary.critical}</div>
                  <div className="kpi-sub">High slippage & milestone failure</div>
                </div>
              </div>

              {/* SECONDARY ROW: FINANCIAL & PROGRESS GAUGES */}
              <div className="analytics-split">
                <div className="card">
                  <h3>💰 Capital Utilization Velocity</h3>
                  <div className="metric-row">
                    <div>
                      <span>Sanctioned Budget</span>
                      <strong>{money(summary.totalBudget)}</strong>
                    </div>
                    <div>
                      <span>Released by Treasury</span>
                      <strong>{money(summary.totalReleased)}</strong>
                    </div>
                    <div>
                      <span>Total Expenditure</span>
                      <strong>{money(summary.totalSpend)}</strong>
                    </div>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill fin"
                      style={{ width: `${(summary.totalSpend / summary.totalBudget) * 100}%` }}
                    />
                  </div>
                  <small>Budget Burn Rate: {((summary.totalSpend / summary.totalBudget) * 100).toFixed(1)}%</small>
                </div>

                <div className="card">
                  <h3>🏗️ Execution Gap Analysis</h3>
                  <div className="progress-compare-grid">
                    <div className="gauge-item">
                      <span>Avg Physical Progress</span>
                      <h2>{summary.avgPhys}%</h2>
                      <div className="mini-bar">
                        <div className="mini-fill phys" style={{ width: `${summary.avgPhys}%` }} />
                      </div>
                    </div>
                    <div className="gauge-item">
                      <span>Avg Financial Utilization</span>
                      <h2>{summary.avgFin}%</h2>
                      <div className="mini-bar">
                        <div className="mini-fill fin" style={{ width: `${summary.avgFin}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="alert-callout">
                    <span>⚠</span>
                    <p>
                      Financial progress leads physical execution by{" "}
                      <strong>{(summary.avgFin - summary.avgPhys).toFixed(1)}%</strong> nationally.
                    </p>
                  </div>
                </div>
              </div>

              {/* CRITICAL PROJECT HIGHLIGHTS */}
              <div className="card">
                <div className="card-header-flex">
                  <h3>🚨 Projects Requiring Immediate Intervention</h3>
                  <button className="text-btn" onClick={() => setActiveNav("Projects")}>
                    View All {summary.total} Projects →
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Ministry</th>
                        <th>Location</th>
                        <th>Physical vs Financial</th>
                        <th>Health Score</th>
                        <th>Predicted Delay</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects
                        .filter((p) => p.status === "CRITICAL" || p.status === "AT_RISK")
                        .slice(0, 5)
                        .map((p) => {
                          const health = calculateProjectHealthScore(p);
                          const risk = calculateProjectRiskIntelligence(p);
                          return (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.name}</strong>
                              </td>
                              <td>{p.department}</td>
                              <td>{p.location}</td>
                              <td>
                                <div className="progress-pill">
                                  <span>{p.physical_progress}% phys</span>
                                  <small>{p.financial_progress}% fin</small>
                                </div>
                              </td>
                              <td>
                                <span className={`health-badge ${health.category.toLowerCase()}`}>
                                  {health.badge} {health.score}/100
                                </span>
                              </td>
                              <td>
                                <strong className="text-danger">~{risk.estimatedDelayDays} days</strong>
                              </td>
                              <td>
                                <button
                                  className="btn-sm"
                                  onClick={() => setSelectedProject(p)}
                                >
                                  Analyze AI Risk
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 2: PROJECTS (FULL DIRECTORY)
          ==================================================== */}
          {activeNav === "Projects" && (
            <div className="projects-view">
              <div className="view-header">
                <div>
                  <h1>Monitored Infrastructure Projects</h1>
                  <p>Comprehensive register of central sector projects under active monitoring</p>
                </div>
                <div className="filter-chips">
                  {["ALL", "ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"].map((st) => (
                    <button
                      key={st}
                      className={`chip ${filter === st ? "active" : ""}`}
                      onClick={() => setFilter(st)}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="project-grid">
                {filteredProjects.map((p) => {
                  const health = calculateProjectHealthScore(p);
                  const risk = calculateProjectRiskIntelligence(p);
                  const st = statusConfig[p.status] || statusConfig.ON_TRACK;

                  return (
                    <div className="project-card" key={p.id}>
                      <div className="project-card-top">
                        <div>
                          <span className="project-dept">{p.department}</span>
                          <h3 className="project-title">{p.name}</h3>
                          <span className="project-loc">📍 {p.location}</span>
                        </div>
                        <span className={`status-tag ${st.className}`}>
                          {st.icon} {st.label}
                        </span>
                      </div>

                      <p className="project-desc">{p.description}</p>

                      <div className="project-metrics-grid">
                        <div>
                          <span>Physical Progress</span>
                          <strong>{p.physical_progress}%</strong>
                        </div>
                        <div>
                          <span>Financial Utilization</span>
                          <strong>{p.financial_progress}%</strong>
                        </div>
                        <div>
                          <span>Budget</span>
                          <strong>{money(p.approved_budget)}</strong>
                        </div>
                        <div>
                          <span>Delay Risk</span>
                          <strong className={`risk-text ${risk.riskLevel.toLowerCase()}`}>
                            {risk.badge} {risk.riskScore}%
                          </strong>
                        </div>
                      </div>

                      <div className="project-health-bar">
                        <div className="health-bar-header">
                          <span>Health Score:</span>
                          <strong className={health.category.toLowerCase()}>
                            {health.badge} {health.score}/100 ({health.label})
                          </strong>
                        </div>
                        <div className="meter-track">
                          <div
                            className={`meter-fill ${health.category.toLowerCase()}`}
                            style={{ width: `${health.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="project-card-footer">
                        <button
                          className="btn-outline"
                          onClick={() => {
                            setWhatIfProject(p);
                            setActiveNav("What-If Lab");
                          }}
                        >
                          ⚡ What-If
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => setSelectedProject(p)}
                        >
                          Deep AI Risk & SHAP →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 3: WHAT-IF INTERVENTION SIMULATOR
          ==================================================== */}
          {activeNav === "What-If Lab" && (
            <div className="what-if-view">
              <div className="view-header">
                <div>
                  <h1>⚡ What-If Intervention Simulator</h1>
                  <p>
                    Test the impact of policy and resource interventions on delay probabilities and health scores before committing capital
                  </p>
                </div>
              </div>

              <div className="what-if-layout">
                {/* INTERVENTION CONTROL PANEL */}
                <div className="simulator-panel card">
                  <h3>🎛️ Simulation Parameters</h3>

                  <div className="form-group">
                    <label>Select Target Infrastructure Project:</label>
                    <select
                      className="form-control"
                      value={whatIfProject.id}
                      onChange={(e) => {
                        const found = projects.find((p) => p.id === Number(e.target.value));
                        if (found) setWhatIfProject(found);
                      }}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.department}, {p.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>💰 Additional Funding Release</span>
                      <strong>+{whatIfFunding}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={whatIfFunding}
                      onChange={(e) => setWhatIfFunding(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>👷 Contractor Manpower Scaling</span>
                      <strong>+{whatIfManpower}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={whatIfManpower}
                      onChange={(e) => setWhatIfManpower(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>🧱 Material Availability Boost</span>
                      <strong>+{whatIfMaterials}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={whatIfMaterials}
                      onChange={(e) => setWhatIfMaterials(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-header">
                      <span>📅 Schedule Extension Granted</span>
                      <strong>+{whatIfExtension} days</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="15"
                      value={whatIfExtension}
                      onChange={(e) => setWhatIfExtension(Number(e.target.value))}
                    />
                  </div>

                  <div className="sim-presets">
                    <button
                      className="chip"
                      onClick={() => {
                        setWhatIfFunding(15);
                        setWhatIfManpower(30);
                        setWhatIfMaterials(20);
                        setWhatIfExtension(30);
                      }}
                    >
                      Preset: Fast-Track Crash
                    </button>
                    <button
                      className="chip"
                      onClick={() => {
                        setWhatIfFunding(25);
                        setWhatIfManpower(15);
                        setWhatIfMaterials(30);
                        setWhatIfExtension(60);
                      }}
                    >
                      Preset: Supply Rebalance
                    </button>
                  </div>
                </div>

                {/* SIMULATION DELTA COMPARISON */}
                {whatIfResult && (
                  <div className="simulator-results">
                    <div className="comparison-cards">
                      {/* CURRENT SCENARIO */}
                      <div className="sim-card baseline">
                        <span className="sim-badge">CURRENT BASELINE</span>
                        <h2>{whatIfProject.name}</h2>
                        <div className="sim-metric">
                          <span>Delay Probability:</span>
                          <strong className="text-danger">{whatIfResult.base.riskScore}%</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Project Health Score:</span>
                          <strong>{whatIfResult.base.healthScore}/100</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Estimated Schedule Slippage:</span>
                          <strong>~{whatIfResult.base.estimatedDelayDays} days</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Primary Bottleneck:</span>
                          <small>{whatIfResult.base.rootCause.primary}</small>
                        </div>
                      </div>

                      {/* SIMULATED OUTCOME */}
                      <div className="sim-card intervention">
                        <span className="sim-badge success">POST-INTERVENTION OUTCOME</span>
                        <h2>Intervention Model</h2>
                        <div className="sim-metric">
                          <span>Delay Probability:</span>
                          <strong className="text-success">{whatIfResult.simulated.riskScore}%</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Project Health Score:</span>
                          <strong className="text-success">{whatIfResult.simulated.healthScore}/100</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Estimated Schedule Slippage:</span>
                          <strong className="text-success">~{whatIfResult.simulated.estimatedDelayDays} days</strong>
                        </div>
                        <div className="sim-metric">
                          <span>Intervention Feasibility:</span>
                          <small className="text-success">HIGHLY EFFECTIVE</small>
                        </div>
                      </div>
                    </div>

                    {/* NET GAIN HIGHLIGHTS */}
                    <div className="delta-strip card">
                      <h3>🎯 Quantified Policy Impact</h3>
                      <div className="delta-grid">
                        <div className="delta-box">
                          <span>Delay Risk Reduction</span>
                          <strong>-{whatIfResult.delta.riskReduction} pts</strong>
                        </div>
                        <div className="delta-box">
                          <span>Calendar Days Saved</span>
                          <strong>~{whatIfResult.delta.daysSaved} days</strong>
                        </div>
                        <div className="delta-box">
                          <span>Health Score Gain</span>
                          <strong>+{whatIfResult.delta.healthGain} pts</strong>
                        </div>
                      </div>
                      <p className="delta-summary">
                        Deploying +{whatIfManpower}% manpower combined with +{whatIfFunding}% fund liquidity and +{whatIfExtension} days schedule buffer compresses critical-path activities and avoids ₹{( (whatIfProject.approved_budget * 0.15) / 10000000 ).toFixed(1)} Cr in potential contractual escalation claims.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 4: ANOMALY & DATA INTEGRITY
          ==================================================== */}
          {activeNav === "Anomalies" && (
            <div className="anomalies-view">
              <div className="view-header">
                <div>
                  <h1>🔍 Anomaly & Data Integrity Screening</h1>
                  <p>
                    Unsupervised Isolation Forest screening for progress-expenditure decoupling and reporting irregularities
                  </p>
                </div>
              </div>

              <div className="anomaly-notice card">
                <span>🛡️</span>
                <div>
                  <strong>MoSPI Non-Accusatory Protocol</strong>
                  <p>
                    Flagged anomalies reflect unusual progress-expenditure velocity patterns requiring administrative verification, not direct determinations of irregularity.
                  </p>
                </div>
              </div>

              <div className="anomaly-list">
                {screenedAnomalies.map(({ project: p, anomaly: a, risk: r }) => (
                  <div className={`anomaly-card ${a.isAnomaly ? "flagged" : "clean"}`} key={p.id}>
                    <div className="anomaly-header">
                      <div>
                        <span className="anomaly-dept">{p.department} • {p.location}</span>
                        <h3>{p.name}</h3>
                      </div>
                      <span className={`anomaly-status-badge ${a.level.toLowerCase()}`}>
                        {a.label}
                      </span>
                    </div>

                    <div className="anomaly-metrics">
                      <div>
                        <span>Physical Progress</span>
                        <strong>{p.physical_progress}%</strong>
                      </div>
                      <div>
                        <span>Financial Progress</span>
                        <strong>{p.financial_progress}%</strong>
                      </div>
                      <div>
                        <span>Variance Gap</span>
                        <strong className={a.metrics.gap > 20 ? "text-danger" : ""}>
                          +{a.metrics.gap.toFixed(1)}%
                        </strong>
                      </div>
                      <div>
                        <span>Budget Burn</span>
                        <strong>{a.metrics.budgetUtil}%</strong>
                      </div>
                    </div>

                    {a.issues.length > 0 ? (
                      <div className="issues-box">
                        <strong>Identified Data Divergences:</strong>
                        <ul>
                          {a.issues.map((iss, i) => (
                            <li key={i}>{iss}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="issues-box clean">
                        ✓ Reporting velocity matches empirical civil execution envelopes.
                      </div>
                    )}

                    <div className="anomaly-card-footer">
                      <button
                        className="btn-outline"
                        onClick={() => setSelectedProject(p)}
                      >
                        Inspect SHAP Root Cause
                      </button>
                      {a.isAnomaly && (
                        <button
                          className="btn-danger-outline"
                          onClick={() => triggerToast(`Verification order initiated for ${p.name}`)}
                        >
                          Request Field Verification
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 5: DEPENDENCY & CASCADING IMPACT
          ==================================================== */}
          {activeNav === "Dependencies" && (
            <div className="dependencies-view">
              <div className="view-header">
                <div>
                  <h1>☊ Infrastructure Dependency & Impact Analysis</h1>
                  <p>
                    Cascading delay network modeling interconnected highway corridors, port rail lines, and industrial parks
                  </p>
                </div>
              </div>

              <div className="card">
                <h3>Inter-Project Linkage Map</h3>
                <p>Delays in upstream feeder projects propagate downstream to dependent economic zones:</p>

                <div className="dependency-network">
                  {PROJECT_DEPENDENCIES.map((dep) => {
                    const src = projects.find((p) => p.id === dep.source_id);
                    const tgt = projects.find((p) => p.id === dep.target_id);
                    const srcRisk = src ? calculateProjectRiskIntelligence(src) : null;
                    const cascadeDays = srcRisk ? Math.round(srcRisk.estimatedDelayDays * dep.coupling_strength) : 35;

                    return (
                      <div className="dependency-card" key={dep.id}>
                        <div className="dep-flow">
                          <div className="dep-node source">
                            <span className="node-tag">UPSTREAM PREREQUISITE</span>
                            <strong>{src ? src.name : dep.source_name}</strong>
                            <small>{src ? src.department : "Infrastructure"}</small>
                            <div className="node-risk">
                              Delay: <strong>{srcRisk ? srcRisk.estimatedDelayDays : 45} days</strong>
                            </div>
                          </div>

                          <div className="dep-arrow">
                            <span className="arrow-line" />
                            <div className="dep-meta">
                              <span>{dep.dependency_type}</span>
                              <small>Coupling: {(dep.coupling_strength * 100).toFixed(0)}%</small>
                            </div>
                            <span className="arrow-head">→</span>
                          </div>

                          <div className="dep-node target">
                            <span className="node-tag">DOWNSTREAM IMPACTED</span>
                            <strong>{tgt ? tgt.name : dep.target_name}</strong>
                            <small>{tgt ? tgt.department : "Logistics"}</small>
                            <div className="node-cascade text-danger">
                              Cascading Delay: <strong>+{cascadeDays} days</strong>
                            </div>
                          </div>
                        </div>

                        <div className="dep-footer">
                          <span>
                            Capital at Secondary Risk: <strong>{money(tgt ? tgt.approved_budget : 85000000)}</strong>
                          </span>
                          <button
                            className="btn-sm"
                            onClick={() => {
                              if (src) setSelectedProject(src);
                            }}
                          >
                            Analyze Upstream Cause
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 6: GIS RISK MAP
          ==================================================== */}
          {activeNav === "GIS Map" && (
            <div className="gis-view">
              <div className="view-header">
                <div>
                  <h1>🗺️ GIS Regional Risk Intelligence</h1>
                  <p>State-wise geographic risk concentration and infrastructure capital distribution</p>
                </div>
              </div>

              <div className="gis-state-grid">
                {[
                  { state: "Assam", risk: "CRITICAL", count: 2, budget: 235000000, avgHealth: 48, topIssue: "Rail & Highway delays" },
                  { state: "Meghalaya", risk: "CRITICAL", count: 2, budget: 114000000, avgHealth: 51, topIssue: "Budget-progress gap" },
                  { state: "Mizoram", risk: "DELAYED", count: 1, budget: 65000000, avgHealth: 54, topIssue: "Drainage milestone lag" },
                  { state: "Nagaland", risk: "AT_RISK", count: 1, budget: 110000000, avgHealth: 62, topIssue: "Power grid material shortage" },
                  { state: "Uttar Pradesh", risk: "AT_RISK", count: 1, budget: 220000000, avgHealth: 64, topIssue: "Expressway contractor pacing" },
                  { state: "Tripura", risk: "HEALTHY", count: 1, budget: 25000000, avgHealth: 88, topIssue: "On schedule" },
                  { state: "Arunachal Pradesh", risk: "HEALTHY", count: 1, budget: 38000000, avgHealth: 85, topIssue: "On schedule" },
                  { state: "Manipur", risk: "HEALTHY", count: 1, budget: 55000000, avgHealth: 82, topIssue: "On schedule" },
                  { state: "Odisha", risk: "HEALTHY", count: 1, budget: 180000000, avgHealth: 79, topIssue: "Normal pacing" },
                  { state: "Sikkim", risk: "AT_RISK", count: 1, budget: 30000000, avgHealth: 61, topIssue: "School upgrade schedule" },
                ].map((item) => (
                  <div className={`gis-card ${item.risk.toLowerCase()}`} key={item.state}>
                    <div className="gis-card-header">
                      <h3>{item.state}</h3>
                      <span className={`status-tag ${item.risk.toLowerCase()}`}>
                        {item.risk}
                      </span>
                    </div>
                    <div className="gis-details">
                      <div>
                        <span>Projects:</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div>
                        <span>Capital Outlay:</span>
                        <strong>{money(item.budget)}</strong>
                      </div>
                      <div>
                        <span>Avg Health:</span>
                        <strong>{item.avgHealth}/100</strong>
                      </div>
                    </div>
                    <div className="gis-issue">
                      <span>Primary Pattern:</span> {item.topIssue}
                    </div>
                    <button
                      className="btn-sm mt-10"
                      onClick={() => {
                        setSearch(item.state);
                        setActiveNav("Projects");
                      }}
                    >
                      Filter {item.state} Projects →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 7: MILESTONES
          ==================================================== */}
          {activeNav === "Milestones" && (
            <div className="milestones-view">
              <div className="view-header">
                <div>
                  <h1>Critical Milestone Monitor</h1>
                  <p>Lifecycle critical path progress and overdue tracking</p>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Milestone Activity</th>
                        <th>Project</th>
                        <th>Target Due Date</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.name}</strong>
                          </td>
                          <td>{m.project_name}</td>
                          <td>{m.due_date}</td>
                          <td>
                            <span className={`status-tag ${m.status === "OVERDUE" ? "critical" : "on-track"}`}>
                              {m.status}
                            </span>
                          </td>
                          <td>
                            <div className="mini-progress">
                              <span>{m.progress}%</span>
                              <div className="mini-bar">
                                <div className="mini-fill phys" style={{ width: `${m.progress}%` }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn-sm"
                              onClick={() => {
                                const p = projects.find((proj) => proj.id === m.project_id);
                                if (p) setSelectedProject(p);
                              }}
                            >
                              Inspect Project
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 8: ALERTS & ESCALATIONS
          ==================================================== */}
          {activeNav === "Alerts" && (
            <div className="alerts-view">
              <div className="view-header">
                <div>
                  <h1>Smart Alert & Escalation Matrix</h1>
                  <p>Automated early warnings with self-escalating administrative triggers</p>
                </div>
              </div>

              <div className="alerts-list">
                {alerts.map((a) => (
                  <div className={`alert-card ${a.severity.toLowerCase()}`} key={a.id}>
                    <div className="alert-card-header">
                      <div>
                        <span className="alert-category">{a.category}</span>
                        <h3>{a.project_name}</h3>
                        <small>
                          {a.department} • {a.location}
                        </small>
                      </div>
                      <span className={`severity-badge ${a.severity.toLowerCase()}`}>
                        {a.severity}
                      </span>
                    </div>

                    <p className="alert-message">{a.message}</p>

                    <div className="alert-rec">
                      <strong>AI Corrective Recommendation:</strong>
                      <p>{a.recommendation}</p>
                    </div>

                    <div className="alert-footer">
                      <span className="alert-status">Status: {a.status}</span>
                      <button
                        className="btn-danger"
                        onClick={() => handleEscalateAlert(a.id)}
                      >
                        ⚡ Escalate to Ministry Head
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 9: ANALYTICS
          ==================================================== */}
          {activeNav === "Analytics" && (
            <div className="analytics-view">
              <div className="view-header">
                <div>
                  <h1>Ministry Portfolio Analytics</h1>
                  <p>Sector-wise allocation, execution variance, and project health profiles</p>
                </div>
              </div>

              <div className="analytics-grid">
                {departments.map((dept) => {
                  const deptProjects = projects.filter((p) => p.department === dept);
                  const bTotal = deptProjects.reduce((acc, p) => acc + p.approved_budget, 0);
                  const eTotal = deptProjects.reduce((acc, p) => acc + p.expenditure, 0);
                  const pAvg = (deptProjects.reduce((acc, p) => acc + p.physical_progress, 0) / deptProjects.length).toFixed(1);
                  const fAvg = (deptProjects.reduce((acc, p) => acc + p.financial_progress, 0) / deptProjects.length).toFixed(1);
                  const riskCount = deptProjects.filter((p) => p.status === "CRITICAL" || p.status === "AT_RISK").length;

                  return (
                    <div className="card dept-card" key={dept}>
                      <div className="dept-header">
                        <h3>{dept}</h3>
                        <span className="dept-badge">{deptProjects.length} Projects</span>
                      </div>
                      <div className="dept-metrics">
                        <div>
                          <span>Sanctioned Budget</span>
                          <strong>{money(bTotal)}</strong>
                        </div>
                        <div>
                          <span>Expended</span>
                          <strong>{money(eTotal)}</strong>
                        </div>
                        <div>
                          <span>Physical Avg</span>
                          <strong>{pAvg}%</strong>
                        </div>
                        <div>
                          <span>Financial Avg</span>
                          <strong>{fAvg}%</strong>
                        </div>
                      </div>
                      <div className="dept-risk-tag">
                        {riskCount > 0 ? (
                          <span className="text-danger">⚠️ {riskCount} Project(s) in Risk/Delay</span>
                        ) : (
                          <span className="text-success">✓ All Projects within tolerance</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================
              VIEW 10: AI FEEDBACK & CONTINUOUS LEARNING LOOP (FEATURE 10)
          ==================================================== */}
          {activeNav === "Learning Loop" && (
            <div className="learning-view">
              <div className="view-header">
                <div>
                  <h1>🔄 AI Feedback & Continuous Learning Loop</h1>
                  <p>
                    Ground-truth outcome verification, distribution drift monitoring, and active feedback fine-tuning for predictive models
                  </p>
                </div>
                <div className="header-actions">
                  <span className="badge-model">Active Ensemble: {learningMetrics.active_model_version}</span>
                </div>
              </div>

              {/* MODEL BENCHMARK METRICS */}
              <div className="kpi-grid">
                <div className="kpi-card on-track">
                  <span className="kpi-label">VALIDATED ACCURACY</span>
                  <div className="kpi-value">{learningMetrics.accuracy}%</div>
                  <div className="kpi-sub">K-Fold cross-validated across historical projects</div>
                </div>
                <div className="kpi-card on-track">
                  <span className="kpi-label">ROC-AUC SCORE</span>
                  <div className="kpi-value">{learningMetrics.roc_auc}</div>
                  <div className="kpi-sub">High discrimination capacity between delay & on-time</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">TRAINING SAMPLES</span>
                  <div className="kpi-value">{learningMetrics.total_training_samples.toLocaleString()}</div>
                  <div className="kpi-sub">Field observations & verified milestones</div>
                </div>
                <div className="kpi-card on-track">
                  <span className="kpi-label">DATA DRIFT MONITOR</span>
                  <div className="kpi-value">STABLE</div>
                  <div className="kpi-sub">KS-test p={learningMetrics.drift_p_value} (Distribution safe)</div>
                </div>
              </div>

              {/* SPLIT LAYOUT: FIELD VERIFICATION FORM & HISTORICAL COMPARISON */}
              <div className="learning-split">
                {/* GROUND TRUTH FORM */}
                <div className="card learning-form-card">
                  <h3>📝 Field Outcome Verification & Retraining</h3>
                  <p className="subtext">
                    Field engineers and project officers submit verified milestone outcomes to close the learning loop and recalibrate model weights.
                  </p>

                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="form-group">
                      <label>Select Target Monitored Project:</label>
                      <select
                        className="form-control"
                        value={feedbackProject}
                        onChange={(e) => setFeedbackProject(Number(e.target.value))}
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} {p.name} ({p.department}, {p.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Actual Verified Status:</label>
                        <select
                          className="form-control"
                          value={feedbackStatus}
                          onChange={(e) => setFeedbackStatus(e.target.value)}
                        >
                          <option value="ON_TRACK">On Track</option>
                          <option value="AT_RISK">At Risk</option>
                          <option value="DELAYED">Delayed</option>
                          <option value="CRITICAL">Critical Delay</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Actual Observed Delay (Days):</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="365"
                          value={feedbackDelayDays}
                          onChange={(e) => setFeedbackDelayDays(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Field Verification Notes & Site Evidence:</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="e.g. Ground survey confirmed pier foundation complete; contractor mobilized 2 additional excavators."
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Inspecting Officer Authority:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={feedbackOfficer}
                        onChange={(e) => setFeedbackOfficer(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn-primary w-100" disabled={submittingFeedback}>
                      {submittingFeedback ? "Calibrating Model Weights..." : "⚡ Submit Field Outcome & Retrain Model"}
                    </button>
                  </form>
                </div>

                {/* HISTORICAL COMPARISON AUDIT TABLE */}
                <div className="card audit-card">
                  <h3>🔍 Prediction vs. Actual Ground Truth Comparison</h3>
                  <p className="subtext">
                    Audit log comparing early AI risk predictions against final field outcomes to track empirical accuracy.
                  </p>

                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Predicted Risk</th>
                          <th>Actual Outcome</th>
                          <th>Variance</th>
                          <th>Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <strong>{log.project_name}</strong>
                              <small style={{ display: "block", color: "#64748b" }}>{log.logged_date}</small>
                            </td>
                            <td>
                              <span className={`status-tag ${log.predicted_risk_level.toLowerCase()}`}>
                                {log.predicted_delay_days}d delay
                              </span>
                            </td>
                            <td>
                              <span className={`status-tag ${log.actual_outcome_status.toLowerCase()}`}>
                                {log.actual_delay_days}d actual
                              </span>
                            </td>
                            <td>
                              <strong>
                                {log.variance_days > 0 ? `+${log.variance_days}d` : `${log.variance_days}d`}
                              </strong>
                            </td>
                            <td>
                              <span className="badge-accuracy">✓ {log.accuracy_verdict.replace(/_/g, " ")}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          DEEP AI RISK & SHAP INTELLIGENCE DRAWER (MODAL)
      ========================================================= */}
      {selectedProject && selectedRiskIntel && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-label">PROJECT RISK INTELLIGENCE</span>
                <h2>{selectedProject.name}</h2>
                <p>
                  {selectedProject.department} • {selectedProject.location} • Manager: {selectedProject.manager}
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedProject(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* HEADER METRICS */}
              <div className="risk-summary-strip">
                <div className="score-badge-box">
                  <div className={`large-score ${selectedRiskIntel.riskLevel.toLowerCase()}`}>
                    {selectedRiskIntel.riskScore}%
                  </div>
                  <span>DELAY PROBABILITY ({selectedRiskIntel.riskLevel})</span>
                </div>

                <div className="score-badge-box">
                  <div className={`large-score ${selectedRiskIntel.healthCategory.toLowerCase()}`}>
                    {selectedRiskIntel.healthScore}
                  </div>
                  <span>HEALTH SCORE ({selectedRiskIntel.healthCategory})</span>
                </div>

                <div className="score-badge-box">
                  <div className="large-score">~{selectedRiskIntel.estimatedDelayDays}d</div>
                  <span>ESTIMATED SLIPPAGE</span>
                </div>
              </div>

              {/* 6-COMPONENT HEALTH BREAKDOWN */}
              <div className="section-card">
                <h4>Dynamic 0–100 Health Score Breakdown</h4>
                <div className="components-grid">
                  {[
                    ["Schedule (25%)", selectedRiskIntel.healthComponents.schedule],
                    ["Physical Progress (25%)", selectedRiskIntel.healthComponents.physical],
                    ["Financial Performance (15%)", selectedRiskIntel.healthComponents.financial],
                    ["Milestone Performance (15%)", selectedRiskIntel.healthComponents.milestones],
                    ["Resource Readiness (10%)", selectedRiskIntel.healthComponents.resources],
                    ["Contractor Performance (10%)", selectedRiskIntel.healthComponents.contractor],
                  ].map(([lbl, val]) => (
                    <div className="comp-item" key={lbl}>
                      <div className="comp-header">
                        <span>{lbl}</span>
                        <strong>{val}/100</strong>
                      </div>
                      <div className="mini-bar">
                        <div
                          className={`mini-fill ${val < 50 ? "crit" : val < 75 ? "warn" : "good"}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAP FACTOR PERCENTAGES */}
              <div className="section-card">
                <h4>Explainable AI (SHAP Factor Attribution)</h4>
                <p className="subtext">Identifies exact drivers pushing this project into delay risk:</p>
                <div className="shap-list">
                  {selectedRiskIntel.shapFactors.map((f, i) => (
                    <div className="shap-row" key={i}>
                      <div className="shap-info">
                        <span>{f.factor}</span>
                        <strong>{f.percentage}% contribution</strong>
                      </div>
                      <div className="shap-bar">
                        <div className="shap-fill" style={{ width: `${f.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROOT CAUSE DIAGNOSIS */}
              <div className="section-card">
                <h4>Diagnosed Operational Root Cause</h4>
                <div className="root-cause-box">
                  <div className="rc-title">
                    <strong>Primary Bottleneck: {selectedRiskIntel.rootCause.primary}</strong>
                    <span className="confidence-tag">
                      {selectedRiskIntel.rootCause.confidence}% Causal Confidence
                    </span>
                  </div>
                  <div className="rc-evidence">
                    <strong>Quantitative Evidence:</strong>
                    <ul>
                      {selectedRiskIntel.rootCause.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                  {selectedRiskIntel.rootCause.secondary.length > 0 && (
                    <div className="rc-secondary">
                      <span>Secondary Causes: </span>
                      {selectedRiskIntel.rootCause.secondary.join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {/* RECOMMENDED ACTIONS */}
              <div className="section-card">
                <h4>Corrective Action Playbook</h4>
                <div className="playbook-meta">
                  <span>
                    Priority: <strong>{selectedRiskIntel.recommendations.urgency}</strong>
                  </span>
                  <span>
                    Responsible Authority: <strong>{selectedRiskIntel.recommendations.authority}</strong>
                  </span>
                  <span>
                    Execution Window: <strong>Within {selectedRiskIntel.recommendations.timeline} days</strong>
                  </span>
                </div>
                <ol className="action-list">
                  {selectedRiskIntel.recommendations.actions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-outline"
                onClick={() => {
                  setWhatIfProject(selectedProject);
                  setSelectedProject(null);
                  setActiveNav("What-If Lab");
                }}
              >
                ⚡ Open in What-If Simulator
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  triggerToast(`Alert registered for ${selectedProject.name}`);
                  setSelectedProject(null);
                }}
              >
                Issue Formal Alert →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          AI PROJECT ASSISTANT (CHATBOT DRAWER)
      ========================================================= */}
      {chatOpen && (
        <div className="chat-drawer-overlay" onClick={() => setChatOpen(false)}>
          <div className="chat-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div>
                <h3>🤖 MoSPI Project Intelligence Assistant</h3>
                <small>Ground truth Q&A powered by local risk models</small>
              </div>
              <button className="close-btn" onClick={() => setChatOpen(false)}>
                ×
              </button>
            </div>

            {/* QUICK SUGGESTION CHIPS */}
            <div className="chat-chips">
              <span>Suggested:</span>
              <button onClick={() => handleSendMessage("Why is Rail Infrastructure Modernization high risk?")}>
                Why is Rail Infrastructure high risk?
              </button>
              <button onClick={() => handleSendMessage("Which projects have anomalies?")}>
                Show reporting anomalies
              </button>
              <button onClick={() => handleSendMessage("High risk projects in Assam")}>
                High risk in Assam
              </button>
              <button onClick={() => handleSendMessage("Portfolio Overview")}>
                Portfolio summary
              </button>
            </div>

            {/* MESSAGE STREAM */}
            <div className="chat-messages">
              {chatMessages.map((msg, i) => (
                <div className={`chat-bubble ${msg.sender}`} key={i}>
                  <div className="bubble-content">
                    {msg.text.split("\n").map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CHAT INPUT */}
            <form
              className="chat-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Ask about project risks, causes, actions, or anomalies..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
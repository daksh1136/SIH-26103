import React, { useEffect, useMemo, useState } from "react";
import {
  getProjects,
  getAlerts,
  getDashboardSummary,
  getDepartmentSummary,
  generateAlert,
} from "./api";

const API_BASE = "http://127.0.0.1:8000";

const statusConfig = {
  ON_TRACK: {
    label: "On Track",
    className: "on-track",
    icon: "✓",
  },
  AT_RISK: {
    label: "At Risk",
    className: "at-risk",
    icon: "!",
  },
  DELAYED: {
    label: "Delayed",
    className: "delayed",
    icon: "◷",
  },
  CRITICAL: {
    label: "Critical",
    className: "critical",
    icon: "⚠",
  },
};

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

function getStatus(status) {
  return (
    statusConfig[status] || {
      label: status || "Unknown",
      className: "unknown",
      icon: "?",
    }
  );
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [activeNav, setActiveNav] = useState("Dashboard");

  const [generating, setGenerating] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        projectsData,
        alertsData,
        summaryData,
        departmentsData,
      ] = await Promise.all([
        getProjects(),
        getAlerts(),
        getDashboardSummary(),
        getDepartmentSummary(),
      ]);

      setProjects(projectsData || []);
      setAlerts(alertsData || []);
      setSummary(summaryData || null);
      setDepartments(departmentsData || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to connect to ProjectPulse API. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createAlert(projectId) {
    try {
      setGenerating(projectId);
      setError("");

      await generateAlert(projectId);
      await loadData(true);
    } catch (err) {
      console.error(err);
      setError("Unable to generate alert.");
    } finally {
      setGenerating(null);
    }
  }

  async function openRiskAnalysis(project) {
    try {
      setSelectedProject(project);
      setRiskData(null);
      setRiskLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/projects/${project.id}/risk`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch risk analysis");
      }

      const data = await response.json();

      setRiskData(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load project risk analysis.");
    } finally {
      setRiskLoading(false);
    }
  }

  const totalProjects =
    summary?.total_projects ?? projects.length;

  const onTrack =
    summary?.status?.on_track ??
    projects.filter(
      (project) => project.status === "ON_TRACK"
    ).length;

  const atRisk =
    summary?.status?.at_risk ??
    projects.filter(
      (project) => project.status === "AT_RISK"
    ).length;

  const delayed =
    summary?.status?.delayed ??
    projects.filter(
      (project) => project.status === "DELAYED"
    ).length;

  const critical =
    summary?.status?.critical ??
    projects.filter(
      (project) => project.status === "CRITICAL"
    ).length;

  const approvedBudget =
    summary?.financial?.approved_budget ?? 0;

  const expenditure =
    summary?.financial?.expenditure ?? 0;

  const releasedFunds =
    summary?.financial?.released_funds ?? 0;

  const physicalProgress =
    summary?.progress?.average_physical ?? 0;

  const financialProgress =
    summary?.progress?.average_financial ?? 0;

  const budgetUsed =
    approvedBudget > 0
      ? Math.min(
          (expenditure / approvedBudget) * 100,
          100
        )
      : 0;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const text =
        `${project.name || ""} ${project.department || ""} ${
          project.location || ""
        }`.toLowerCase();

      const matchesSearch = text.includes(
        search.toLowerCase()
      );

      const matchesFilter =
        filter === "ALL" || project.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  const criticalProjects = projects.filter(
    (project) =>
      project.status === "CRITICAL" ||
      project.status === "DELAYED"
  );

  const riskVariance = riskData
    ? Number(
        riskData.project_id
          ? selectedProject?.financial_progress || 0
          : 0
      ) -
      Number(
        riskData.project_id
          ? selectedProject?.physical_progress || 0
          : 0
      )
    : 0;

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-brand">
          <div className="logo-mark">P</div>

          <div>
            <strong>ProjectPulse</strong>
            <span>MoSPI Monitoring Platform</span>
          </div>
        </div>

        <div className="loader" />

        <p>
          Loading national project intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ================================
          SIDEBAR
      ================================= */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark">P</div>

          <div>
            <strong>ProjectPulse</strong>
            <span>MoSPI</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="nav">
          {[
            ["Dashboard", "▦"],
            ["Projects", "▣"],
            ["Milestones", "◷"],
            ["Alerts", "⚠"],
            ["Analytics", "◒"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-button ${
                activeNav === label ? "active" : ""
              }`}
              onClick={() => setActiveNav(label)}
            >
              <span className="nav-icon">{icon}</span>

              <span>{label}</span>

              {label === "Alerts" &&
                alerts.length > 0 && (
                  <span className="nav-badge">
                    {alerts.length}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className="pulse-dot" />

            <div>
              <strong>System Operational</strong>
              <span>All services running</span>
            </div>
          </div>

          <div className="sih-tag">
            SIH 2026
            <span>SIH26103</span>
          </div>
        </div>
      </aside>

      {/* ================================
          MAIN
      ================================= */}

      <main className="main">
        {/* TOPBAR */}

        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu">
              ☰
            </button>

            <div className="search-box">
              <span>⌕</span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search projects, departments..."
              />

              <kbd>⌘ K</kbd>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="icon-button"
              onClick={() => loadData(true)}
              title="Refresh"
            >
              {refreshing ? "…" : "↻"}
            </button>

            <button className="notification">
              ♢

              {alerts.length > 0 && <span />}
            </button>

            <div className="profile">
              <div className="profile-avatar">
                AD
              </div>

              <div className="profile-text">
                <strong>Administrator</strong>
                <span>MoSPI</span>
              </div>

              <span className="chevron">⌄</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                NATIONAL PROJECT MONITORING
              </div>

              <h1>
                Good morning, Administrator
              </h1>

              <p>
                Here's the current implementation
                overview across monitored government
                projects.
              </p>
            </div>

            <div className="live-indicator">
              <span />
              Live monitoring
            </div>
          </div>

          {error && (
            <div className="error-box">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* ================================
              KPI
          ================================= */}

          <section className="kpi-grid">
            <div className="metric-card">
              <div className="metric-top">
                <div className="metric-icon blue">
                  ▦
                </div>

                <span className="metric-label">
                  TOTAL PROJECTS
                </span>
              </div>

              <div className="metric-value">
                {totalProjects}
              </div>

              <div className="metric-footer">
                <span className="trend positive">
                  ↑ 12.5%
                </span>

                <span>
                  vs last reporting cycle
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <div className="metric-icon green">
                  ✓
                </div>

                <span className="metric-label">
                  ON TRACK
                </span>
              </div>

              <div className="metric-value">
                {onTrack}
              </div>

              <div className="metric-footer">
                <span className="trend positive">
                  {totalProjects
                    ? Math.round(
                        (onTrack / totalProjects) *
                          100
                      )
                    : 0}
                  %
                </span>

                <span>of portfolio</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <div className="metric-icon amber">
                  !
                </div>

                <span className="metric-label">
                  AT RISK
                </span>
              </div>

              <div className="metric-value">
                {atRisk}
              </div>

              <div className="metric-footer">
                <span className="trend warning">
                  Requires attention
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <div className="metric-icon red">
                  ⚠
                </div>

                <span className="metric-label">
                  CRITICAL
                </span>
              </div>

              <div className="metric-value">
                {critical}
              </div>

              <div className="metric-footer">
                <span className="trend danger">
                  Immediate action
                </span>
              </div>
            </div>
          </section>

          {/* ================================
              FINANCIAL + HEALTH
          ================================= */}

          <section className="overview-grid">
            <div className="card financial-card">
              <div className="card-heading">
                <div>
                  <span className="section-label">
                    FINANCIAL OVERVIEW
                  </span>

                  <h2>
                    Portfolio expenditure
                  </h2>
                </div>

                <button className="more-button">
                  ⋮
                </button>
              </div>

              <div className="finance-main">
                <div>
                  <strong>
                    {money(expenditure)}
                  </strong>

                  <span>
                    of {money(approvedBudget)} approved
                    budget
                  </span>
                </div>

                <div className="finance-percentage">
                  {budgetUsed.toFixed(1)}%
                </div>
              </div>

              <div className="large-progress">
                <div
                  style={{
                    width: `${budgetUsed}%`,
                  }}
                />
              </div>

              <div className="finance-details">
                <div>
                  <span>Released Funds</span>

                  <strong>
                    {money(releasedFunds)}
                  </strong>
                </div>

                <div>
                  <span>Expenditure</span>

                  <strong>
                    {money(expenditure)}
                  </strong>
                </div>

                <div>
                  <span>Balance</span>

                  <strong>
                    {money(
                      Math.max(
                        approvedBudget -
                          expenditure,
                        0
                      )
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="card health-card">
              <div className="card-heading">
                <div>
                  <span className="section-label">
                    PROJECT HEALTH
                  </span>

                  <h2>
                    Portfolio distribution
                  </h2>
                </div>
              </div>

              <div className="health-content">
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(
                      #54ad7e 0deg ${
                        totalProjects
                          ? (onTrack /
                              totalProjects) *
                            360
                          : 0
                      }deg,
                      #dfad51 ${
                        totalProjects
                          ? (onTrack /
                              totalProjects) *
                            360
                          : 0
                      }deg ${
                        totalProjects
                          ? ((onTrack + atRisk) /
                              totalProjects) *
                            360
                          : 0
                      }deg,
                      #d77c50 ${
                        totalProjects
                          ? ((onTrack + atRisk) /
                              totalProjects) *
                            360
                          : 0
                      }deg ${
                        totalProjects
                          ? ((onTrack +
                              atRisk +
                              delayed) /
                              totalProjects) *
                            360
                          : 0
                      }deg,
                      #ce5555 ${
                        totalProjects
                          ? ((onTrack +
                              atRisk +
                              delayed) /
                              totalProjects) *
                            360
                          : 0
                      }deg 360deg
                    )`,
                  }}
                >
                  <div className="donut-inner">
                    <strong>
                      {totalProjects}
                    </strong>

                    <span>Projects</span>
                  </div>
                </div>

                <div className="health-legend">
                  <div>
                    <i className="dot green-dot" />
                    <span>On Track</span>
                    <strong>{onTrack}</strong>
                  </div>

                  <div>
                    <i className="dot amber-dot" />
                    <span>At Risk</span>
                    <strong>{atRisk}</strong>
                  </div>

                  <div>
                    <i className="dot orange-dot" />
                    <span>Delayed</span>
                    <strong>{delayed}</strong>
                  </div>

                  <div>
                    <i className="dot red-dot" />
                    <span>Critical</span>
                    <strong>{critical}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================
              IMPLEMENTATION
          ================================= */}

          <section className="card progress-card">
            <div className="card-heading">
              <div>
                <span className="section-label">
                  IMPLEMENTATION PERFORMANCE
                </span>

                <h2>
                  Physical vs financial progress
                </h2>
              </div>

              <span className="period">
                Current reporting cycle
              </span>
            </div>

            <div className="progress-comparison">
              <div className="comparison-item">
                <div className="comparison-label">
                  <span>
                    <i className="comparison-dot physical" />
                    Physical Progress
                  </span>

                  <strong>
                    {Number(
                      physicalProgress
                    ).toFixed(1)}
                    %
                  </strong>
                </div>

                <div className="comparison-track">
                  <div
                    className="physical-bar"
                    style={{
                      width: `${physicalProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="comparison-item">
                <div className="comparison-label">
                  <span>
                    <i className="comparison-dot financial" />
                    Financial Progress
                  </span>

                  <strong>
                    {Number(
                      financialProgress
                    ).toFixed(1)}
                    %
                  </strong>
                </div>

                <div className="comparison-track">
                  <div
                    className="financial-bar"
                    style={{
                      width: `${financialProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="variance-box">
                <span>PORTFOLIO VARIANCE</span>

                <strong>
                  {(
                    Number(financialProgress) -
                    Number(physicalProgress)
                  ).toFixed(1)}
                  %
                </strong>

                <small>
                  Financial progress ahead
                </small>
              </div>
            </div>
          </section>

          {/* ================================
              PRIORITY ATTENTION
          ================================= */}

          {criticalProjects.length > 0 && (
            <section className="attention-section">
              <div className="attention-heading">
                <div>
                  <span className="section-label">
                    PRIORITY ATTENTION
                  </span>

                  <h2>
                    Projects requiring intervention
                  </h2>
                </div>

                <span className="attention-count">
                  {criticalProjects.length} projects
                </span>
              </div>

              <div className="attention-grid">
                {criticalProjects
                  .slice(0, 3)
                  .map((project) => {
                    const config = getStatus(
                      project.status
                    );

                    return (
                      <div
                        className={`attention-card ${config.className}`}
                        key={project.id}
                      >
                        <div className="attention-icon">
                          {config.icon}
                        </div>

                        <div className="attention-body">
                          <div className="attention-status">
                            {config.label}
                          </div>

                          <strong>
                            {project.name}
                          </strong>

                          <span>
                            {project.department} •{" "}
                            {project.location}
                          </span>

                          <div className="attention-progress">
                            <div>
                              <span>
                                Physical progress
                              </span>

                              <strong>
                                {
                                  project.physical_progress
                                }
                                %
                              </strong>
                            </div>

                            <div className="mini-progress">
                              <span
                                style={{
                                  width: `${project.physical_progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ================================
              PROJECT TABLE
          ================================= */}

          <section className="card projects-card">
            <div className="card-heading project-heading">
              <div>
                <span className="section-label">
                  PROJECT PORTFOLIO
                </span>

                <h2>
                  All monitored projects
                </h2>
              </div>

              <div className="table-actions">
                <div className="filter-tabs">
                  {[
                    ["ALL", "All"],
                    ["ON_TRACK", "On Track"],
                    ["AT_RISK", "At Risk"],
                    ["DELAYED", "Delayed"],
                    ["CRITICAL", "Critical"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={
                        filter === value
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setFilter(value)
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>PROJECT</th>
                    <th>DEPARTMENT</th>
                    <th>LOCATION</th>
                    <th>PHYSICAL</th>
                    <th>FINANCIAL</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => {
                    const config = getStatus(
                      project.status
                    );

                    return (
                      <tr key={project.id}>
                        <td>
                          <div className="project-cell">
                            <div className="project-number">
                              {String(
                                project.id
                              ).padStart(2, "0")}
                            </div>

                            <div>
                              <strong>
                                {String(
                                  project.name || ""
                                ).replace(
                                  " - Demo",
                                  ""
                                )}
                              </strong>

                              <span>
                                Project #{project.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {project.department}
                        </td>

                        <td>
                          <span className="location">
                            ◉ {project.location}
                          </span>
                        </td>

                        <td>
                          <div className="table-progress">
                            <div className="table-track">
                              <span
                                style={{
                                  width: `${project.physical_progress}%`,
                                }}
                              />
                            </div>

                            <strong>
                              {
                                project.physical_progress
                              }
                              %
                            </strong>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {
                              project.financial_progress
                            }
                            %
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status ${config.className}`}
                          >
                            <i>
                              {config.icon}
                            </i>

                            {config.label}
                          </span>
                        </td>

                        <td>
                          <button
                            className="row-action"
                            title="View risk analysis"
                            onClick={() =>
                              openRiskAnalysis(
                                project
                              )
                            }
                          >
                            →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProjects.length === 0 && (
                <div className="empty">
                  No projects match your filters.
                </div>
              )}
            </div>
          </section>

          {/* ================================
              LOWER GRID
          ================================= */}

          <section className="lower-grid">
            <div className="card alerts-card">
              <div className="card-heading">
                <div>
                  <span className="section-label">
                    ALERT CENTER
                  </span>

                  <h2>Recent alerts</h2>
                </div>

                <span className="alert-total">
                  {alerts.length}
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="empty-alert">
                  <div>✓</div>

                  <strong>
                    No active alerts
                  </strong>

                  <span>
                    Generate an alert from the
                    project portfolio when
                    required.
                  </span>
                </div>
              ) : (
                <div className="alerts-list">
                  {alerts
                    .slice(0, 5)
                    .map((alert) => (
                      <div
                        className="alert-row"
                        key={alert.id}
                      >
                        <div
                          className={`alert-marker ${String(
                            alert.severity
                          ).toLowerCase()}`}
                        />

                        <div>
                          <strong>
                            {alert.category}
                          </strong>

                          <p>
                            {alert.message}
                          </p>

                          <span>
                            {alert.severity} •{" "}
                            {alert.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="card departments-card">
              <div className="card-heading">
                <div>
                  <span className="section-label">
                    DEPARTMENT PERFORMANCE
                  </span>

                  <h2>
                    Portfolio by department
                  </h2>
                </div>
              </div>

              <div className="department-list">
                {departments
                  .slice(0, 7)
                  .map(
                    (
                      department,
                      index
                    ) => {
                      const count =
                        department.project_count ||
                        0;

                      const percentage =
                        totalProjects
                          ? (count /
                              totalProjects) *
                            100
                          : 0;

                      return (
                        <div
                          className="department-row"
                          key={
                            department.department ||
                            index
                          }
                        >
                          <div className="department-info">
                            <strong>
                              {
                                department.department
                              }
                            </strong>

                            <span>
                              {count} project
                              {count !== 1
                                ? "s"
                                : ""}
                            </span>
                          </div>

                          <div className="department-meter">
                            <span
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            </div>
          </section>

          <footer>
            <span>
              ProjectPulse © 2026 • Ministry of
              Statistics & Programme
              Implementation
            </span>

            <span>
              SIH26103 • Integrated Project
              Monitoring Platform
            </span>
          </footer>
        </div>
      </main>

      {/* ================================
          RISK ANALYSIS DRAWER
      ================================= */}

      {selectedProject && (
        <div
          className="risk-overlay"
          onClick={() =>
            setSelectedProject(null)
          }
        >
          <div
            className="risk-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="risk-header">
              <div>
                <span className="section-label">
                  PROJECT RISK INTELLIGENCE
                </span>

                <h2>
                  {String(
                    selectedProject.name || ""
                  ).replace(
                    " - Demo",
                    ""
                  )}
                </h2>

                <p>
                  {selectedProject.department} •{" "}
                  {selectedProject.location}
                </p>
              </div>

              <button
                className="risk-close"
                onClick={() =>
                  setSelectedProject(null)
                }
              >
                ×
              </button>
            </div>

            {riskLoading ? (
              <div className="risk-loading">
                <div className="loader light-loader" />

                <p>
                  Analysing project risk...
                </p>
              </div>
            ) : riskData ? (
              <>
                <div className="risk-score-section">
                  <div
                    className={`risk-score ${String(
                      riskData.risk_level
                    ).toLowerCase()}`}
                  >
                    <strong>
                      {riskData.risk_score}
                    </strong>

                    <span>/ 100</span>
                  </div>

                  <div>
                    <span className="risk-label">
                      CURRENT RISK LEVEL
                    </span>

                    <h3>
                      {riskData.risk_level}
                    </h3>

                    <p>
                      {
                        riskData.recommendation
                      }
                    </p>
                  </div>
                </div>

                <div className="risk-factors">
                  <div className="risk-section-title">
                    <span>⚠</span>
                    Risk factors identified
                  </div>

                  {riskData.risk_factors?.length >
                  0 ? (
                    riskData.risk_factors.map(
                      (factor, index) => (
                        <div
                          className="risk-factor"
                          key={index}
                        >
                          <span>
                            {index + 1}
                          </span>

                          <p>
                            {factor}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="risk-safe">
                      ✓ No significant risk
                      factors detected.
                    </div>
                  )}
                </div>

                <div className="risk-metrics">
                  <div>
                    <span>
                      Physical Progress
                    </span>

                    <strong>
                      {
                        selectedProject.physical_progress
                      }
                      %
                    </strong>
                  </div>

                  <div>
                    <span>
                      Financial Progress
                    </span>

                    <strong>
                      {
                        selectedProject.financial_progress
                      }
                      %
                    </strong>
                  </div>

                  <div>
                    <span>Variance</span>

                    <strong>
                      {riskVariance.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <div className="risk-footer">
                  <span>
                    Explainable rule-based
                    assessment
                  </span>

                  <button
                    disabled={
                      generating ===
                      selectedProject.id
                    }
                    onClick={async () => {
                      await createAlert(
                        selectedProject.id
                      );

                      setSelectedProject(null);
                    }}
                  >
                    {generating ===
                    selectedProject.id
                      ? "Generating..."
                      : "Generate Alert →"}
                  </button>
                </div>
              </>
            ) : (
              <div className="risk-loading">
                <p>
                  Unable to load risk analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
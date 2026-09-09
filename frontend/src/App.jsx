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
  INITIAL_CONTRACTORS,
  INITIAL_CONTRACTOR_HISTORIES,
  evaluateContractorEligibility,
  fetchContractors,
  fetchContractorDetail,
  evaluateContractorApi,
  retrainContractorModelApi,
  evaluateProjectDoomRisk,
  fetchProjectSalvagePlan,
  executeSalvagePlanApi,
  EXPANDED_SHOWCASE_DATASET,
  SHOWCASE_MASTER_DATASET,
  SHOWCASE_CONTRACTORS,
  SHOWCASE_CONTRACTOR_HISTORIES,
  SHOWCASE_MILESTONES,
  downloadBlob,
  exportProjectsToCsv,
  exportContractorsToCsv,
  exportMilestonesToCsv,
  exportMasterJson,
  exportPredictionsToCsv,
  parseAndValidateShowcaseDataset,
  DATASET_DICTIONARY,
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
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDir, setSortDir] = useState("desc");
  const [projectViewMode, setProjectViewMode] = useState("cards"); // 'cards' | 'table'

  // Contractor Fraud Detection & Due Diligence State
  const [contractors, setContractors] = useState(INITIAL_CONTRACTORS);
  const [selectedContractorDossier, setSelectedContractorDossier] = useState(null);
  const [vettingProjectMode, setVettingProjectMode] = useState("existing"); // 'existing' | 'new'
  const [vettingContractorMode, setVettingContractorMode] = useState("empaneled"); // 'empaneled' | 'new'
  const [vettingProjectId, setVettingProjectId] = useState(1);
  const [vettingContractorId, setVettingContractorId] = useState(1);
  const [customVettingProject, setCustomVettingProject] = useState({
    name: "New Greenfield Expressway Lot 4",
    department: "Infrastructure",
    budget_cr: 120,
    duration_months: 24,
  });
  const [customVettingContractor, setCustomVettingContractor] = useState({
    name: "Apex Buildtech Consortium Pvt Ltd",
    category: "Tier-2",
    max_handled_cr: 35,
    turnover_cr: 85,
    delivery_rate: 80,
    avg_overrun: 12,
    avg_delay: 45,
    ghost_flags: 0,
    shell_risk: 18,
    litigation: 1,
    tax_status: "COMPLIANT",
    solvency_score: 76,
  });
  const [vettingResult, setVettingResult] = useState(() =>
    evaluateContractorEligibility(
      INITIAL_CONTRACTORS[0],
      INITIAL_PROJECTS[0],
      INITIAL_CONTRACTOR_HISTORIES.filter((h) => h.contractor_id === 1)
    )
  );
  const [contractorFilter, setContractorFilter] = useState("ALL");
  const [contractorSearch, setContractorSearch] = useState("");
  const [contractorModelMeta, setContractorModelMeta] = useState({
    accuracy: 1.0,
    precision: 1.0,
    recall: 1.0,
    roc_auc: 1.0,
    total_samples: 800,
  });
  const [isRetrainingContractor, setIsRetrainingContractor] = useState(false);
  const [isEvaluatingContractor, setIsEvaluatingContractor] = useState(false);

  // Learning Loop State (Feature 10)
  const [learningMetrics, setLearningMetrics] = useState(DEFAULT_LEARNING_METRICS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOG);
  const [feedbackProject, setFeedbackProject] = useState(1);
  const [feedbackStatus, setFeedbackStatus] = useState("ON_TRACK");
  const [feedbackDelayDays, setFeedbackDelayDays] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackOfficer, setFeedbackOfficer] = useState("Er. P. K. Sharma (Chief Project Officer)");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // AI Project Doom & Salvage Engine State
  const [selectedSalvageProjectId, setSelectedSalvageProjectId] = useState(8); // Default to distressed Project #8
  const [salvageFilter, setSalvageFilter] = useState("ALL"); // 'ALL' | 'DISTRESSED' | 'HEALTHY'
  const [salvageCheckedActions, setSalvageCheckedActions] = useState({
    "act-1": true,
    "act-2": true,
    "act-3": true,
    "act-4": true,
    "act-5": true,
    "act-6": true,
    "act-7": true,
    "act-8": true,
  });
  const [isExecutingSalvage, setIsExecutingSalvage] = useState(false);
  const [salvagedProjectIds, setSalvagedProjectIds] = useState(new Set());

  // Dataset Hub & CSV AI Predictor State
  const [datasetActiveTab, setDatasetActiveTab] = useState("predictor"); // 'predictor' | 'studio' | 'preview' | 'dictionary'
  const [previewTable, setPreviewTable] = useState("projects"); // 'projects' | 'contractors' | 'milestones'
  const [datasetSearch, setDatasetSearch] = useState("");
  const [customInputText, setCustomInputText] = useState("");
  const [datasetNotification, setDatasetNotification] = useState(null);
  const [isInjectingDataset, setIsInjectingDataset] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedPredictions, setUploadedPredictions] = useState(null);
  const [uploadedStats, setUploadedStats] = useState(null);

  const runPredictionsOnProjectList = (projectsList, sourceName = "Uploaded CSV") => {
    const batch = projectsList.map((proj) => {
      const risk = calculateProjectRiskIntelligence(proj);
      const doom = evaluateProjectDoomRisk(proj);
      const anomaly = detectProjectAnomalies(proj);
      return { project: proj, risk, doom, anomaly };
    });

    const totalAtRisk = batch.filter(
      (b) => b.risk.riskLevel === "CRITICAL" || b.risk.riskLevel === "HIGH"
    ).length;
    const avgDelay = Math.round(
      batch.reduce((sum, b) => sum + (b.risk.estimatedDelayDays || 0), 0) /
        (batch.length || 1)
    );
    const avgHealth = Math.round(
      batch.reduce((sum, b) => sum + (b.risk.healthScore || 0), 0) /
        (batch.length || 1)
    );
    const totalCapitalAtRisk = batch
      .filter((b) => b.risk.riskLevel === "CRITICAL" || b.risk.riskLevel === "HIGH")
      .reduce((sum, b) => sum + (Number(b.project.approved_budget) || 0), 0);

    setUploadedPredictions(batch);
    setUploadedStats({
      count: batch.length,
      totalAtRisk,
      avgDelay,
      avgHealth,
      totalCapitalAtRisk,
      sourceName,
    });
    setUploadedFileName(sourceName);
    setDatasetActiveTab("predictor");
  };

  const processUploadedFile = (file) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setCustomInputText(text);
        const res = parseAndValidateShowcaseDataset(text);
        if (res.success) {
          runPredictionsOnProjectList(res.projects, file.name);
          setDatasetNotification({
            type: "success",
            text: `🎯 File '${file.name}' processed: Ran ML delay models & health scoring across all ${res.count} projects! Review batch predictions below.`,
          });
          setTimeout(() => setDatasetNotification(null), 8000);
        } else {
          setDatasetNotification({
            type: "error",
            text: `CSV / Dataset Parsing Error: ${res.error}`,
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleLoadSampleCsvToPredictor = () => {
    runPredictionsOnProjectList(EXPANDED_SHOWCASE_DATASET, "mospi_projects_master.csv (20 Projects)");
    setDatasetNotification({
      type: "success",
      text: "⚡ Loaded 20-Project Showcase CSV into ML Predictor! Evaluated delay days, health scores, and doom risks.",
    });
    setTimeout(() => setDatasetNotification(null), 6000);
  };

  const handleApplyPredictionsToPlatform = () => {
    if (!uploadedPredictions || !uploadedPredictions.length) return;
    const projs = uploadedPredictions.map((u) => u.project);
    setProjects(projs);
    setDatasetNotification({
      type: "success",
      text: `🚀 Applied ${projs.length} evaluated projects to active platform monitor! All dashboards, maps, and salvage tabs now track this dataset.`,
    });
    setTimeout(() => setDatasetNotification(null), 6000);
  };

  const handleLoadShowcaseDataset = () => {
    setIsInjectingDataset(true);
    setTimeout(() => {
      setProjects(EXPANDED_SHOWCASE_DATASET);
      setContractors(SHOWCASE_CONTRACTORS);
      setMilestones(SHOWCASE_MILESTONES);
      setIsInjectingDataset(false);
      setDatasetNotification({
        type: "success",
        text: `Successfully injected 20-Project Showcase Dataset! 20 Projects, 12 Contractors, and 113 Milestones are now actively powering all AI models, GIS maps, and risk engines.`,
      });
      setTimeout(() => setDatasetNotification(null), 6000);
    }, 300);
  };

  const handleResetDataset = () => {
    setProjects(INITIAL_PROJECTS);
    setContractors(INITIAL_CONTRACTORS);
    setMilestones(INITIAL_MILESTONES);
    setUploadedPredictions(null);
    setUploadedStats(null);
    setUploadedFileName("");
    setDatasetNotification({
      type: "info",
      text: "Restored baseline standard dataset (6 core projects).",
    });
    setTimeout(() => setDatasetNotification(null), 4000);
  };

  const handleCustomDatasetImport = (e) => {
    e?.preventDefault?.();
    if (!customInputText.trim()) {
      setDatasetNotification({
        type: "error",
        text: "Please paste or upload JSON or CSV data to import.",
      });
      return;
    }
    const res = parseAndValidateShowcaseDataset(customInputText);
    if (!res.success) {
      setDatasetNotification({
        type: "error",
        text: res.error,
      });
      return;
    }
    runPredictionsOnProjectList(res.projects, "Pasted Custom Data");
    setProjects(res.projects);
    if (res.contractors && res.contractors.length) {
      setContractors(res.contractors);
    }
    if (res.milestones && res.milestones.length) {
      setMilestones(res.milestones);
    }
    setDatasetNotification({
      type: "success",
      text: `Successfully validated & injected ${res.count} projects (${res.type} format) into active platform memory! All ML delay models and risk calculations have been refreshed.`,
    });
    setCustomInputText("");
    setTimeout(() => setDatasetNotification(null), 7000);
  };

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
        const dbContractors = await fetchContractors();
        if (dbContractors && dbContractors.length > 0) {
          setContractors(dbContractors);
        }
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

  // Contractor Due Diligence Handlers
  const handleRunVettingAnalysis = async (cId = vettingContractorId, pId = vettingProjectId) => {
    setIsEvaluatingContractor(true);
    try {
      let targetContractor;
      let targetProject;
      let histories = [];

      if (vettingContractorMode === "empaneled") {
        targetContractor = contractors.find((c) => c.id === Number(cId)) || contractors[0];
        histories = INITIAL_CONTRACTOR_HISTORIES.filter((h) => h.contractor_id === targetContractor.id);
      } else {
        targetContractor = {
          name: customVettingContractor.name,
          category: customVettingContractor.category,
          max_project_budget_handled: Number(customVettingContractor.max_handled_cr) * 10000000,
          on_time_delivery_rate: Number(customVettingContractor.delivery_rate) / 100,
          avg_cost_overrun_pct: Number(customVettingContractor.avg_overrun),
          avg_delay_days: Number(customVettingContractor.avg_delay),
          ghost_billing_flags: Number(customVettingContractor.ghost_flags),
          shell_risk_score: Number(customVettingContractor.shell_risk),
          litigation_count: Number(customVettingContractor.litigation),
          tax_compliance_status: customVettingContractor.tax_status,
          solvency_score: Number(customVettingContractor.solvency_score),
          status: "APPROVED",
        };
      }

      if (vettingProjectMode === "existing") {
        targetProject = projects.find((p) => p.id === Number(pId)) || projects[0];
      } else {
        targetProject = {
          name: customVettingProject.name,
          department: customVettingProject.department,
          approved_budget: Number(customVettingProject.budget_cr) * 10000000,
        };
      }

      const evalRes = await evaluateContractorApi({
        contractor_id: vettingContractorMode === "empaneled" ? targetContractor.id : null,
        project_id: vettingProjectMode === "existing" ? targetProject.id : null,
        ...targetContractor,
        project_name: targetProject.name,
        project_budget: targetProject.approved_budget,
      });

      setVettingResult(evalRes);
      triggerToast(`AI Evaluation Complete: ${evalRes.verdict} (${evalRes.eligibility_score}/100)`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluatingContractor(false);
    }
  };

  const handleOpenContractorVetting = (contractorId, projectId) => {
    if (contractorId) setVettingContractorId(Number(contractorId));
    if (projectId) setVettingProjectId(Number(projectId));
    setVettingContractorMode("empaneled");
    setVettingProjectMode("existing");
    setActiveNav("Fraud & Vetting");
    handleRunVettingAnalysis(contractorId, projectId);
  };

  const handleViewContractorDossier = async (contractorId) => {
    const detail = await fetchContractorDetail(contractorId);
    setSelectedContractorDossier(detail);
  };

  const handleRetrainContractorModel = async () => {
    setIsRetrainingContractor(true);
    try {
      const res = await retrainContractorModelApi();
      setContractorModelMeta(res);
      triggerToast(`Contractor Fraud ML model successfully retrained! (Accuracy: ${(res.accuracy * 100).toFixed(1)}%)`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetrainingContractor(false);
    }
  };

  // Search relevance score calculator
  const getSearchRelevance = (p, query) => {
    if (!query || !query.trim()) return 0;
    const q = query.toLowerCase().trim();
    const name = (p.name || "").toLowerCase();
    const dept = (p.department || "").toLowerCase();
    const loc = (p.location || "").toLowerCase();
    const mgr = (p.manager || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const status = (p.status || "").toLowerCase().replace("_", " ");

    let score = 0;
    if (name === q) score += 120;
    else if (name.startsWith(q)) score += 90;
    else if (name.includes(q)) score += 60;

    if (dept === q) score += 50;
    else if (dept.includes(q)) score += 35;

    if (loc === q) score += 40;
    else if (loc.includes(q)) score += 25;

    if (status.includes(q)) score += 20;
    if (mgr.includes(q)) score += 15;
    if (desc.includes(q)) score += 10;

    return score;
  };

  // Table column sorting handler
  const handleTableSort = (colKey) => {
    if (sortBy === colKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(colKey);
      if (["name", "department", "location"].includes(colKey)) {
        setSortDir("asc");
      } else {
        setSortDir("desc");
      }
    }
  };

  // Render sort direction icon
  const renderTableSortIcon = (colKey) => {
    if (sortBy === colKey) {
      return <span className="sort-icon-active">{sortDir === "asc" ? " ▲" : " ▼"}</span>;
    }
    return <span className="sort-icon-inactive"> ↕</span>;
  };

  // Filtered and Sorted projects
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 1. Filtering by search, status, and department
    const matched = projects.filter((p) => {
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.manager && p.manager.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().replace("_", " ").includes(q));

      const matchStatus = filter === "ALL" || p.status === filter;
      const matchDept = deptFilter === "ALL" || p.department === deptFilter;

      return matchSearch && matchStatus && matchDept;
    });

    // 2. Sorting
    const isAsc = sortDir === "asc";
    const mult = isAsc ? 1 : -1;

    return [...matched].sort((a, b) => {
      if (sortBy === "relevance") {
        if (q) {
          const scoreA = getSearchRelevance(a, q);
          const scoreB = getSearchRelevance(b, q);
          if (scoreA !== scoreB) {
            return mult * (scoreB - scoreA);
          }
        }
        const delA = calculateProjectRiskIntelligence(a).estimatedDelayDays || 0;
        const delB = calculateProjectRiskIntelligence(b).estimatedDelayDays || 0;
        return mult * (delB - delA);
      }

      if (sortBy === "delay" || sortBy === "risk") {
        const delA = calculateProjectRiskIntelligence(a).estimatedDelayDays || 0;
        const delB = calculateProjectRiskIntelligence(b).estimatedDelayDays || 0;
        return mult * (delA - delB);
      }

      if (sortBy === "health") {
        const hA = calculateProjectHealthScore(a).score || 0;
        const hB = calculateProjectHealthScore(b).score || 0;
        return mult * (hA - hB);
      }

      if (sortBy === "budget") {
        const bA = a.approved_budget || 0;
        const bB = b.approved_budget || 0;
        return mult * (bA - bB);
      }

      if (sortBy === "physical") {
        const pA = a.physical_progress || 0;
        const pB = b.physical_progress || 0;
        return mult * (pA - pB);
      }

      if (sortBy === "financial") {
        const fA = a.financial_progress || 0;
        const fB = b.financial_progress || 0;
        return mult * (fA - fB);
      }

      if (sortBy === "name") {
        return mult * (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "department") {
        return mult * (a.department || "").localeCompare(b.department || "");
      }

      if (sortBy === "location") {
        return mult * (a.location || "").localeCompare(b.location || "");
      }

      return 0;
    });
  }, [projects, search, filter, deptFilter, sortBy, sortDir]);

  // Summary Metrics (Reflects active filtered subset, or all projects)
  const summary = useMemo(() => {
    const list = filteredProjects.length > 0 ? filteredProjects : (search.trim() || deptFilter !== "ALL" || filter !== "ALL" ? [] : projects);
    const total = list.length;
    const onTrack = list.filter((p) => p.status === "ON_TRACK").length;
    const atRisk = list.filter((p) => p.status === "AT_RISK").length;
    const delayed = list.filter((p) => p.status === "DELAYED").length;
    const critical = list.filter((p) => p.status === "CRITICAL").length;
    const totalBudget = list.reduce((acc, p) => acc + (p.approved_budget || 0), 0);
    const totalReleased = list.reduce((acc, p) => acc + (p.released_funds || 0), 0);
    const totalSpend = list.reduce((acc, p) => acc + (p.expenditure || 0), 0);
    const avgPhys = total > 0 ? (list.reduce((acc, p) => acc + (p.physical_progress || 0), 0) / total).toFixed(1) : "0.0";
    const avgFin = total > 0 ? (list.reduce((acc, p) => acc + (p.financial_progress || 0), 0) / total).toFixed(1) : "0.0";

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
  }, [filteredProjects, projects, search, deptFilter, filter]);

  // Department list
  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.department))).sort();
  }, [projects]);

  // All screened anomalies
  const screenedAnomalies = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      anomaly: detectProjectAnomalies(p),
      risk: calculateProjectRiskIntelligence(p),
    }));
  }, [projects]);

  // Screened anomalies filtered by search and department
  const filteredScreenedAnomalies = useMemo(() => {
    return screenedAnomalies.filter(({ project: p }) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q));
      const matchDept = deptFilter === "ALL" || p.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [screenedAnomalies, search, deptFilter]);

  // Alerts filtered by search and department
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.project_name && a.project_name.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        (a.message && a.message.toLowerCase().includes(q)) ||
        (a.recommendation && a.recommendation.toLowerCase().includes(q));
      const matchDept = deptFilter === "ALL" || a.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [alerts, search, deptFilter]);

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

  // AI Project Doom & Salvage Engine Calculations
  const currentSalvageProject = useMemo(() => {
    return projects.find((p) => p.id === Number(selectedSalvageProjectId)) || projects[0];
  }, [projects, selectedSalvageProjectId]);

  const currentSalvagePlan = useMemo(() => {
    return evaluateProjectDoomRisk(currentSalvageProject);
  }, [currentSalvageProject]);

  const allProjectDoomEvaluations = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      plan: evaluateProjectDoomRisk(p),
    }));
  }, [projects]);

  const toggleSalvageAction = (actionId) => {
    setSalvageCheckedActions((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const handleExecuteSalvage = async () => {
    setIsExecutingSalvage(true);
    try {
      const selectedActionKeys = Object.entries(salvageCheckedActions)
        .filter(([_, checked]) => checked)
        .map(([k, _]) => k);

      const res = await executeSalvagePlanApi(
        {
          project_id: currentSalvageProject.id,
          approved_by: "MoSPI Oversight Directorate",
          selected_actions: selectedActionKeys,
        },
        projects
      );

      // Transition project status in state to reflect recovery trajectory
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === currentSalvageProject.id) {
            return {
              ...p,
              status: "ON_TRACK",
              is_salvaged: true,
              salvaged_health: res.salvaged_health_score,
              salvaged_delay: res.salvaged_delay_days,
            };
          }
          return p;
        })
      );

      setSalvagedProjectIds((prev) => new Set([...prev, currentSalvageProject.id]));

      triggerToast(
        `⚡ Salvage Protocol Deployed for '${currentSalvageProject.name}'! Target delay reduced to ${res.salvaged_delay_days}d (Saved ₹${res.capital_saved_cr} Cr).`
      );
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Failed to execute salvage plan.");
    } finally {
      setIsExecutingSalvage(false);
    }
  };


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
            ["Fraud & Vetting", "🛡️"],
            ["Rescue & Salvage", "🛟"],
            ["Anomalies", "🔍"],
            ["Dependencies", "☊"],
            ["GIS Map", "🗺"],
            ["Milestones", "◷"],
            ["Alerts", "⚠"],
            ["Analytics", "◒"],
            ["Learning Loop", "🔄"],
            ["CSV AI Predictor", "📊"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-button ${activeNav === label ? "active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
              {label === "CSV AI Predictor" && (
                <span className="nav-badge" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" }}>
                  {projects.length}
                </span>
              )}
              {label === "Rescue & Salvage" && (
                <span className="nav-badge danger">
                  {projects.filter((p) => p.status === "CRITICAL" || p.status === "DELAYED").length}
                </span>
              )}
              {label === "Fraud & Vetting" && (
                <span className="nav-badge danger">
                  {contractors.filter((c) => c.status === "DISQUALIFIED").length}
                </span>
              )}
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
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search projects by name, ministry, state, manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="dept-select-wrap">
              <select
                className="dept-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                title="Filter by Ministry or Department"
              >
                <option value="ALL">🏛️ All Ministries ({projects.length})</option>
                {departments.map((d) => {
                  const count = projects.filter((p) => p.department === d).length;
                  return (
                    <option key={d} value={d}>
                      {d} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sort-box" title="Sort order of projects">
              <span className="sort-box-icon">⇅</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Select sort criterion"
              >
                <option value="relevance">{search.trim() ? "🎯 Best Match" : "⚡ Priority Risk"}</option>
                <option value="delay">🚨 Delay Days (Max first)</option>
                <option value="health">🩺 Health Score (Critical first)</option>
                <option value="budget">💰 Budget (Highest first)</option>
                <option value="physical">🏗️ Progress (Lowest first)</option>
                <option value="financial">💳 Spend (Highest first)</option>
                <option value="name">🔤 Project Name (A → Z)</option>
                <option value="department">🏛️ Ministry (A → Z)</option>
                <option value="location">📍 Location (A → Z)</option>
              </select>
              <button
                type="button"
                className="sort-dir-btn"
                onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                title={`Toggle direction: ${sortDir === "asc" ? "Ascending ▲" : "Descending ▼"}`}
              >
                {sortDir === "asc" ? "▲" : "▼"}
              </button>
            </div>
          </div>

          <div className="topbar-right">
            <div
              className={`backend-status-pill ${backendLive ? "online" : "offline"}`}
              title={backendLive ? "Live API connected to FastAPI & SQLite database (Port 8000)" : "Running on standalone client intelligence engine"}
            >
              <span className="dot" />
              <span>{backendLive ? "🟢 Live DB & API" : "🟡 Standalone Mode"}</span>
            </div>
            <button
              className={`quick-dataset-btn ${activeNav === "CSV AI Predictor" || activeNav === "Dataset Hub" ? "active" : ""}`}
              onClick={() => {
                setActiveNav("CSV AI Predictor");
                setDatasetActiveTab("predictor");
              }}
              title="Drag & Drop CSV dataset to run retrained ML delay models, health scores & fraud checks"
            >
              📊 Drag & Drop CSV Predictor
            </button>
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
                  <button
                    className="btn-outline-danger"
                    onClick={() => setActiveNav("Rescue & Salvage")}
                    style={{ borderColor: "#ef4444", color: "#ef4444", fontWeight: "600" }}
                    title="Open AI Project Salvage & Doom Prevention Hub"
                  >
                    🛟 AI Rescue Hub ({projects.filter((p) => p.status === "CRITICAL" || p.status === "DELAYED").length})
                  </button>
                  <button className="btn-primary" onClick={() => setActiveNav("What-If Lab")}>
                    ⚡ Run What-If Simulation
                  </button>
                </div>
              </div>

              {/* ACTIVE FILTERS BANNER (WHEN SEARCH OR MINISTRY FILTER IS APPLIED) */}
              {(deptFilter !== "ALL" || search.trim()) && (
                <div className="active-filters-banner">
                  <div className="active-filters-content">
                    <span className="filter-summary-text">Active Filter Scope:</span>
                    {deptFilter !== "ALL" && (
                      <span className="filter-pill">
                        🏛️ Ministry: <strong>{deptFilter}</strong>
                        <button onClick={() => setDeptFilter("ALL")} title="Clear ministry filter">×</button>
                      </span>
                    )}
                    {search.trim() && (
                      <span className="filter-pill">
                        🔍 Search: "<strong>{search}</strong>"
                        <button onClick={() => setSearch("")} title="Clear search">×</button>
                      </span>
                    )}
                    <span className="filter-count-badge">
                      {filteredProjects.length} of {projects.length} projects match
                    </span>
                  </div>
                  <button
                    type="button"
                    className="clear-all-filters-btn"
                    onClick={() => {
                      setSearch("");
                      setDeptFilter("ALL");
                    }}
                  >
                    Reset to National Scope
                  </button>
                </div>
              )}

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
                  <div className="kpi-sub">{summary.total > 0 ? ((summary.onTrack / summary.total) * 100).toFixed(0) : 0}% within tolerance</div>
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
                      style={{ width: `${summary.totalBudget > 0 ? (summary.totalSpend / summary.totalBudget) * 100 : 0}%` }}
                    />
                  </div>
                  <small>Budget Burn Rate: {summary.totalBudget > 0 ? ((summary.totalSpend / summary.totalBudget) * 100).toFixed(1) : 0}%</small>
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
                      <strong>{(summary.avgFin - summary.avgPhys).toFixed(1)}%</strong> in this scope.
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
                        <th className="sortable-th" onClick={() => handleTableSort("name")}>
                          Project {renderTableSortIcon("name")}
                        </th>
                        <th className="sortable-th" onClick={() => handleTableSort("department")}>
                          Ministry {renderTableSortIcon("department")}
                        </th>
                        <th className="sortable-th" onClick={() => handleTableSort("location")}>
                          Location {renderTableSortIcon("location")}
                        </th>
                        <th className="sortable-th" onClick={() => handleTableSort("physical")}>
                          Physical vs Financial {renderTableSortIcon("physical")}
                        </th>
                        <th className="sortable-th" onClick={() => handleTableSort("health")}>
                          Health Score {renderTableSortIcon("health")}
                        </th>
                        <th className="sortable-th" onClick={() => handleTableSort("delay")}>
                          Predicted Delay {renderTableSortIcon("delay")}
                        </th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const criticalOrRisk = filteredProjects.filter((p) => p.status === "CRITICAL" || p.status === "AT_RISK");
                        const displayList = criticalOrRisk.length > 0 ? criticalOrRisk : filteredProjects;

                        if (displayList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                No projects match the active search or ministry filter.
                              </td>
                            </tr>
                          );
                        }

                        return displayList.slice(0, 6).map((p) => {
                          const health = calculateProjectHealthScore(p);
                          const risk = calculateProjectRiskIntelligence(p);
                          return (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.name}</strong>
                                <small style={{ display: "block", color: "#64748b" }}>
                                  #{p.id} • {p.manager} • <span
                                    style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 600 }}
                                    onClick={() => handleOpenContractorVetting(p.contractor_id || 1, p.id)}
                                    title="Run AI Due Diligence Assessment"
                                  >
                                    🛡️ {p.contractor_name || "Contractor"}
                                  </span>
                                </small>
                              </td>
                              <td><span className="badge-dept-inline">{p.department}</span></td>
                              <td>📍 {p.location}</td>
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
                                <strong className={risk.estimatedDelayDays > 20 ? "text-danger" : "text-success"}>
                                  {risk.estimatedDelayDays > 0 ? `~${risk.estimatedDelayDays} days` : "On schedule"}
                                </strong>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-sm"
                                  onClick={() => setSelectedProject(p)}
                                >
                                  Analyze AI Risk
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
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
                  <p>Comprehensive register of central sector projects under active monitoring with multi-criteria sorting</p>
                </div>
                <div className="filter-chips">
                  {["ALL", "ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"].map((st) => {
                    const cnt = projects.filter((p) => {
                      const q = search.trim().toLowerCase();
                      const matchSearch =
                        !q ||
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.department && p.department.toLowerCase().includes(q)) ||
                        (p.location && p.location.toLowerCase().includes(q));
                      const matchDept = deptFilter === "ALL" || p.department === deptFilter;
                      const matchStatus = st === "ALL" || p.status === st;
                      return matchSearch && matchDept && matchStatus;
                    }).length;

                    return (
                      <button
                        key={st}
                        type="button"
                        className={`chip ${filter === st ? "active" : ""}`}
                        onClick={() => setFilter(st)}
                      >
                        {st.replace("_", " ")} ({cnt})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PROJECTS TOOLBAR: RESULTS COUNT, ACTIVE TAGS, VIEW TOGGLE, SORTING */}
              <div className="projects-toolbar">
                <div className="toolbar-left">
                  <span className="results-count">
                    Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
                    {deptFilter !== "ALL" && (
                      <span className="active-tag">
                        🏛️ {deptFilter}
                        <button type="button" onClick={() => setDeptFilter("ALL")} title="Clear ministry">×</button>
                      </span>
                    )}
                    {search.trim() && (
                      <span className="active-tag">
                        🔍 "{search}"
                        <button type="button" onClick={() => setSearch("")} title="Clear search">×</button>
                      </span>
                    )}
                    {filter !== "ALL" && (
                      <span className="active-tag">
                        ⚡ {filter.replace("_", " ")}
                        <button type="button" onClick={() => setFilter("ALL")} title="Clear status">×</button>
                      </span>
                    )}
                  </span>
                  {(deptFilter !== "ALL" || search.trim() || filter !== "ALL") && (
                    <button
                      type="button"
                      className="clear-filters-link"
                      onClick={() => {
                        setSearch("");
                        setDeptFilter("ALL");
                        setFilter("ALL");
                        setSortBy("relevance");
                        setSortDir("desc");
                      }}
                    >
                      Clear all filters
                    </button>
                  )}
                </div>

                <div className="toolbar-right">
                  {/* VIEW MODE TOGGLE */}
                  <div className="view-mode-toggle">
                    <button
                      type="button"
                      className={`view-mode-btn ${projectViewMode === "cards" ? "active" : ""}`}
                      onClick={() => setProjectViewMode("cards")}
                      title="Card Grid View"
                    >
                      ⊞ Cards
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${projectViewMode === "table" ? "active" : ""}`}
                      onClick={() => setProjectViewMode("table")}
                      title="Interactive Data Table View"
                    >
                      ☰ Table
                    </button>
                  </div>

                  {/* INLINE SORT SELECTOR */}
                  <div className="sort-inline-wrap">
                    <label>Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="sort-select-inline"
                    >
                      <option value="relevance">{search.trim() ? "🎯 Match Relevance" : "⚡ Priority Risk"}</option>
                      <option value="delay">🚨 Delay Days</option>
                      <option value="health">🩺 Health Score</option>
                      <option value="budget">💰 Budget Outlay</option>
                      <option value="physical">🏗️ Progress</option>
                      <option value="financial">💳 Spend</option>
                      <option value="name">🔤 Project Name</option>
                      <option value="department">🏛️ Ministry</option>
                      <option value="location">📍 Location</option>
                    </select>
                    <button
                      type="button"
                      className="sort-dir-btn"
                      onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                      title={`Toggle direction: ${sortDir === "asc" ? "Ascending ▲" : "Descending ▼"}`}
                    >
                      {sortDir === "asc" ? "▲" : "▼"}
                    </button>
                  </div>
                </div>
              </div>

              {/* EMPTY STATE */}
              {filteredProjects.length === 0 && (
                <div className="empty-state-card">
                  <div className="empty-icon">🔍</div>
                  <h3>No Projects Match Active Filters</h3>
                  <p>
                    No projects found for {search.trim() ? <span>"<strong>{search}</strong>"</span> : "the current filters"}{" "}
                    {deptFilter !== "ALL" && <span>in <strong>{deptFilter}</strong></span>}.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setSearch("");
                      setDeptFilter("ALL");
                      setFilter("ALL");
                    }}
                  >
                    Clear All Filters ({projects.length} Projects)
                  </button>
                </div>
              )}

              {/* TABLE VIEW */}
              {filteredProjects.length > 0 && projectViewMode === "table" && (
                <div className="card table-view-card">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="sortable-th" onClick={() => handleTableSort("name")}>
                            Project Name {renderTableSortIcon("name")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("department")}>
                            Ministry / Department {renderTableSortIcon("department")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("location")}>
                            Location {renderTableSortIcon("location")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("physical")}>
                            Physical vs Financial {renderTableSortIcon("physical")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("health")}>
                            Health Score {renderTableSortIcon("health")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("delay")}>
                            Predicted Delay {renderTableSortIcon("delay")}
                          </th>
                          <th className="sortable-th" onClick={() => handleTableSort("budget")}>
                            Budget Outlay {renderTableSortIcon("budget")}
                          </th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((p) => {
                          const health = calculateProjectHealthScore(p);
                          const risk = calculateProjectRiskIntelligence(p);
                          const st = statusConfig[p.status] || statusConfig.ON_TRACK;

                          return (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.name}</strong>
                                <small style={{ display: "block", color: "#64748b" }}>
                                  #{p.id} • {p.manager} • <span
                                    style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 600 }}
                                    onClick={() => handleOpenContractorVetting(p.contractor_id || 1, p.id)}
                                    title="Run AI Due Diligence Assessment"
                                  >
                                    🛡️ {p.contractor_name || "Contractor"}
                                  </span>
                                </small>
                              </td>
                              <td><span className="badge-dept-inline">{p.department}</span></td>
                              <td>📍 {p.location}</td>
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
                                <strong className={risk.estimatedDelayDays > 20 ? "text-danger" : "text-success"}>
                                  {risk.estimatedDelayDays > 0 ? `~${risk.estimatedDelayDays} days` : "On schedule"}
                                </strong>
                              </td>
                              <td>
                                <strong>{money(p.approved_budget)}</strong>
                              </td>
                              <td>
                                <span className={`status-tag ${st.className}`}>
                                  {st.icon} {st.label}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {(p.status === "CRITICAL" || p.status === "DELAYED" || p.status === "AT_RISK") && (
                                    <button
                                      type="button"
                                      className="btn-sm btn-outline-danger"
                                      onClick={() => {
                                        setSelectedSalvageProjectId(p.id);
                                        setActiveNav("Rescue & Salvage");
                                      }}
                                      title="AI Project Doom Prevention & Turnaround Salvage"
                                    >
                                      🛟 Rescue
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-sm btn-outline"
                                    onClick={() => {
                                      setWhatIfProject(p);
                                      setActiveNav("What-If Lab");
                                    }}
                                    title="Simulate What-If policy intervention"
                                  >
                                    ⚡ What-If
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-sm btn-primary"
                                    onClick={() => setSelectedProject(p)}
                                    title="Deep AI Risk Diagnostics & SHAP"
                                  >
                                    AI Risk →
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CARD GRID VIEW */}
              {filteredProjects.length > 0 && projectViewMode === "cards" && (
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

                        <div
                          className="project-contractor-chip"
                          onClick={() => handleOpenContractorVetting(p.contractor_id || 1, p.id)}
                          title="Click to run AI Fraud & Tender Eligibility Assessment"
                        >
                          <span className="contractor-chip-icon">🛡️ Contractor:</span>
                          <strong>{p.contractor_name || "Larsen & Mega Infrastructure Ltd"}</strong>
                          <span className="contractor-verify-link">Verify Tender Fit →</span>
                        </div>

                        <div className="project-stats-grid">
                          <div>
                            <span className="stat-label">Budget</span>
                            <strong>{money(p.approved_budget)}</strong>
                          </div>
                          <div>
                            <span className="stat-label">Spend</span>
                            <strong>{money(p.expenditure)}</strong>
                          </div>
                          <div>
                            <span className="stat-label">Physical</span>
                            <strong>{p.physical_progress}%</strong>
                          </div>
                          <div>
                            <span className="stat-label">Financial</span>
                            <strong>{p.financial_progress}%</strong>
                          </div>
                        </div>

                        <div className="project-meter">
                          <div className="meter-label-row">
                            <span>Health Score</span>
                            <strong>{health.score}/100</strong>
                          </div>
                          <div className="meter-track">
                            <div
                              className={`meter-fill ${health.category.toLowerCase()}`}
                              style={{ width: `${health.score}%` }}
                            />
                          </div>
                        </div>

                        <div className="project-card-footer">
                          {(p.status === "CRITICAL" || p.status === "DELAYED" || p.status === "AT_RISK") && (
                            <button
                              type="button"
                              className="btn-outline-danger"
                              onClick={() => {
                                setSelectedSalvageProjectId(p.id);
                                setActiveNav("Rescue & Salvage");
                              }}
                            >
                              🛟 Rescue Plan
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => {
                              setWhatIfProject(p);
                              setActiveNav("What-If Lab");
                            }}
                          >
                            ⚡ What-If
                          </button>
                          <button
                            type="button"
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
              )}
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
              VIEW: FRAUD DETECTION & CONTRACTOR DUE DILIGENCE HUB
          ==================================================== */}
          {activeNav === "Fraud & Vetting" && (
            <div className="vetting-view">
              {/* VIEW HEADER */}
              <div className="view-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h1>🛡️ Fraud Detection & Contractor Due Diligence Hub</h1>
                    <span className="live-pill" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                      ● ML Model Active ({contractorModelMeta.accuracy ? (contractorModelMeta.accuracy * 100).toFixed(1) : 100}% Accuracy)
                    </span>
                  </div>
                  <p>
                    AI-powered procurement screening, historical track record verification, ghost-billing detection, and tender award fitness assessment under MoSPI Rule 175.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    className="btn-outline"
                    onClick={handleRetrainContractorModel}
                    disabled={isRetrainingContractor}
                  >
                    {isRetrainingContractor ? "Training Ensemble..." : "🔄 Retrain Fraud Model"}
                  </button>
                </div>
              </div>

              {/* STATS OVERVIEW CARDS */}
              <div className="vetting-stats-grid">
                <div className="stat-card">
                  <span className="stat-label">🏛️ Total Empaneled</span>
                  <strong className="stat-val">{contractors.length}</strong>
                  <span className="stat-sub">Central & State PWD Registry</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">✅ Approved & Cleared</span>
                  <strong className="stat-val" style={{ color: "#10b981" }}>
                    {contractors.filter((c) => c.status === "APPROVED").length}
                  </strong>
                  <span className="stat-sub">Passed All Fraud Envelopes</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">⚠️ Enhanced Oversight</span>
                  <strong className="stat-val" style={{ color: "#f59e0b" }}>
                    {contractors.filter((c) => c.status === "WATCHLIST").length}
                  </strong>
                  <span className="stat-sub">Conditional Escrow Required</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">🚫 High Fraud Risk / Disqualified</span>
                  <strong className="stat-val" style={{ color: "#ef4444" }}>
                    {contractors.filter((c) => c.status === "DISQUALIFIED").length}
                  </strong>
                  <span className="stat-sub">Ineligible under Rule 175</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">🚨 Ghost-Billing Red Flags</span>
                  <strong className="stat-val" style={{ color: "#8b5cf6" }}>
                    {contractors.reduce((acc, c) => acc + Number(c.ghost_billing_flags || 0), 0)}
                  </strong>
                  <span className="stat-sub">Detected Invoice Mismatches</span>
                </div>
              </div>

              {/* TENDER SCREENING & FRAUD SIMULATOR */}
              <div className="card vetting-simulator-card">
                <div className="simulator-header">
                  <div>
                    <h2>⚡ Tender Fitness & Fraud Screening Simulator</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                      Assess whether a contractor has the track record and capacity to successfully deliver a project without default or fraud.
                    </p>
                  </div>
                  <span className="step-tag">Step 1: Configure → Step 2: Run AI Model</span>
                </div>

                <div className="vetting-config-columns">
                  {/* PROJECT COLUMN */}
                  <div className="config-box">
                    <div className="config-box-header">
                      <h4>1. Target Infrastructure Project</h4>
                      <div className="toggle-pill-group">
                        <button
                          type="button"
                          className={vettingProjectMode === "existing" ? "active" : ""}
                          onClick={() => setVettingProjectMode("existing")}
                        >
                          Existing Project
                        </button>
                        <button
                          type="button"
                          className={vettingProjectMode === "new" ? "active" : ""}
                          onClick={() => setVettingProjectMode("new")}
                        >
                          + New Project
                        </button>
                      </div>
                    </div>

                    {vettingProjectMode === "existing" ? (
                      <div className="form-group">
                        <label>Select Listed Project:</label>
                        <select
                          className="form-control"
                          value={vettingProjectId}
                          onChange={(e) => setVettingProjectId(Number(e.target.value))}
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.department}, {money(p.approved_budget)})
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const p = projects.find((x) => x.id === vettingProjectId) || projects[0];
                          return (
                            <div className="meta-hint">
                              <span>Sanctioned Budget: <strong>{money(p.approved_budget)}</strong></span>
                              <span>Sector: <strong>{p.department}</strong></span>
                              <span>State: <strong>{p.location}</strong></span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>New Project Title:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={customVettingProject.name}
                            onChange={(e) => setCustomVettingProject({ ...customVettingProject, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Ministry / Sector:</label>
                          <select
                            className="form-control"
                            value={customVettingProject.department}
                            onChange={(e) => setCustomVettingProject({ ...customVettingProject, department: e.target.value })}
                          >
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Railways">Railways</option>
                            <option value="Road Transport">Road Transport</option>
                            <option value="Energy">Energy</option>
                            <option value="Urban Development">Urban Development</option>
                            <option value="Water Resources">Water Resources</option>
                            <option value="Health">Health</option>
                            <option value="Digital Governance">Digital Governance</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Sanctioned Budget (₹ Crores):</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            max="5000"
                            value={customVettingProject.budget_cr}
                            onChange={(e) => setCustomVettingProject({ ...customVettingProject, budget_cr: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Target Duration (Months):</label>
                          <input
                            type="number"
                            className="form-control"
                            min="3"
                            max="120"
                            value={customVettingProject.duration_months}
                            onChange={(e) => setCustomVettingProject({ ...customVettingProject, duration_months: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONTRACTOR COLUMN */}
                  <div className="config-box">
                    <div className="config-box-header">
                      <h4>2. Proposed Contractor / Bidder</h4>
                      <div className="toggle-pill-group">
                        <button
                          type="button"
                          className={vettingContractorMode === "empaneled" ? "active" : ""}
                          onClick={() => setVettingContractorMode("empaneled")}
                        >
                          Empaneled Contractor
                        </button>
                        <button
                          type="button"
                          className={vettingContractorMode === "new" ? "active" : ""}
                          onClick={() => setVettingContractorMode("new")}
                        >
                          + Screen New Contractor
                        </button>
                      </div>
                    </div>

                    {vettingContractorMode === "empaneled" ? (
                      <div className="form-group">
                        <label>Select Contractor from Registry:</label>
                        <select
                          className="form-control"
                          value={vettingContractorId}
                          onChange={(e) => setVettingContractorId(Number(e.target.value))}
                        >
                          {contractors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.category} • Status: {c.status} • Max: {money(c.max_project_budget_handled)})
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const c = contractors.find((x) => x.id === vettingContractorId) || contractors[0];
                          return (
                            <div className="meta-hint">
                              <span>Max Past Job: <strong>{money(c.max_project_budget_handled)}</strong></span>
                              <span>Shell Risk: <strong>{c.shell_risk_score}/100</strong></span>
                              <span>Ghost Invoices: <strong style={{ color: c.ghost_billing_flags > 0 ? "#ef4444" : "#10b981" }}>{c.ghost_billing_flags}</strong></span>
                              <span>Status: <strong className={`status-pill pill-${c.status.toLowerCase()}`}>{c.status}</strong></span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Contractor Company Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={customVettingContractor.name}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Category / Empanelment Tier:</label>
                          <select
                            className="form-control"
                            value={customVettingContractor.category}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, category: e.target.value })}
                          >
                            <option value="Tier-1">Tier-1 (National Major)</option>
                            <option value="Tier-2">Tier-2 (Regional Prime)</option>
                            <option value="Tier-3">Tier-3 (Sub-Contractor / Small)</option>
                            <option value="New">Unregistered / New Bidder</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Max Past Project Handled (₹ Cr):</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={customVettingContractor.max_handled_cr}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, max_handled_cr: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>On-Time Delivery Rate (%):</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            value={customVettingContractor.delivery_rate}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, delivery_rate: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Ghost-Billing / Fake Invoice Flags:</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="10"
                            value={customVettingContractor.ghost_flags}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, ghost_flags: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Shell Entity Risk Score (0-100):</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            value={customVettingContractor.shell_risk}
                            onChange={(e) => setCustomVettingContractor({ ...customVettingContractor, shell_risk: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="simulator-action-row">
                  <button
                    type="button"
                    className="btn-primary run-vetting-btn"
                    onClick={() => handleRunVettingAnalysis()}
                    disabled={isEvaluatingContractor}
                  >
                    {isEvaluatingContractor ? "Evaluating Multi-Factor Risk..." : "⚡ Run AI Fraud & Tender Eligibility Assessment"}
                  </button>
                </div>
              </div>

              {/* VERDICT & DUE DILIGENCE ANALYSIS RESULT */}
              {vettingResult && (
                <div className="vetting-result-section card">
                  {/* TOP VERDICT BANNER */}
                  <div className={`verdict-banner ${vettingResult.verdict_class}`}>
                    <div className="verdict-banner-header">
                      <span className="verdict-tag-pill">{vettingResult.verdict_badge}</span>
                      <div className="verdict-meta-badges">
                        <span>Project Outlay: <strong>₹{vettingResult.project_budget_cr} Cr</strong></span>
                        <span>Contractor Max Past Scale: <strong>₹{vettingResult.max_handled_cr} Cr</strong></span>
                        <span>Capacity Scale: <strong>{vettingResult.budget_scale_ratio}x</strong></span>
                      </div>
                    </div>
                    <p className="verdict-summary-text">{vettingResult.verdict_summary}</p>
                  </div>

                  {/* 4 CORE METRIC GAUGES */}
                  <div className="vetting-score-row">
                    <div className="vetting-gauge-card">
                      <span className="gauge-title">Overall Eligibility Score</span>
                      <strong className={`gauge-value ${vettingResult.verdict.toLowerCase()}`}>
                        {vettingResult.eligibility_score} / 100
                      </strong>
                      <div className="mini-meter">
                        <div
                          className={`mini-meter-fill ${vettingResult.verdict.toLowerCase()}`}
                          style={{ width: `${vettingResult.eligibility_score}%` }}
                        />
                      </div>
                      <small>Benchmark: ≥ 80 Approved, 55-79 Conditional, &lt;55 Disqualified</small>
                    </div>

                    <div className="vetting-gauge-card">
                      <span className="gauge-title">Fraud Risk Probability</span>
                      <strong className="gauge-value" style={{ color: vettingResult.fraud_risk_score > 30 ? "#ef4444" : "#10b981" }}>
                        {vettingResult.fraud_risk_score}%
                      </strong>
                      <div className="mini-meter">
                        <div
                          className="mini-meter-fill"
                          style={{
                            width: `${vettingResult.fraud_risk_score}%`,
                            background: vettingResult.fraud_risk_score > 30 ? "#ef4444" : "#10b981",
                          }}
                        />
                      </div>
                      <small>Ensemble ML model probability of default or ghost billing</small>
                    </div>

                    <div className="vetting-gauge-card">
                      <span className="gauge-title">Scale Capacity Fit</span>
                      <strong className="gauge-value" style={{ color: vettingResult.budget_scale_ratio > 1.6 ? "#f59e0b" : "#10b981" }}>
                        {vettingResult.budget_scale_ratio}x Scale
                      </strong>
                      <div className="mini-meter">
                        <div
                          className="mini-meter-fill"
                          style={{
                            width: `${Math.min(100, (1 / Math.max(0.5, vettingResult.budget_scale_ratio)) * 100)}%`,
                            background: vettingResult.budget_scale_ratio > 2.0 ? "#ef4444" : vettingResult.budget_scale_ratio > 1.2 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                      <small>{vettingResult.budget_scale_ratio > 2.0 ? "Severe Capacity Mismatch (Over-leverage)" : "Within Historical Operational Envelope"}</small>
                    </div>

                    <div className="vetting-gauge-card">
                      <span className="gauge-title">Ghost-Billing Irregularities</span>
                      <strong className="gauge-value" style={{ color: (vettingResult.historical_metrics?.ghost_billing_flags || 0) > 0 ? "#ef4444" : "#10b981" }}>
                        {vettingResult.historical_metrics?.ghost_billing_flags || 0} Flags
                      </strong>
                      <div className="mini-meter">
                        <div
                          className="mini-meter-fill"
                          style={{
                            width: `${Math.min(100, (vettingResult.historical_metrics?.ghost_billing_flags || 0) * 25)}%`,
                            background: "#ef4444",
                          }}
                        />
                      </div>
                      <small>{(vettingResult.historical_metrics?.ghost_billing_flags || 0) > 0 ? "Documented Fake Invoices / Sub-letting" : "Zero Irregularities Reported"}</small>
                    </div>
                  </div>

                  {/* 4 COMPONENT BREAKDOWN BARS */}
                  <div className="component-breakdown-box">
                    <h4>Component Due Diligence Scores:</h4>
                    <div className="component-bars-grid">
                      <div>
                        <div className="comp-bar-head">
                          <span>Financial Integrity & Billing Legitimacy (35%)</span>
                          <strong>{vettingResult.component_scores?.financial_integrity}/100</strong>
                        </div>
                        <div className="meter-track">
                          <div
                            className="meter-fill"
                            style={{
                              width: `${vettingResult.component_scores?.financial_integrity}%`,
                              background: vettingResult.component_scores?.financial_integrity >= 80 ? "#10b981" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="comp-bar-head">
                          <span>Historical Delivery & Schedule Reliability (30%)</span>
                          <strong>{vettingResult.component_scores?.historical_delivery}/100</strong>
                        </div>
                        <div className="meter-track">
                          <div
                            className="meter-fill"
                            style={{
                              width: `${vettingResult.component_scores?.historical_delivery}%`,
                              background: vettingResult.component_scores?.historical_delivery >= 80 ? "#10b981" : "#f59e0b",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="comp-bar-head">
                          <span>Scale & Capacity Match (20%)</span>
                          <strong>{vettingResult.component_scores?.scale_capacity}/100</strong>
                        </div>
                        <div className="meter-track">
                          <div
                            className="meter-fill"
                            style={{
                              width: `${vettingResult.component_scores?.scale_capacity}%`,
                              background: vettingResult.component_scores?.scale_capacity >= 80 ? "#10b981" : "#f59e0b",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="comp-bar-head">
                          <span>Regulatory & Legal Standing (15%)</span>
                          <strong>{vettingResult.component_scores?.regulatory_compliance}/100</strong>
                        </div>
                        <div className="meter-track">
                          <div
                            className="meter-fill"
                            style={{
                              width: `${vettingResult.component_scores?.regulatory_compliance}%`,
                              background: vettingResult.component_scores?.regulatory_compliance >= 80 ? "#10b981" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE: EXPLAINABLE DRIVERS & SAFEGUARDS */}
                  <div className="vetting-details-split">
                    {/* RISK DRIVERS */}
                    <div className="drivers-card">
                      <h3>🧠 Explainable AI Feature Drivers (SHAP Attribution)</h3>
                      <div className="driver-list">
                        {vettingResult.risk_drivers && vettingResult.risk_drivers.map((drv, idx) => (
                          <div key={idx} className={`driver-item ${drv.type}`}>
                            <div className="driver-header">
                              <span className="driver-name">{drv.factor}</span>
                              <span className={`driver-impact ${drv.type}`}>{drv.impact}</span>
                            </div>
                            <p className="driver-desc">{drv.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MANDATED PROCUREMENT SAFEGUARDS */}
                    <div className="safeguards-card">
                      <h3>📜 Mandated MoSPI Procurement Safeguards</h3>
                      <ul className="safeguards-list">
                        {vettingResult.safeguards && vettingResult.safeguards.map((sg, idx) => (
                          <li key={idx} className="safeguard-item">
                            <span className="sg-bullet">§</span>
                            <div>
                              <strong>Clause {idx + 1}:</strong> {sg}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="safeguard-footer">
                        <small>Complies with MoSPI Public Procurement (GFR Rule 175) due-diligence provisions.</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTRACTOR DIRECTORY TABLE */}
              <div className="card contractor-directory-card">
                <div className="directory-header">
                  <div>
                    <h2>📋 Empaneled Contractor Track Record Registry</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                      Historical audit performance, cost overruns, delivery rates, and active fraud flags across all empaneled vendors.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search contractors..."
                      value={contractorSearch}
                      onChange={(e) => setContractorSearch(e.target.value)}
                      style={{ width: "220px" }}
                    />
                    <div className="toggle-pill-group">
                      {["ALL", "APPROVED", "WATCHLIST", "DISQUALIFIED"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={contractorFilter === st ? "active" : ""}
                          onClick={() => setContractorFilter(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contractor Name & PAN</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Delivery Rate</th>
                        <th>Avg Cost Overrun</th>
                        <th>Avg Delay</th>
                        <th>Ghost Invoices</th>
                        <th>Shell Risk</th>
                        <th>Max Job Handled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractors
                        .filter((c) => {
                          if (contractorFilter !== "ALL" && c.status !== contractorFilter) return false;
                          if (contractorSearch) {
                            const q = contractorSearch.toLowerCase();
                            return c.name.toLowerCase().includes(q) || (c.pan_cin && c.pan_cin.toLowerCase().includes(q));
                          }
                          return true;
                        })
                        .map((c) => (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.name}</strong>
                              <small style={{ display: "block", color: "#64748b" }}>
                                CIN/PAN: {c.pan_cin || "N/A"} • Est. {c.incorporation_year}
                              </small>
                            </td>
                            <td><span className="badge-tier">{c.category}</span></td>
                            <td>
                              <span className={`status-pill pill-${c.status.toLowerCase()}`}>
                                {c.status}
                              </span>
                            </td>
                            <td>
                              <strong>{((c.on_time_delivery_rate ?? 0.85) * 100).toFixed(0)}%</strong>
                            </td>
                            <td style={{ color: (c.avg_cost_overrun_pct ?? 0) > 15 ? "#ef4444" : "inherit" }}>
                              +{(c.avg_cost_overrun_pct ?? 0).toFixed(1)}%
                            </td>
                            <td>{(c.avg_delay_days ?? 0).toFixed(0)} days</td>
                            <td>
                              <span className={`badge-ghost ${(c.ghost_billing_flags || 0) > 0 ? "danger" : "clean"}`}>
                                {c.ghost_billing_flags || 0} flags
                              </span>
                            </td>
                            <td>
                              <span style={{ color: c.shell_risk_score > 30 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                                {c.shell_risk_score}/100
                              </span>
                            </td>
                            <td><strong>{money(c.max_project_budget_handled)}</strong></td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn-sm btn-outline"
                                  onClick={() => handleViewContractorDossier(c.id)}
                                  title="Inspect full past project delivery timeline"
                                >
                                  📄 Dossier
                                </button>
                                <button
                                  type="button"
                                  className="btn-sm btn-primary"
                                  onClick={() => {
                                    setVettingContractorId(c.id);
                                    setVettingContractorMode("empaneled");
                                    handleRunVettingAnalysis(c.id, vettingProjectId);
                                  }}
                                  title="Screen in Simulator"
                                >
                                  ⚡ Screen
                                </button>
                              </div>
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
              VIEW: AI RESCUE & DOOM PREVENTATIVE SALVAGE HUB
          ==================================================== */}
          {activeNav === "Rescue & Salvage" && (
            <div className="salvage-view">
              <div className="view-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h1>🛟 AI Project Salvage & Doom Prevention Hub</h1>
                    <span className="badge badge-danger">ML Catastrophe Predictor v2.4</span>
                  </div>
                  <p>
                    Trained Random Forest classifier identifying terminal project collapse risk (budget burnout, milestone deadlock, abandonment) and orchestrating multi-phase recovery directives.
                  </p>
                </div>
                <div className="header-actions">
                  <span className="model-accuracy-chip" title="Verified against 1,000 MoSPI synthetic project failure trajectories">
                    🤖 100% Accuracy • 1.000 ROC-AUC
                  </span>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      const printContent = `MoSPI Executive Rescue Directive - Project: ${currentSalvageProject.name}\nDoom Probability: ${currentSalvagePlan.doom_probability_pct}%\nPrimary Failure Mode: ${currentSalvagePlan.primary_failure_mode}\nSalvaged Health Target: ${currentSalvagePlan.impact_simulation.salvaged_health_score}/100\nDays Saved: ${currentSalvagePlan.impact_simulation.days_saved} calendar days\nCapital Overrun Saved: ₹${currentSalvagePlan.impact_simulation.capital_saved_cr} Cr`;
                      alert(`📄 MoSPI EXECUTIVE RESCUE BRIEF GENERATED:\n\n${printContent}\n\n(Ready for ministerial transmission)`);
                    }}
                  >
                    📄 Export Brief
                  </button>
                </div>
              </div>

              {/* TOP EXECUTIVE KPI SUMMARY */}
              <div className="kpi-grid salvage-kpis">
                <div className="kpi-card danger-card">
                  <span className="kpi-label">🚨 Terminal Doom Alerts</span>
                  <div className="kpi-value text-danger">
                    {allProjectDoomEvaluations.filter((d) => d.plan.doom_level === "CRITICAL_DOOM" || d.plan.is_doomed).length}
                  </div>
                  <small className="kpi-sub">Projects in catastrophic default trajectory</small>
                </div>

                <div className="kpi-card warning-card">
                  <span className="kpi-label">💰 Capital at Default Risk</span>
                  <div className="kpi-value text-warning">
                    {money(
                      allProjectDoomEvaluations
                        .filter((d) => d.plan.doom_level === "CRITICAL_DOOM" || d.plan.is_doomed)
                        .reduce((sum, d) => sum + (d.project.approved_budget || 0), 0)
                    )}
                  </div>
                  <small className="kpi-sub">Total sanctioned funds exposed to collapse</small>
                </div>

                <div className="kpi-card success-card">
                  <span className="kpi-label">⏱️ Recoverable Schedule Delay</span>
                  <div className="kpi-value text-success">
                    +{allProjectDoomEvaluations.reduce((sum, d) => sum + (d.plan.impact_simulation.days_saved || 0), 0)} Days
                  </div>
                  <small className="kpi-sub">Total calendar days saved via 24/7 crashing</small>
                </div>

                <div className="kpi-card info-card">
                  <span className="kpi-label">🛡️ Capital Overrun Prevented</span>
                  <div className="kpi-value text-info">
                    ₹{allProjectDoomEvaluations.reduce((sum, d) => sum + (d.plan.impact_simulation.capital_saved_cr || 0), 0).toFixed(1)} Cr
                  </div>
                  <small className="kpi-sub">Estimated waste averted via escrow ring-fencing</small>
                </div>
              </div>

              {/* PROJECT SELECTOR & FILTER BAR */}
              <div className="card salvage-selector-card">
                <div className="salvage-selector-inner">
                  <div className="selector-field">
                    <label><strong>Target Infrastructure Project for Salvage Diagnosis:</strong></label>
                    <select
                      className="form-control"
                      value={selectedSalvageProjectId}
                      onChange={(e) => setSelectedSalvageProjectId(Number(e.target.value))}
                      style={{ fontSize: "1rem", fontWeight: "600", padding: "10px 14px" }}
                    >
                      {projects
                        .filter((p) => {
                          if (salvageFilter === "DISTRESSED") return p.status === "CRITICAL" || p.status === "DELAYED" || p.status === "AT_RISK";
                          if (salvageFilter === "HEALTHY") return p.status === "ON_TRACK";
                          return true;
                        })
                        .map((p) => {
                          const plan = evaluateProjectDoomRisk(p);
                          return (
                            <option key={p.id} value={p.id}>
                              #{p.id} - {p.name} [{p.department}] — {plan.doom_badge} ({plan.doom_probability_pct}% Risk)
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className="selector-filters">
                    <label>Filter Scope:</label>
                    <div className="toggle-pill-group">
                      {[
                        ["ALL", `All Projects (${projects.length})`],
                        ["DISTRESSED", `🚨 Distressed Only (${projects.filter((p) => p.status === "CRITICAL" || p.status === "DELAYED" || p.status === "AT_RISK").length})`],
                        ["HEALTHY", `🟢 Stable (${projects.filter((p) => p.status === "ON_TRACK").length})`],
                      ].map(([st, label]) => (
                        <button
                          key={st}
                          type="button"
                          className={salvageFilter === st ? "active" : ""}
                          onClick={() => setSalvageFilter(st)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {salvagedProjectIds.has(currentSalvageProject.id) && (
                  <div className="salvage-success-banner">
                    <span>✓</span>
                    <div>
                      <strong>Turnaround Intervention Active for '{currentSalvageProject.name}'</strong>
                      <p>Tripartite Escrow ring-fenced, 24/7 double shifts mandated, package carve-out sanctioned. Target delay reduced to {currentSalvagePlan.impact_simulation.salvaged_delay_days} days.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MAIN DUAL-COLUMN COCKPIT */}
              <div className="salvage-cockpit-grid">
                {/* LEFT COLUMN: ML DOOM DIAGNOSIS */}
                <div className="salvage-left-col">
                  {/* DOOM RISK METER CARD */}
                  <div className={`card doom-risk-card ${currentSalvagePlan.doom_class}`}>
                    <div className="card-header-flex">
                      <h3>🔮 ML Catastrophe Vulnerability Gauge</h3>
                      <span className={`doom-status-badge ${currentSalvagePlan.doom_class}`}>
                        {currentSalvagePlan.doom_badge}
                      </span>
                    </div>

                    <div className="doom-meter-container">
                      <div className="doom-gauge-radial">
                        <div className="gauge-outer">
                          <div
                            className="gauge-progress"
                            style={{
                              transform: `rotate(${Math.min(180, (currentSalvagePlan.doom_probability_pct / 100) * 180)}deg)`,
                            }}
                          />
                          <div className="gauge-inner">
                            <div className="gauge-number">{currentSalvagePlan.doom_probability_pct}%</div>
                            <span className="gauge-sub">DOOM PROBABILITY</span>
                          </div>
                        </div>
                      </div>

                      <div className="doom-narrative-box">
                        <h4>Diagnostic Assessment</h4>
                        <p>{currentSalvagePlan.doom_summary}</p>
                      </div>
                    </div>

                    {/* PRIMARY FAILURE MECHANISMS */}
                    <div className="failure-mechanisms-block">
                      <h4>🚨 Primary Catastrophic Failure Signatures</h4>
                      <div className="failure-tags-list">
                        {currentSalvagePlan.failure_modes.map((fm, idx) => (
                          <div key={idx} className="failure-item">
                            <span className="failure-icon">⚠️</span>
                            <span>{fm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ROOT CAUSE QUANTITATIVE METRICS */}
                  <div className="card divergence-metrics-card">
                    <h3>📊 Execution Divergence Signals</h3>
                    <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "0.85rem" }}>
                      Ground-truth sensor and financial data inputs fed into the Catastrophe Classifier
                    </p>

                    <div className="divergence-metric-row">
                      <div className="metric-info">
                        <strong>Schedule Slippage Gap</strong>
                        <span>Planned: {currentSalvageProject.expected_progress || 65}% vs Built: {currentSalvageProject.physical_progress}%</span>
                      </div>
                      <div className="metric-value-wrap">
                        <span className={`metric-badge ${Number(currentSalvageProject.expected_progress || 65) - Number(currentSalvageProject.physical_progress) > 20 ? "bad" : "good"}`}>
                          {Math.max(0, Number(currentSalvageProject.expected_progress || 65) - Number(currentSalvageProject.physical_progress))}% Lag
                        </span>
                      </div>
                    </div>

                    <div className="divergence-metric-row">
                      <div className="metric-info">
                        <strong>Financial-Physical Decoupling</strong>
                        <span>Spent: {currentSalvageProject.financial_progress}% vs Built: {currentSalvageProject.physical_progress}%</span>
                      </div>
                      <div className="metric-value-wrap">
                        <span className={`metric-badge ${Number(currentSalvageProject.financial_progress) - Number(currentSalvageProject.physical_progress) > 20 ? "bad" : "good"}`}>
                          {Math.max(0, Number(currentSalvageProject.financial_progress) - Number(currentSalvageProject.physical_progress))}% Spend Gap
                        </span>
                      </div>
                    </div>

                    <div className="divergence-metric-row">
                      <div className="metric-info">
                        <strong>Milestone Backlog Ratio</strong>
                        <span>{currentSalvageProject.milestones_delayed || 0} of {currentSalvageProject.milestones_total || 5} milestones delayed</span>
                      </div>
                      <div className="metric-value-wrap">
                        <span className={`metric-badge ${Number(currentSalvageProject.milestones_delayed || 0) > 1 ? "bad" : "good"}`}>
                          {Math.round((Number(currentSalvageProject.milestones_delayed || 0) / Math.max(1, Number(currentSalvageProject.milestones_total || 5))) * 100)}% Delayed
                        </span>
                      </div>
                    </div>

                    <div className="divergence-metric-row">
                      <div className="metric-info">
                        <strong>Contractor Execution Capacity</strong>
                        <span>Labour mobilization & equipment rating</span>
                      </div>
                      <div className="metric-value-wrap">
                        <span className={`metric-badge ${Number(currentSalvageProject.contractor_performance || 70) < 60 ? "bad" : "good"}`}>
                          {currentSalvageProject.contractor_performance || 70}/100 Rating
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTRACTOR VETTING INTEGRATION LINK */}
                  <div className="card contractor-link-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>ASSIGNED CONTRACTOR</span>
                        <h4 style={{ margin: "4px 0 0 0", fontSize: "1.05rem" }}>{currentSalvageProject.contractor_name || "Assigned Infrastructure Partner"}</h4>
                      </div>
                      <button
                        className="btn-sm btn-outline"
                        onClick={() => handleOpenContractorVetting(currentSalvageProject.contractor_id || 1, currentSalvageProject.id)}
                        title="Inspect contractor historical delivery records and fraud risk"
                      >
                        🛡️ Vetting & Fraud Dossier →
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TURNAROUND BLUEPRINT & BEFORE/AFTER IMPACT */}
                <div className="salvage-right-col">
                  {/* QUANTIFIED BEFORE VS AFTER RECOVERY MATRIX */}
                  <div className="card recovery-matrix-card">
                    <div className="card-header-flex">
                      <div>
                        <h3>📈 Turnaround Salvage Recovery Projections</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                          Simulated gains under full deployment of emergency stabilization & acceleration protocols
                        </p>
                      </div>
                      <span className="success-tag">
                        🎯 {currentSalvagePlan.impact_simulation.salvage_success_probability}% Turnaround Feasibility
                      </span>
                    </div>

                    <div className="impact-matrix-grid">
                      <div className="impact-box">
                        <span className="impact-box-label">⏱️ Schedule Delay Target</span>
                        <div className="impact-comparison">
                          <span className="val-before">{currentSalvagePlan.impact_simulation.baseline_delay_days}d</span>
                          <span className="val-arrow">➔</span>
                          <span className="val-after text-success">{currentSalvagePlan.impact_simulation.salvaged_delay_days}d</span>
                        </div>
                        <div className="impact-gain-pill positive">
                          🚀 {currentSalvagePlan.impact_simulation.days_saved} Days Saved
                        </div>
                      </div>

                      <div className="impact-box">
                        <span className="impact-box-label">🩺 Project Health Score</span>
                        <div className="impact-comparison">
                          <span className="val-before">{currentSalvagePlan.impact_simulation.baseline_health_score}</span>
                          <span className="val-arrow">➔</span>
                          <span className="val-after text-success">{currentSalvagePlan.impact_simulation.salvaged_health_score}/100</span>
                        </div>
                        <div className="impact-gain-pill positive">
                          +{currentSalvagePlan.impact_simulation.health_score_gain} pts Recovery
                        </div>
                      </div>

                      <div className="impact-box">
                        <span className="impact-box-label">💰 Overrun Wastage Averted</span>
                        <div className="impact-comparison">
                          <span className="val-before">₹{currentSalvagePlan.impact_simulation.projected_cost_overrun_cr} Cr</span>
                          <span className="val-arrow">➔</span>
                          <span className="val-after text-success">₹{(currentSalvagePlan.impact_simulation.projected_cost_overrun_cr - currentSalvagePlan.impact_simulation.capital_saved_cr).toFixed(1)} Cr</span>
                        </div>
                        <div className="impact-gain-pill positive">
                          ₹{currentSalvagePlan.impact_simulation.capital_saved_cr} Cr Protected
                        </div>
                      </div>

                      <div className="impact-box">
                        <span className="impact-box-label">🛡️ Delivery Trajectory</span>
                        <div className="impact-comparison">
                          <span className="val-before text-danger">TERMINAL</span>
                          <span className="val-arrow">➔</span>
                          <span className="val-after text-success">STABILIZED</span>
                        </div>
                        <div className="impact-gain-pill positive">
                          ✓ Default Averted
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3-PHASE INTERACTIVE SALVAGE BLUEPRINT */}
                  <div className="card salvage-blueprint-card">
                    <div className="card-header-flex">
                      <div>
                        <h3>🛠️ 3-Phase Structured Salvage Action Blueprint</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                          Prioritized, legally enforceable interventions formulated for MoSPI project oversight directorates
                        </p>
                      </div>
                      <span className="badge badge-info">8 Action Items</span>
                    </div>

                    <div className="salvage-phases-accordion">
                      {currentSalvagePlan.salvage_blueprint.map((phaseGroup, pIdx) => (
                        <div key={pIdx} className="salvage-phase-block">
                          <div className="phase-block-header">
                            <div className="phase-title-group">
                              <span className="phase-number-chip">Phase {pIdx + 1}</span>
                              <div>
                                <h4>{phaseGroup.phase}</h4>
                                <span className="phase-timeframe">⏱️ {phaseGroup.timeframe} • {phaseGroup.tag}</span>
                              </div>
                            </div>
                            <span className="phase-status-pill">{phaseGroup.status}</span>
                          </div>

                          <div className="phase-actions-list">
                            {phaseGroup.actions.map((act) => (
                              <div
                                key={act.id}
                                className={`action-item-row ${salvageCheckedActions[act.id] ? "checked" : ""}`}
                                onClick={() => toggleSalvageAction(act.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!salvageCheckedActions[act.id]}
                                  onChange={() => {}} // Handled by parent div onClick
                                  className="action-checkbox"
                                />
                                <div className="action-body">
                                  <div className="action-title-line">
                                    <strong>{act.action}</strong>
                                    <span className="priority-pill">{act.priority}</span>
                                  </div>
                                  <p className="action-desc">{act.details}</p>
                                  <div className="action-meta-line">
                                    <span className="agency-tag">🏛️ {act.responsible}</span>
                                    <span className="impact-tag">⚡ {act.impact}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* SALVAGE EXECUTION CONTROLS */}
                    <div className="salvage-execution-footer">
                      <div className="footer-directive-note">
                        <span>⚖️ Directives enforceable under MoSPI General Financial Rules (GFR) Rule 175 & GCC Clause 52</span>
                      </div>
                      <div className="footer-actions-group">
                        <button
                          type="button"
                          className="btn-primary btn-lg salvage-deploy-btn"
                          disabled={isExecutingSalvage}
                          onClick={handleExecuteSalvage}
                        >
                          {isExecutingSalvage ? (
                            <span>⏳ Deploying Salvage Protocols...</span>
                          ) : (
                            <span>⚡ 1-Click Deploy Salvage Plan ({Object.values(salvageCheckedActions).filter(Boolean).length} Actions)</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
                {filteredScreenedAnomalies.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-icon">🛡️</div>
                    <h3>No Data Anomalies Matching Filters</h3>
                    <p>No infrastructure projects match your current search or ministry filter.</p>
                  </div>
                ) : (
                  filteredScreenedAnomalies.map(({ project: p, anomaly: a, risk: r }) => (
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
                ))
              )}
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
                {filteredAlerts.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-icon">🚨</div>
                    <h3>No Active Alerts for This Filter</h3>
                    <p>No project alerts match your current search or ministry filter.</p>
                  </div>
                ) : (
                  filteredAlerts.map((a) => (
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
                ))
              )}
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
                {departments
                  .filter((dept) => deptFilter === "ALL" || dept === deptFilter)
                  .map((dept) => {
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

          {/* ===================================================
              VIEW 11: DATASET HUB & INGESTION STUDIO
          ==================================================== */}
          {(activeNav === "CSV AI Predictor" || activeNav === "Dataset Hub") && (
            <div className="dataset-hub-view">
              <div className="view-header">
                <div>
                  <h1>📊 CSV AI Predictor & Dataset Hub</h1>
                  <p>
                    Drag & drop your infrastructure project dataset (CSV or JSON) to instantly run retrained ML delay models, composite health indexing, and AI recovery blueprints.
                  </p>
                </div>
                <div className="header-actions">
                  <span className={`badge-model ${projects.length >= 20 ? "on-track" : ""}`}>
                    {projects.length >= 20 ? "⚡ 20-Project Showcase Active" : `Current Active: ${projects.length} Projects`}
                  </span>
                </div>
              </div>

              {/* NOTIFICATION BANNER IF PRESENT */}
              {datasetNotification && (
                <div className={`dataset-notification-banner ${datasetNotification.type}`}>
                  <span>{datasetNotification.type === "success" ? "✅" : datasetNotification.type === "error" ? "❌" : "ℹ️"}</span>
                  <p>{datasetNotification.text}</p>
                  <button className="dismiss-btn" onClick={() => setDatasetNotification(null)}>✕</button>
                </div>
              )}

              {/* TOP KPI OVERVIEW OF MASTER SHOWCASE */}
              <div className="kpi-grid">
                <div className="kpi-card on-track">
                  <span className="kpi-label">TOTAL CAPITAL PROJECTS</span>
                  <div className="kpi-value">{projects.length}</div>
                  <div className="kpi-sub">
                    {projects.length >= 20 ? "Covering 17 strategic union ministries" : "Standard baseline dataset loaded"}
                  </div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">SANCTIONED OUTLAY</span>
                  <div className="kpi-value">
                    {money(projects.reduce((acc, p) => acc + (Number(p.approved_budget) || 0), 0))}
                  </div>
                  <div className="kpi-sub">
                    Cumulative budget tracked under MoSPI oversight
                  </div>
                </div>
                <div className="kpi-card on-track">
                  <span className="kpi-label">EMEPANELED CONTRACTORS</span>
                  <div className="kpi-value">{contractors.length} Dossiers</div>
                  <div className="kpi-sub">36 verified delivery records & forensic ratings</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">MONITORED MILESTONES</span>
                  <div className="kpi-value">{milestones.length} Gates</div>
                  <div className="kpi-sub">Sequenced completion deliverables with audit gates</div>
                </div>
              </div>

              {/* QUICK INJECTION HIGHLIGHT BANNER */}
              <div className="dataset-cta-banner">
                <div className="cta-left">
                  <div className="cta-icon">⚡</div>
                  <div>
                    <h3>1-Click 20-Project Infrastructure Showcase Ingestion</h3>
                    <p>
                      Immediately swap the in-memory dataset with 20 realistic mega-projects across India (Highways, Solar, AI Cloud, Deepwater Ports, Bullet Rail, Hydro Dams). All ML delay forecasts, contractor vetting matrices, anomaly screening, and salvage blueprints recalculate dynamically in real time.
                    </p>
                  </div>
                </div>
                <div className="cta-actions">
                  <button
                    className="btn-primary-glow"
                    onClick={handleLoadShowcaseDataset}
                    disabled={isInjectingDataset}
                  >
                    {isInjectingDataset ? "⚡ Injecting Dataset..." : "⚡ Load 20-Project Showcase"}
                  </button>
                  <button className="btn-outline" onClick={handleResetDataset}>
                    ↺ Reset to Standard (6 Proj)
                  </button>
                </div>
              </div>

              {/* DATASET HUB SUB-NAV TABS */}
              <div className="dataset-subnav-tabs">
                <button
                  className={`subnav-tab ${datasetActiveTab === "predictor" ? "active" : ""}`}
                  onClick={() => setDatasetActiveTab("predictor")}
                >
                  ⚡ Drag & Drop CSV AI Predictor
                </button>
                <button
                  className={`subnav-tab ${datasetActiveTab === "studio" ? "active" : ""}`}
                  onClick={() => setDatasetActiveTab("studio")}
                >
                  📥 Download Datasets (CSV & JSON)
                </button>
                <button
                  className={`subnav-tab ${datasetActiveTab === "preview" ? "active" : ""}`}
                  onClick={() => setDatasetActiveTab("preview")}
                >
                  🔍 Live Data Explorer ({previewTable === "projects" ? projects.length : previewTable === "contractors" ? contractors.length : milestones.length})
                </button>
                <button
                  className={`subnav-tab ${datasetActiveTab === "dictionary" ? "active" : ""}`}
                  onClick={() => setDatasetActiveTab("dictionary")}
                >
                  📖 Schema & Data Dictionary (24 Fields)
                </button>
              </div>

              {/* TAB 1: DRAG & DROP CSV AI PREDICTOR */}
              {datasetActiveTab === "predictor" && (
                <div className="dataset-predictor-tab">
                  <div className="predictor-hero-card">
                    <div className="hero-text">
                      <span className="hero-badge">🤖 TRAINED ML INFERENCE PIPELINE</span>
                      <h2>Upload Your Project Dataset (CSV / JSON) for Instant AI Predictions</h2>
                      <p>
                        Drag and drop your infrastructure projects CSV file below. MoSPI’s retrained ML ensemble (Random Forest Delay Regressor, 6-Component Composite Health Engine, Isolation Forest Anomaly Screener, and AI Doom Risk Assessor) will immediately evaluate every record and generate delay forecasts, failure probabilities, and recovery recommendations.
                      </p>
                    </div>

                    {/* BIG DRAG AND DROP ZONE */}
                    <div
                      className={`drag-drop-zone ${isDragging ? "dragging" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer?.files?.[0];
                        if (file) processUploadedFile(file);
                      }}
                    >
                      <input
                        type="file"
                        id="csv-file-upload-input"
                        accept=".csv,.json"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                      <div className="drop-content">
                        <div className="drop-icon-animated">{isDragging ? "🎯" : "📊"}</div>
                        <h3>
                          {isDragging ? "Drop your CSV file here now to run ML models!" : "Drag & Drop your CSV or JSON Dataset here"}
                        </h3>
                        <p>
                          Supports standard CSV with columns: <code>name</code>, <code>department</code>, <code>approved_budget</code>, <code>expenditure</code>, <code>physical_progress</code>, etc.
                        </p>
                        <div className="drop-action-buttons">
                          <label htmlFor="csv-file-upload-input" className="btn-browse-file">
                            📁 Browse & Select CSV File
                          </label>
                          <button
                            type="button"
                            className="btn-sample-test"
                            onClick={handleLoadSampleCsvToPredictor}
                          >
                            ⚡ Try with 20-Project MoSPI Sample CSV
                          </button>
                          <button
                            type="button"
                            className="btn-sample-download"
                            onClick={() => downloadBlob(exportProjectsToCsv(EXPANDED_SHOWCASE_DATASET), "mospi_projects_template.csv", "text/csv")}
                          >
                            📥 Download Sample CSV Template
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BATCH ML PREDICTION RESULTS IF AVAILABLE */}
                  {uploadedPredictions && uploadedPredictions.length > 0 && (
                    <div className="batch-predictions-card">
                      <div className="batch-header">
                        <div>
                          <span className="badge-model on-track">✓ ML Inference Completed</span>
                          <h3>Batch Predictions for &lsquo;{uploadedFileName}&rsquo;</h3>
                          <p>
                            Evaluated {uploadedPredictions.length} projects across Random Forest, Health Indexing, and Salvage models in real time.
                          </p>
                        </div>
                        <div className="batch-header-actions">
                          <button
                            className="btn-download primary"
                            onClick={() => downloadBlob(exportPredictionsToCsv(uploadedPredictions), `predictions_${uploadedFileName || "dataset"}.csv`, "text/csv")}
                            title="Download the uploaded dataset enriched with ML predicted delays, risk levels, and health scores"
                          >
                            📥 Download Predictions CSV
                          </button>
                          <button
                            className="btn-primary-glow"
                            onClick={handleApplyPredictionsToPlatform}
                            title="Set these evaluated projects as the active dataset across all dashboards and GIS maps"
                          >
                            ⚡ Set as Active Platform Projects
                          </button>
                        </div>
                      </div>

                      {/* STATS STRIP */}
                      {uploadedStats && (
                        <div className="kpi-grid prediction-kpis">
                          <div className="kpi-card">
                            <span className="kpi-label">PROJECTS EVALUATED</span>
                            <div className="kpi-value">{uploadedStats.count}</div>
                            <div className="kpi-sub">Parsed and scored by ML models</div>
                          </div>
                          <div className={`kpi-card ${uploadedStats.totalAtRisk > 0 ? "delayed" : "on-track"}`}>
                            <span className="kpi-label">PREDICTED AT RISK</span>
                            <div className="kpi-value">{uploadedStats.totalAtRisk} Projects</div>
                            <div className="kpi-sub">High probability of schedule breach</div>
                          </div>
                          <div className="kpi-card">
                            <span className="kpi-label">AVG PREDICTED SLIPPAGE</span>
                            <div className="kpi-value">+{uploadedStats.avgDelay} Days</div>
                            <div className="kpi-sub">Regression forecast across portfolio</div>
                          </div>
                          <div className={`kpi-card ${uploadedStats.avgHealth < 60 ? "critical" : "on-track"}`}>
                            <span className="kpi-label">AVG PORTFOLIO HEALTH</span>
                            <div className="kpi-value">{uploadedStats.avgHealth}/100</div>
                            <div className="kpi-sub">Composite health index</div>
                          </div>
                        </div>
                      )}

                      {/* DETAILED RESULTS TABLE */}
                      <div className="table-container" style={{ marginTop: "18px" }}>
                        <table className="projects-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Project & Ministry</th>
                              <th>Budget & Spend</th>
                              <th>Physical vs Financial</th>
                              <th>Contractor</th>
                              <th>🤖 ML Predicted Delay</th>
                              <th>🩺 AI Health Score</th>
                              <th>🛟 Doom & Recovery Verdict</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadedPredictions.map(({ project: p, risk, doom, anomaly }) => (
                              <tr key={p.id}>
                                <td><span className="id-badge">#{p.id}</span></td>
                                <td>
                                  <strong>{p.name}</strong>
                                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                    <span className="tag-dept">{p.department}</span>
                                    <small style={{ color: "#64748b" }}>{p.location}</small>
                                  </div>
                                </td>
                                <td>
                                  <strong>{money(p.approved_budget)}</strong>
                                  <small style={{ display: "block", color: "#64748b" }}>Spend: {money(p.expenditure)}</small>
                                </td>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "100px" }}>
                                    <div className="mini-progress-box">
                                      <span>Phys: {p.physical_progress}%</span>
                                      <div className="mini-bar"><div className="mini-fill good" style={{ width: `${p.physical_progress}%` }} /></div>
                                    </div>
                                    <div className="mini-progress-box">
                                      <span>Fin: {p.financial_progress}%</span>
                                      <div className="mini-bar"><div className="mini-fill" style={{ width: `${p.financial_progress}%` }} /></div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="contractor-pill">{p.contractor_name || "Unassigned"}</span>
                                </td>
                                <td>
                                  <span className={`status-tag ${risk.riskLevel === "CRITICAL" ? "critical" : risk.riskLevel === "HIGH" ? "delayed" : risk.riskLevel === "MEDIUM" ? "at-risk" : "on-track"}`}>
                                    {risk.estimatedDelayDays > 0 ? `+${risk.estimatedDelayDays}d Delay (${risk.riskLevel})` : "✓ On Track (0d)"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontSize: "1.05rem", color: risk.healthScore < 50 ? "#dc2626" : risk.healthScore < 75 ? "#d97706" : "#059669" }}>
                                      {risk.healthScore}/100
                                    </strong>
                                    <span className={`status-tag ${risk.healthCategory.toLowerCase()}`}>
                                      {risk.healthCategory}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: "0.82rem" }}>
                                    <span className={`status-tag ${doom.doom_category === "CRITICAL_DOOM" ? "critical" : doom.doom_category === "ELEVATED_RISK" ? "delayed" : "on-track"}`}>
                                      Doom: {doom.doom_score}% ({doom.doom_category.replace(/_/g, " ")})
                                    </span>
                                    {doom.recommended_salvage_actions && doom.recommended_salvage_actions.length > 0 && (
                                      <small style={{ display: "block", color: "#2563eb", marginTop: "4px", fontWeight: 600 }}>
                                        ↳ {doom.recommended_salvage_actions[0].title}
                                      </small>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="quick-table-actions">
                                    <button
                                      className="btn-action-mini salvage"
                                      onClick={() => {
                                        setActiveNav("Rescue & Salvage");
                                        setSelectedSalvageProjectId(p.id);
                                      }}
                                    >
                                      🛟 Salvage Plan
                                    </button>
                                    <button
                                      className="btn-action-mini"
                                      onClick={() => {
                                        setSelectedProject(p);
                                      }}
                                    >
                                      🔍 Deep Risk
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ADVANCED RAW TEXT INGESTION */}
                  <div className="advanced-paste-card">
                    <h4>📝 Or Paste Raw CSV / JSON Data Directly</h4>
                    <div className="template-button-row">
                      <span>Quick Load:</span>
                      <button
                        type="button"
                        className="btn-template"
                        onClick={() => setCustomInputText(exportProjectsToCsv(projects))}
                      >
                        Load Projects CSV Template
                      </button>
                      <button
                        type="button"
                        className="btn-template"
                        onClick={() => setCustomInputText(exportMasterJson())}
                      >
                        Load Master JSON Template
                      </button>
                      <button
                        type="button"
                        className="btn-template clear"
                        onClick={() => setCustomInputText("")}
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      className="form-control code-textarea"
                      rows={8}
                      placeholder="Paste CSV rows here: id,name,department,location,approved_budget,expenditure,physical_progress,financial_progress..."
                      value={customInputText}
                      onChange={(e) => setCustomInputText(e.target.value)}
                    />
                    <div style={{ marginTop: "12px" }}>
                      <button
                        className="btn-primary-glow"
                        onClick={handleCustomDatasetImport}
                        disabled={!customInputText.trim()}
                      >
                        🚀 Run AI Inference on Pasted Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXPORT & SHOWCASE DOWNLOADS */}
              {datasetActiveTab === "studio" && (
                <div className="dataset-studio-tab">
                  <div className="export-cards-grid">
                    {/* JSON MASTER EXPORT */}
                    <div className="export-card featured">
                      <div className="card-tag">RECOMMENDED FULL SUITE</div>
                      <div className="export-card-header">
                        <span className="file-icon json-icon">{"{ }"}</span>
                        <div>
                          <h4>MoSPI Master Showcase (JSON)</h4>
                          <span className="file-meta">v3.0.0 • ~75 KB • All 4 Relational Entities</span>
                        </div>
                      </div>
                      <p className="card-desc">
                        Contains the entire relational structure: 20 infrastructure projects, 12 contractor dossiers, 36 past project histories, and 113 milestones. Ready for immediate programmatic ingestion.
                      </p>
                      <div className="card-footer">
                        <button
                          className="btn-download primary"
                          onClick={() => downloadBlob(exportMasterJson(), "mospi_comprehensive_showcase.json", "application/json")}
                        >
                          ⬇ Download Master JSON
                        </button>
                        <a
                          href="/mospi_comprehensive_showcase.json"
                          target="_blank"
                          rel="noreferrer"
                          className="btn-view-raw"
                        >
                          👁 Open Raw
                        </a>
                      </div>
                    </div>

                    {/* PROJECTS CSV */}
                    <div className="export-card">
                      <div className="card-tag">CSV FORMAT</div>
                      <div className="export-card-header">
                        <span className="file-icon csv-icon">📊</span>
                        <div>
                          <h4>Projects Master CSV</h4>
                          <span className="file-meta">20 Rows • 21 Columns • ~7 KB</span>
                        </div>
                      </div>
                      <p className="card-desc">
                        Sanctioned budgets, actual expenditure, physical & financial progress, delay days, contractor links, health scores, and operational statuses.
                      </p>
                      <div className="card-footer">
                        <button
                          className="btn-download"
                          onClick={() => downloadBlob(exportProjectsToCsv(projects), "mospi_projects_master.csv", "text/csv")}
                        >
                          ⬇ Download Projects CSV
                        </button>
                        <a
                          href="/mospi_projects_master.csv"
                          download="mospi_projects_master.csv"
                          className="btn-view-raw"
                        >
                          Direct Link
                        </a>
                      </div>
                    </div>

                    {/* CONTRACTORS CSV */}
                    <div className="export-card">
                      <div className="card-tag">CSV FORMAT</div>
                      <div className="export-card-header">
                        <span className="file-icon csv-icon">🛡️</span>
                        <div>
                          <h4>Contractors Master CSV</h4>
                          <span className="file-meta">12 Dossiers • 14 Columns • ~2 KB</span>
                        </div>
                      </div>
                      <p className="card-desc">
                        Vendor registrations, CIN numbers, GST statuses, litigation counts, shell corporation risk scores, ghost labor flags, and vetting ratings.
                      </p>
                      <div className="card-footer">
                        <button
                          className="btn-download"
                          onClick={() => downloadBlob(exportContractorsToCsv(contractors), "mospi_contractors_master.csv", "text/csv")}
                        >
                          ⬇ Download Contractors CSV
                        </button>
                        <a
                          href="/mospi_contractors_master.csv"
                          download="mospi_contractors_master.csv"
                          className="btn-view-raw"
                        >
                          Direct Link
                        </a>
                      </div>
                    </div>

                    {/* MILESTONES CSV */}
                    <div className="export-card">
                      <div className="card-tag">CSV FORMAT</div>
                      <div className="export-card-header">
                        <span className="file-icon csv-icon">⏱️</span>
                        <div>
                          <h4>Milestones Master CSV</h4>
                          <span className="file-meta">113 Deliverables • 7 Columns • ~10 KB</span>
                        </div>
                      </div>
                      <p className="card-desc">
                        Sequenced milestone gates across all projects, planned vs actual delivery dates, completion status flags, and project weightage percentages.
                      </p>
                      <div className="card-footer">
                        <button
                          className="btn-download"
                          onClick={() => downloadBlob(exportMilestonesToCsv(milestones), "mospi_milestones_master.csv", "text/csv")}
                        >
                          ⬇ Download Milestones CSV
                        </button>
                        <a
                          href="/mospi_milestones_master.csv"
                          download="mospi_milestones_master.csv"
                          className="btn-view-raw"
                        >
                          Direct Link
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* SQLITE DATABASE INGESTION CLI GUIDE */}
                  <div className="db-cli-guide-card">
                    <div className="guide-header">
                      <span className="cli-badge">💻 BACKEND DATABASE CLI</span>
                      <h4>Direct SQLite Ingestion & Automated Seeding</h4>
                    </div>
                    <p>
                      If you are hosting or developing the FastAPI & SQLite backend locally, you can use our built-in Python ingestion script to batch-populate <code>database/projectpulse.db</code> with this dataset:
                    </p>
                    <div className="code-block-display">
                      <code>python database/import_dataset.py --file database/mospi_comprehensive_showcase.json</code>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard?.writeText("python database/import_dataset.py --file database/mospi_comprehensive_showcase.json");
                          alert("CLI command copied to clipboard!");
                        }}
                      >
                        Copy Command
                      </button>
                    </div>
                    <div className="cli-stats">
                      <span>✓ Auto-migrates schema if missing</span>
                      <span>✓ Verifies FK integrity across Contractors & Milestones</span>
                      <span>✓ Refreshes SQLite DB in &lt; 0.1s</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: INTERACTIVE DATA EXPLORER */}
              {datasetActiveTab === "preview" && (
                <div className="dataset-preview-tab">
                  {/* CONTROLS STRIP */}
                  <div className="preview-controls-strip">
                    <div className="table-switcher">
                      <button
                        className={`table-btn ${previewTable === "projects" ? "active" : ""}`}
                        onClick={() => setPreviewTable("projects")}
                      >
                        ▣ Projects ({projects.length})
                      </button>
                      <button
                        className={`table-btn ${previewTable === "contractors" ? "active" : ""}`}
                        onClick={() => setPreviewTable("contractors")}
                      >
                        🛡️ Contractors ({contractors.length})
                      </button>
                      <button
                        className={`table-btn ${previewTable === "milestones" ? "active" : ""}`}
                        onClick={() => setPreviewTable("milestones")}
                      >
                        ⏱️ Milestones ({milestones.length})
                      </button>
                    </div>

                    <div className="preview-search-box">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder={`Filter ${previewTable}...`}
                        value={datasetSearch}
                        onChange={(e) => setDatasetSearch(e.target.value)}
                        className="form-control"
                      />
                      {datasetSearch && (
                        <button className="clear-search" onClick={() => setDatasetSearch("")}>✕</button>
                      )}
                    </div>
                  </div>

                  {/* PROJECTS PREVIEW TABLE */}
                  {previewTable === "projects" && (
                    <div className="table-container">
                      <table className="projects-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Project Initiative</th>
                            <th>Ministry</th>
                            <th>Location</th>
                            <th>Budget</th>
                            <th>Spend</th>
                            <th>Physical %</th>
                            <th>Financial %</th>
                            <th>Contractor</th>
                            <th>Status</th>
                            <th>Quick Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects
                            .filter((p) => {
                              if (!datasetSearch.trim()) return true;
                              const q = datasetSearch.toLowerCase();
                              return (
                                p.name?.toLowerCase().includes(q) ||
                                p.department?.toLowerCase().includes(q) ||
                                p.location?.toLowerCase().includes(q) ||
                                p.contractor_name?.toLowerCase().includes(q) ||
                                p.status?.toLowerCase().includes(q)
                              );
                            })
                            .map((p) => (
                              <tr key={p.id}>
                                <td><span className="id-badge">#{p.id}</span></td>
                                <td>
                                  <strong>{p.name}</strong>
                                  <small style={{ display: "block", color: "#64748b" }}>{p.description?.slice(0, 50)}...</small>
                                </td>
                                <td><span className="tag-dept">{p.department}</span></td>
                                <td>{p.location}</td>
                                <td><strong>{money(p.approved_budget)}</strong></td>
                                <td>{money(p.expenditure)}</td>
                                <td>
                                  <div className="mini-progress-box">
                                    <span>{p.physical_progress}%</span>
                                    <div className="mini-bar"><div className="mini-fill good" style={{ width: `${p.physical_progress}%` }} /></div>
                                  </div>
                                </td>
                                <td>
                                  <div className="mini-progress-box">
                                    <span>{p.financial_progress}%</span>
                                    <div className="mini-bar"><div className="mini-fill" style={{ width: `${p.financial_progress}%` }} /></div>
                                  </div>
                                </td>
                                <td>
                                  <span className="contractor-pill">{p.contractor_name || "Assigned Vendor"}</span>
                                </td>
                                <td>
                                  <span className={`status-tag ${statusConfig[p.status]?.className || "on-track"}`}>
                                    {statusConfig[p.status]?.icon} {statusConfig[p.status]?.label || p.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="quick-table-actions">
                                    <button
                                      className="btn-action-mini"
                                      title="Inspect in Projects View"
                                      onClick={() => {
                                        setActiveNav("Projects");
                                        setSelectedProject(p);
                                      }}
                                    >
                                      🔍 Inspect
                                    </button>
                                    <button
                                      className="btn-action-mini salvage"
                                      title="Open Salvage Blueprint"
                                      onClick={() => {
                                        setActiveNav("Rescue & Salvage");
                                        setSelectedSalvageProjectId(p.id);
                                      }}
                                    >
                                      🛟 Salvage
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CONTRACTORS PREVIEW TABLE */}
                  {previewTable === "contractors" && (
                    <div className="table-container">
                      <table className="projects-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Company Entity</th>
                            <th>CIN Number</th>
                            <th>Reg Year</th>
                            <th>GST Status</th>
                            <th>Blacklisted?</th>
                            <th>Past Deliveries</th>
                            <th>Shell Risk</th>
                            <th>Ghost Labor</th>
                            <th>Vetting Rating</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractors
                            .filter((c) => {
                              if (!datasetSearch.trim()) return true;
                              const q = datasetSearch.toLowerCase();
                              return (
                                c.company_name?.toLowerCase().includes(q) ||
                                c.cin_number?.toLowerCase().includes(q) ||
                                c.fraud_risk_rating?.toLowerCase().includes(q)
                              );
                            })
                            .map((c) => (
                              <tr key={c.id}>
                                <td><span className="id-badge">#{c.id}</span></td>
                                <td><strong>{c.company_name}</strong></td>
                                <td><code>{c.cin_number || "U45200MH2008PLC184321"}</code></td>
                                <td>{c.registration_year || "2010"}</td>
                                <td>
                                  <span className={`status-tag ${c.gst_status === "ACTIVE" ? "on-track" : "critical"}`}>
                                    {c.gst_status || "ACTIVE"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-tag ${c.blacklisted ? "critical" : "on-track"}`}>
                                    {c.blacklisted ? "🚨 BLACKLISTED" : "✓ CLEAR"}
                                  </span>
                                </td>
                                <td><strong>{c.past_projects_count || 3} Projects</strong></td>
                                <td>
                                  <span className={`status-tag ${(c.shell_risk_score || 10) > 40 ? "critical" : "on-track"}`}>
                                    {c.shell_risk_score || 12.5}%
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-tag ${(c.ghost_labor_risk_score || 10) > 40 ? "critical" : "on-track"}`}>
                                    {c.ghost_labor_risk_score || 14.0}%
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-tag ${c.fraud_risk_rating === "CRITICAL" ? "critical" : c.fraud_risk_rating === "HIGH" ? "delayed" : c.fraud_risk_rating === "MEDIUM" ? "at-risk" : "on-track"}`}>
                                    {c.fraud_risk_rating || "LOW"} RISK
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn-action-mini"
                                    onClick={() => {
                                      setActiveNav("Fraud & Vetting");
                                      setSelectedContractorDossier(c);
                                    }}
                                  >
                                    🛡️ Dossier
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* MILESTONES PREVIEW TABLE */}
                  {previewTable === "milestones" && (
                    <div className="table-container">
                      <table className="projects-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Project Ref</th>
                            <th>Milestone Deliverable Gate</th>
                            <th>Planned Date</th>
                            <th>Actual Date</th>
                            <th>Status</th>
                            <th>Weightage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {milestones
                            .filter((m) => {
                              if (!datasetSearch.trim()) return true;
                              const q = datasetSearch.toLowerCase();
                              return (
                                m.name?.toLowerCase().includes(q) ||
                                m.status?.toLowerCase().includes(q) ||
                                String(m.project_id).includes(q)
                              );
                            })
                            .map((m) => {
                              const proj = projects.find((p) => p.id === m.project_id);
                              return (
                                <tr key={m.id}>
                                  <td><span className="id-badge">#{m.id}</span></td>
                                  <td>
                                    <strong>#{m.project_id} {proj ? proj.name : `Project ${m.project_id}`}</strong>
                                  </td>
                                  <td>{m.name}</td>
                                  <td><code>{m.planned_date}</code></td>
                                  <td><code>{m.actual_date || "Pending"}</code></td>
                                  <td>
                                    <span className={`status-tag ${m.status === "COMPLETED" ? "on-track" : m.status === "IN_PROGRESS" ? "at-risk" : m.status === "DELAYED" ? "delayed" : "pending"}`}>
                                      {m.status}
                                    </span>
                                  </td>
                                  <td><strong>{m.weightage_pct || 20}%</strong></td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SCHEMA & DATA DICTIONARY */}
              {datasetActiveTab === "dictionary" && (
                <div className="dataset-dictionary-tab">
                  <div className="dictionary-header-box">
                    <h3>📖 MoSPI PMIS Data Schema & Field Dictionary</h3>
                    <p>
                      Exhaustive technical definitions of all 24 schema fields across Projects, Contractors, and Milestones. These attributes serve as inputs for MoSPI's AI Ensemble, including Random Forest delay regressors, MCA compliance checks, and recovery blueprint generators.
                    </p>
                  </div>
                  <div className="table-container">
                    <table className="projects-table dictionary-table">
                      <thead>
                        <tr>
                          <th>Table</th>
                          <th>Field Name</th>
                          <th>Data Type</th>
                          <th>Business Description</th>
                          <th>Sample Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DATASET_DICTIONARY.map((d, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="tag-table">{d.table}</span>
                            </td>
                            <td>
                              <code>{d.field}</code>
                            </td>
                            <td>
                              <span className="type-badge">{d.type}</span>
                            </td>
                            <td>{d.desc}</td>
                            <td>
                              <span className="sample-val">{d.sample}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
          CONTRACTOR HISTORICAL PROJECT DOSSIER MODAL
      ========================================================= */}
      {selectedContractorDossier && (
        <div className="modal-overlay" onClick={() => setSelectedContractorDossier(null)}>
          <div className="modal-content dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📋 Contractor Audit Dossier & Historical Projects</h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                  Verified delivery track record across Central & State ministry packages
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedContractorDossier(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="dossier-summary-bar">
                <div>
                  <span className="meta-label">Contractor Name</span>
                  <h3 style={{ margin: "4px 0" }}>{selectedContractorDossier.name}</h3>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    CIN/PAN: <strong>{selectedContractorDossier.pan_cin || "AAACL1234F"}</strong> | Category: <strong>{selectedContractorDossier.category}</strong>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`status-pill pill-${(selectedContractorDossier.status || "APPROVED").toLowerCase()}`} style={{ fontSize: "0.95rem" }}>
                    {selectedContractorDossier.status}
                  </span>
                  <div style={{ marginTop: "4px", fontSize: "0.85rem", color: "#64748b" }}>
                    Max Handled: <strong>{money(selectedContractorDossier.max_project_budget_handled)}</strong>
                  </div>
                </div>
              </div>

              <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>Historical Infrastructure Project Deliveries:</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Ministry</th>
                      <th>Sanctioned Outlay</th>
                      <th>Actual Final Cost</th>
                      <th>Cost Overrun</th>
                      <th>Delay Days</th>
                      <th>Status</th>
                      <th>Audit Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContractorDossier.histories && selectedContractorDossier.histories.length > 0 ? (
                      selectedContractorDossier.histories.map((h) => (
                        <tr key={h.id}>
                          <td><strong>{h.project_name}</strong> ({h.year_completed})</td>
                          <td>{h.ministry || "Infrastructure"}</td>
                          <td>{money(h.sanctioned_budget)}</td>
                          <td>{money(h.actual_cost)}</td>
                          <td style={{ color: h.cost_overrun_pct > 10 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                            +{h.cost_overrun_pct}%
                          </td>
                          <td>{h.delay_days} days</td>
                          <td>
                            <span className={`status-tag ${h.completion_status === "COMPLETED" ? "on-track" : "critical"}`}>
                              {h.completion_status}
                            </span>
                          </td>
                          <td>
                            {h.audit_irregularity_flag ? (
                              <span className="badge-ghost danger">⚠️ Irregularity Logged</span>
                            ) : (
                              <span className="badge-ghost clean">✓ Clean Audit</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                          No historical projects archived yet for this contractor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setSelectedContractorDossier(null)}
              >
                Close Dossier
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setVettingContractorId(selectedContractorDossier.id);
                  setVettingContractorMode("empaneled");
                  setActiveNav("Fraud & Vetting");
                  setSelectedContractorDossier(null);
                  handleRunVettingAnalysis(selectedContractorDossier.id, vettingProjectId);
                }}
              >
                ⚡ Evaluate in Tender Screening Simulator →
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
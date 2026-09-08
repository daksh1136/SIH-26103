/**
 * Standalone Client-Side Data Pool & AI Simulation Engine for MoSPI ProjectPulse.
 * Provides rich, realistic data and instant client-side AI analysis without backend dependency.
 */

export const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "National Highway Expansion Corridor",
    department: "Infrastructure",
    location: "Assam",
    manager: "Er. Rajesh Baruah",
    start_date: "2025-01-10",
    planned_completion: "2026-11-20",
    approved_budget: 85000000,
    released_funds: 70000000,
    expenditure: 52000000,
    physical_progress: 62,
    financial_progress: 61,
    expected_progress: 65,
    milestones_total: 6,
    milestones_delayed: 0,
    resource_availability: 80,
    contractor_performance: 82,
    material_availability: 85,
    previous_delays: 0,
    status: "ON_TRACK",
    description: "4-lane highway expansion connecting key industrial nodes across Assam.",
  },
  {
    id: 2,
    name: "Rural Water Supply Network",
    department: "Rural Development",
    location: "Meghalaya",
    manager: "Er. Phira Marwein",
    start_date: "2024-11-15",
    planned_completion: "2026-06-30",
    approved_budget: 42000000,
    released_funds: 39000000,
    expenditure: 36000000,
    physical_progress: 58,
    financial_progress: 86,
    expected_progress: 74,
    milestones_total: 5,
    milestones_delayed: 2,
    resource_availability: 58,
    contractor_performance: 60,
    material_availability: 62,
    previous_delays: 1,
    status: "AT_RISK",
    description: "Piped water distribution covering 120 rural habitations under Jal Jeevan Mission.",
  },
  {
    id: 3,
    name: "Digital Governance & Citizen Portal",
    department: "Digital Governance",
    location: "Tripura",
    manager: "Er. Sourav Debbarma",
    start_date: "2025-04-01",
    planned_completion: "2026-12-15",
    approved_budget: 25000000,
    released_funds: 20000000,
    expenditure: 11000000,
    physical_progress: 45,
    financial_progress: 44,
    expected_progress: 48,
    milestones_total: 4,
    milestones_delayed: 0,
    resource_availability: 90,
    contractor_performance: 88,
    material_availability: 92,
    previous_delays: 0,
    status: "ON_TRACK",
    description: "State-wide centralized public service delivery and grievance redressal platform.",
  },
  {
    id: 4,
    name: "Urban Development & Drainage Mission",
    department: "Urban Development",
    location: "Mizoram",
    manager: "Er. Lalremruata",
    start_date: "2024-09-01",
    planned_completion: "2026-04-15",
    approved_budget: 65000000,
    released_funds: 60000000,
    expenditure: 57000000,
    physical_progress: 61,
    financial_progress: 88,
    expected_progress: 85,
    milestones_total: 6,
    milestones_delayed: 2,
    resource_availability: 52,
    contractor_performance: 58,
    material_availability: 55,
    previous_delays: 1,
    status: "DELAYED",
    description: "Stormwater drainage, sewage trunk lines, and road widening across municipal wards.",
  },
  {
    id: 5,
    name: "Power Transmission Grid Expansion",
    department: "Energy",
    location: "Nagaland",
    manager: "Er. Vikato Sema",
    start_date: "2024-12-01",
    planned_completion: "2026-08-30",
    approved_budget: 110000000,
    released_funds: 90000000,
    expenditure: 85000000,
    physical_progress: 49,
    financial_progress: 77,
    expected_progress: 70,
    milestones_total: 5,
    milestones_delayed: 2,
    resource_availability: 64,
    contractor_performance: 66,
    material_availability: 58,
    previous_delays: 1,
    status: "AT_RISK",
    description: "132 kV sub-station upgrades and transmission line linking remote hill districts.",
  },
  {
    id: 6,
    name: "District Healthcare Infrastructure",
    department: "Health",
    location: "Arunachal Pradesh",
    manager: "Er. Tage Dusu",
    start_date: "2025-05-15",
    planned_completion: "2027-02-28",
    approved_budget: 38000000,
    released_funds: 15000000,
    expenditure: 8000000,
    physical_progress: 31,
    financial_progress: 21,
    expected_progress: 30,
    milestones_total: 5,
    milestones_delayed: 0,
    resource_availability: 82,
    contractor_performance: 80,
    material_availability: 78,
    previous_delays: 0,
    status: "ON_TRACK",
    description: "New 100-bed mother and child healthcare wing with diagnostic facilities.",
  },
  {
    id: 7,
    name: "Education Infrastructure Upgrade",
    department: "Education",
    location: "Sikkim",
    manager: "Er. Pema Bhutia",
    start_date: "2025-01-20",
    planned_completion: "2026-07-31",
    approved_budget: 30000000,
    released_funds: 28000000,
    expenditure: 27000000,
    physical_progress: 52,
    financial_progress: 90,
    expected_progress: 75,
    milestones_total: 4,
    milestones_delayed: 2,
    resource_availability: 55,
    contractor_performance: 62,
    material_availability: 58,
    previous_delays: 2,
    status: "AT_RISK",
    description: "Smart classrooms, STEM laboratories, and seismic retrofitting across model schools.",
  },
  {
    id: 8,
    name: "Rail Infrastructure Modernization",
    department: "Railways",
    location: "Assam",
    manager: "Er. Anupam Sarma",
    start_date: "2024-06-01",
    planned_completion: "2026-03-31",
    approved_budget: 150000000,
    released_funds: 145000000,
    expenditure: 135000000,
    physical_progress: 43,
    financial_progress: 90,
    expected_progress: 88,
    milestones_total: 7,
    milestones_delayed: 4,
    resource_availability: 42,
    contractor_performance: 48,
    material_availability: 45,
    previous_delays: 3,
    status: "CRITICAL",
    description: "Broad gauge track doubling, automated electronic interlocking, and bridge upgrades.",
  },
  {
    id: 9,
    name: "Flood Management & River Embankment",
    department: "Water Resources",
    location: "Manipur",
    manager: "Er. Ibomcha Singh",
    start_date: "2025-06-01",
    planned_completion: "2027-04-30",
    approved_budget: 55000000,
    released_funds: 20000000,
    expenditure: 12000000,
    physical_progress: 27,
    financial_progress: 22,
    expected_progress: 26,
    milestones_total: 5,
    milestones_delayed: 0,
    resource_availability: 86,
    contractor_performance: 85,
    material_availability: 84,
    previous_delays: 0,
    status: "ON_TRACK",
    description: "Geo-textile riverbank revetment, sluice gate reconstruction, and flood warning sensors.",
  },
  {
    id: 10,
    name: "Smart City Connectivity Corridor",
    department: "Urban Development",
    location: "Meghalaya",
    manager: "Er. Banrap Kharbhih",
    start_date: "2024-07-15",
    planned_completion: "2026-05-15",
    approved_budget: 72000000,
    released_funds: 70000000,
    expenditure: 68000000,
    physical_progress: 48,
    financial_progress: 94,
    expected_progress: 82,
    milestones_total: 6,
    milestones_delayed: 3,
    resource_availability: 45,
    contractor_performance: 50,
    material_availability: 48,
    previous_delays: 2,
    status: "CRITICAL",
    description: "Intelligent transport systems (ITS), transit flyover, and optical fiber network ducting.",
  },
  {
    id: 11,
    name: "Industrial Corridor Express Highway",
    department: "Infrastructure",
    location: "Uttar Pradesh",
    manager: "Er. Manoj Bajpai",
    start_date: "2024-08-01",
    planned_completion: "2026-09-30",
    approved_budget: 220000000,
    released_funds: 180000000,
    expenditure: 155000000,
    physical_progress: 54,
    financial_progress: 70,
    expected_progress: 72,
    milestones_total: 8,
    milestones_delayed: 2,
    resource_availability: 68,
    contractor_performance: 70,
    material_availability: 65,
    previous_delays: 1,
    status: "AT_RISK",
    description: "6-lane high-speed expressway providing direct freight connectivity to industrial zones.",
  },
  {
    id: 12,
    name: "Coastal Port Rail Evacuation Link",
    department: "Railways",
    location: "Odisha",
    manager: "Er. Debendra Patnaik",
    start_date: "2024-10-01",
    planned_completion: "2026-10-15",
    approved_budget: 180000000,
    released_funds: 140000000,
    expenditure: 115000000,
    physical_progress: 59,
    financial_progress: 64,
    expected_progress: 66,
    milestones_total: 6,
    milestones_delayed: 1,
    resource_availability: 76,
    contractor_performance: 78,
    material_availability: 72,
    previous_delays: 0,
    status: "ON_TRACK",
    description: "Dedicated heavy-haul railway track connecting mineral hinterland to the deep-water port.",
  },
];

export const INITIAL_ALERTS = [
  {
    id: 1,
    project_id: 8,
    project_name: "Rail Infrastructure Modernization",
    department: "Railways",
    location: "Assam",
    severity: "CRITICAL",
    category: "Schedule Slippage & Resource Bottleneck",
    message: "Critical delay detected: Physical progress (43%) lags 45% behind financial expenditure (90%). 4 key milestones overdue.",
    recommendation: "Mobilize +30% contractor workforce immediately and invoke Milestone Recovery Plan under GCC.",
    status: "ACTIVE",
    created_at: "2026-09-08T08:30:00Z",
  },
  {
    id: 2,
    project_id: 10,
    project_name: "Smart City Connectivity Corridor",
    department: "Urban Development",
    location: "Meghalaya",
    severity: "CRITICAL",
    category: "Financial-Physical Imbalance",
    message: "94% of sanctioned funds expended while physical progress is only 48%. Budget exhaustion risk imminent.",
    recommendation: "Freeze non-essential contingency funds and conduct immediate physical measurement audit.",
    status: "ACTIVE",
    created_at: "2026-09-07T14:15:00Z",
  },
  {
    id: 3,
    project_id: 4,
    project_name: "Urban Development & Drainage Mission",
    department: "Urban Development",
    location: "Mizoram",
    severity: "WARNING",
    category: "Milestone Default",
    message: "Intermediate phase milestone overdue by 42 days. Critical path execution slowed due to material procurement delay.",
    recommendation: "Authorize alternate local vendor empanelment to resolve cement and steel supply constraints.",
    status: "ACTIVE",
    created_at: "2026-09-06T11:20:00Z",
  },
  {
    id: 4,
    project_id: 2,
    project_name: "Rural Water Supply Network",
    department: "Rural Development",
    location: "Meghalaya",
    severity: "WARNING",
    category: "Contractor Resource Deficit",
    message: "Contractor resource deployment recorded at 58% against target 80%. Risk of missing pre-monsoon deadline.",
    recommendation: "Issue show-cause directive requiring contractor to deploy secondary work shifts.",
    status: "ACTIVE",
    created_at: "2026-09-05T09:45:00Z",
  },
];

export const INITIAL_MILESTONES = [
  { id: 101, project_id: 8, project_name: "Rail Infrastructure Modernization", name: "Bridge Superstructure Erection", due_date: "2026-02-15", status: "OVERDUE", progress: 40 },
  { id: 102, project_id: 8, project_name: "Rail Infrastructure Modernization", name: "Electronic Interlocking Signalling", due_date: "2026-03-31", status: "OVERDUE", progress: 25 },
  { id: 103, project_id: 10, project_name: "Smart City Connectivity Corridor", name: "Flyover Pier Cap Casting", due_date: "2026-01-20", status: "OVERDUE", progress: 50 },
  { id: 104, project_id: 4, project_name: "Urban Development & Drainage Mission", name: "Primary Trunk Drain Excavation", due_date: "2026-02-28", status: "OVERDUE", progress: 65 },
  { id: 105, project_id: 1, project_name: "National Highway Expansion Corridor", name: "Pavement Quality Concrete (PQC) Layer", due_date: "2026-08-15", status: "UPCOMING", progress: 55 },
  { id: 106, project_id: 6, project_name: "District Healthcare Infrastructure", name: "Structural Framing & RCC Slab", due_date: "2026-09-30", status: "UPCOMING", progress: 35 },
  { id: 107, project_id: 9, project_name: "Flood Management & River Embankment", name: "Geo-textile Embankment Bunding", due_date: "2026-11-10", status: "UPCOMING", progress: 30 },
  { id: 108, project_id: 3, project_name: "Digital Governance & Citizen Portal", name: "Security Audit & Data Centre Staging", due_date: "2026-07-15", status: "UPCOMING", progress: 45 },
];

export const PROJECT_DEPENDENCIES = [
  {
    id: 1,
    source_id: 1,
    source_name: "National Highway Expansion Corridor",
    target_id: 10,
    target_name: "Smart City Connectivity Corridor",
    dependency_type: "Physical Freight Trunk Pre-requisite",
    coupling_strength: 0.85,
  },
  {
    id: 2,
    source_id: 8,
    source_name: "Rail Infrastructure Modernization",
    target_id: 12,
    target_name: "Coastal Port Rail Evacuation Link",
    dependency_type: "Network Feeder Interconnection",
    coupling_strength: 0.90,
  },
  {
    id: 3,
    source_id: 5,
    source_name: "Power Transmission Grid Expansion",
    target_id: 11,
    target_name: "Industrial Corridor Express Highway",
    dependency_type: "Grid Substation Utility Clearance",
    coupling_strength: 0.70,
  },
];

// ============================================================================
// CLIENT-SIDE AI CALCULATION ENGINE
// ============================================================================

export function calculateProjectHealthScore(p) {
  const phys = Number(p.physical_progress) || 0;
  const exp = Number(p.expected_progress) || 50;
  const fin = Number(p.financial_progress) || 0;
  const mTot = Math.max(Number(p.milestones_total) || 1, 1);
  const mDel = Number(p.milestones_delayed) || 0;
  const res = Number(p.resource_availability) || 75;
  const mat = Number(p.material_availability) || 75;
  const cont = Number(p.contractor_performance) || 70;

  // 1. Schedule Performance (25%)
  const slippage = exp - phys;
  let scheduleScore = slippage <= 0 ? 100 : Math.max(5, 100 - slippage * 2.8);

  // 2. Physical Progress (25%)
  let physicalScore = exp > 0 ? Math.min(100, (phys / exp) * 100) : 100;

  // 3. Financial Performance (15%)
  const finGap = fin - phys;
  let finScore = finGap <= 5 ? 100 : Math.max(10, 100 - finGap * 2.2);

  // 4. Milestone Performance (15%)
  let milestoneScore = Math.max(0, ((mTot - mDel) / mTot) * 100);

  // 5. Resource Health (10%)
  let resourceScore = 0.5 * res + 0.5 * mat;

  // 6. Contractor Health (10%)
  let contractorScore = cont;

  const total =
    scheduleScore * 0.25 +
    physicalScore * 0.25 +
    finScore * 0.15 +
    milestoneScore * 0.15 +
    resourceScore * 0.10 +
    contractorScore * 0.10;

  const finalScore = Number(Math.max(0, Math.min(100, total)).toFixed(1));

  let category = "HEALTHY";
  let label = "Healthy";
  let badge = "🟢";
  if (finalScore < 40) {
    category = "CRITICAL";
    label = "Critical";
    badge = "🔴";
  } else if (finalScore < 60) {
    category = "HIGH_RISK";
    label = "High Risk";
    badge = "🟠";
  } else if (finalScore < 80) {
    category = "AT_RISK";
    label = "At Risk";
    badge = "🟡";
  }

  return {
    score: finalScore,
    category,
    label,
    badge,
    components: {
      schedule: Number(scheduleScore.toFixed(1)),
      physical: Number(physicalScore.toFixed(1)),
      financial: Number(finScore.toFixed(1)),
      milestones: Number(milestoneScore.toFixed(1)),
      resources: Number(resourceScore.toFixed(1)),
      contractor: Number(contractorScore.toFixed(1)),
    },
  };
}

export function calculateProjectRiskIntelligence(p) {
  const phys = Number(p.physical_progress) || 0;
  const exp = Number(p.expected_progress) || 50;
  const fin = Number(p.financial_progress) || 0;
  const mDel = Number(p.milestones_delayed) || 0;
  const mTot = Math.max(Number(p.milestones_total) || 1, 1);
  const res = Number(p.resource_availability) || 75;
  const mat = Number(p.material_availability) || 75;
  const cont = Number(p.contractor_performance) || 70;

  const slippage = exp - phys;
  const finGap = fin - phys;
  const mRatio = mDel / mTot;

  // Risk Probability Calculation
  const latent =
    0.35 * (Math.max(0, slippage) / 20) +
    0.25 * mRatio +
    0.15 * Math.max(0, (finGap - 10) / 30) +
    0.15 * Math.max(0, (75 - res) / 40) +
    0.10 * Math.max(0, (75 - cont) / 40);

  const prob = 1 / (1 + Math.exp(-4.5 * (latent - 0.35)));
  const delayProbPct = Number((Math.min(0.96, Math.max(0.08, prob)) * 100).toFixed(1));

  let riskLevel = "LOW";
  let badge = "🟢";
  if (delayProbPct >= 75) {
    riskLevel = "CRITICAL";
    badge = "🔴";
  } else if (delayProbPct >= 50) {
    riskLevel = "HIGH";
    badge = "🟠";
  } else if (delayProbPct >= 25) {
    riskLevel = "MEDIUM";
    badge = "🟡";
  }

  const estimatedDelayDays = Math.max(0, Math.round(Math.max(0, slippage) * 3.8 + mDel * 22 + (delayProbPct / 100) * 35));

  // SHAP Feature Contribution Breakdown (%)
  const rawAttributions = [
    { factor: "Physical progress below expected schedule", value: Math.max(0.01, slippage * 1.8 + (slippage > 15 ? 10 : 0)) },
    { factor: "Milestone slippage ratio", value: Math.max(0.01, mRatio * 32 + mDel * 5) },
    { factor: "Contractor manpower & equipment shortage", value: Math.max(0.01, (75 - res) * 1.2) },
    { factor: "Financial vs physical progress imbalance", value: Math.max(0.01, finGap * 1.1) },
    { factor: "Contractor execution performance deficit", value: Math.max(0.01, (75 - cont) * 1.0) },
    { factor: "Material procurement bottleneck", value: Math.max(0.01, (75 - mat) * 1.0) },
  ];

  const totalAttr = rawAttributions.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const shapFactors = rawAttributions
    .map((item) => ({
      factor: item.factor,
      percentage: Number(((item.value / totalAttr) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Root Cause Diagnosis
  let primaryCause = "Routine Execution Variances";
  let secondaryCauses = [];
  let diagnosticConfidence = 88;
  const evidence = [];

  if (mDel >= 2) {
    primaryCause = "Cumulative Milestone Slippage";
    secondaryCauses.push("Contractor Resource Shortage", "Material Procurement Delay");
    evidence.push(`${mDel} monitored milestones missed planned deadlines.`);
  } else if (res < 60 || cont < 60) {
    primaryCause = "Contractor Resource Shortage";
    secondaryCauses.push("Payment Processing Delay", "Milestone Slippage");
    evidence.push(`Workforce availability at ${res}% (benchmark >= 75%), execution index ${cont}/100.`);
  } else if (finGap > 20) {
    primaryCause = "Financial-Physical Progress Imbalance";
    secondaryCauses.push("Advance Disbursals Unreconciled", "Material Procurement Delay");
    evidence.push(`Expenditure exceeds verified ground progress by ${finGap.toFixed(1)}%.`);
  } else if (mat < 65) {
    primaryCause = "Material Procurement Bottleneck";
    secondaryCauses.push("Transit Logistic Delays", "Vendor Credit Line Limit");
    evidence.push(`Material availability at ${mat}% (benchmark >= 75%).`);
  }

  if (evidence.length === 0) {
    evidence.push("All operational indicators are tracking within approved variance limits.");
  }

  // Recommended Corrective Actions
  let actions = [];
  let urgency = "ROUTINE";
  let authority = "Executive Engineer";
  let timeline = 30;

  if (primaryCause === "Cumulative Milestone Slippage") {
    urgency = "IMMEDIATE";
    authority = "Chief Engineer / Department Secretary";
    timeline = 14;
    actions = [
      "Formalize a Milestone Recovery Plan (MRP) compressing downstream critical-path activities.",
      "Crash non-critical float activities and deploy double-shift working on key structural works.",
      "Escalate issue to State Infrastructure Monitoring Committee (SIMC).",
      "Institute bi-weekly verified milestone compliance reviews.",
    ];
  } else if (primaryCause === "Contractor Resource Shortage") {
    urgency = "IMMEDIATE";
    authority = "Superintending Engineer / Project Director";
    timeline = 7;
    actions = [
      "Direct contractor to mobilize +25% additional skilled manpower and heavy machinery within 7 days.",
      "Issue formal contractual notice under General Conditions of Contract (GCC) clause 46.",
      "Establish biometric on-site labor logging and daily equipment inspection.",
    ];
  } else if (primaryCause === "Financial-Physical Progress Imbalance") {
    urgency = "HIGH";
    authority = "Financial Controller & Chief Accounts Officer";
    timeline = 14;
    actions = [
      "Order third-party physical measurement audit for all bills cleared in the previous two cycles.",
      "Freeze subsequent mobilization disbursements until verified physical works reconcile with expenditure.",
      "Re-align future releases strictly to geo-tagged physical milestone verification.",
    ];
  } else {
    actions = [
      "Continue routine bi-weekly project performance review against baseline schedule.",
      "Monitor supply logistics and ensure timely invoice settlement to prevent supplier bottlenecks.",
    ];
  }

  const health = calculateProjectHealthScore(p);

  return {
    riskScore: delayProbPct,
    riskLevel,
    badge,
    estimatedDelayDays,
    healthScore: health.score,
    healthCategory: health.label,
    healthBadge: health.badge,
    healthComponents: health.components,
    shapFactors,
    rootCause: {
      primary: primaryCause,
      secondary: secondaryCauses,
      confidence: diagnosticConfidence,
      evidence,
    },
    recommendations: {
      urgency,
      authority,
      timeline,
      actions,
      recoveryPlanRequired: mDel > 0 || slippage > 15,
    },
  };
}

export function detectProjectAnomalies(p) {
  const phys = Number(p.physical_progress) || 0;
  const fin = Number(p.financial_progress) || 0;
  const spend = Number(p.expenditure) || 0;
  const budget = Number(p.approved_budget) || 1;
  const finGap = fin - phys;
  const budgetUtil = (spend / budget) * 100;

  const issues = [];
  let score = 0;

  if (finGap >= 30) {
    score += 45;
    issues.push(`Severe Financial-Physical Disparity: Financial progress (${fin}%) exceeds physical completion (${phys}%) by ${finGap.toFixed(1)}%.`);
  } else if (finGap >= 15) {
    score += 20;
    issues.push(`Moderate Financial Lead: Financial disbursement is ${finGap.toFixed(1)}% ahead of physical milestones.`);
  }

  if (budgetUtil >= 85 && phys < 50) {
    score += 40;
    issues.push(`Premature Budget Exhaustion: ${budgetUtil.toFixed(1)}% of sanctioned funds expended while physical progress is only ${phys}%.`);
  }

  if (phys < 5 && spend > 5000000) {
    score += 35;
    issues.push(`Nil Ground Progress with High Spend: ₹${(spend / 10000000).toFixed(2)} Cr expended but physical works have not commenced.`);
  }

  const isAnomaly = score >= 35;
  const level = score >= 60 ? "HIGH" : score >= 35 ? "MODERATE" : "NORMAL";
  const label = isAnomaly ? "Potential anomaly — verification required" : "Data Consistent";

  return {
    isAnomaly,
    score,
    level,
    label,
    issues,
    metrics: {
      physical: phys,
      financial: fin,
      gap: finGap,
      budgetUtil: Number(budgetUtil.toFixed(1)),
    },
  };
}

export function simulateWhatIf(project, interventions) {
  const base = calculateProjectRiskIntelligence(project);

  const fundingInc = Number(interventions.funding_increase_pct) || 0;
  const manpowerInc = Number(interventions.manpower_increase_pct) || 0;
  const materialInc = Number(interventions.material_boost_pct) || 0;
  const extDays = Number(interventions.deadline_extension_days) || 0;

  // Clone and adjust parameters
  const simProject = { ...project };

  if (manpowerInc > 0) {
    simProject.resource_availability = Math.min(100, (Number(simProject.resource_availability) || 70) * (1 + manpowerInc / 100));
  }
  if (materialInc > 0) {
    simProject.material_availability = Math.min(100, (Number(simProject.material_availability) || 70) * (1 + materialInc / 100));
  }
  if (fundingInc > 0) {
    simProject.released_funds = Math.min(simProject.approved_budget, (Number(simProject.released_funds) || 0) * (1 + fundingInc / 100));
  }

  // Acceleration
  const totalBoost = (manpowerInc * 0.4 + materialInc * 0.4 + fundingInc * 0.2) / 100;
  if (totalBoost > 0) {
    simProject.physical_progress = Math.min(100, (Number(simProject.physical_progress) || 0) * (1 + totalBoost * 0.35));
    if (simProject.milestones_delayed > 0 && totalBoost >= 0.15) {
      simProject.milestones_delayed = Math.max(0, simProject.milestones_delayed - 1);
    }
  }

  // Schedule relief from extension
  if (extDays > 0) {
    const curExp = Number(simProject.expected_progress) || 50;
    const reliefFactor = 365 / (365 + extDays);
    simProject.expected_progress = Math.max(10, Math.round(curExp * reliefFactor));
  }

  const simulated = calculateProjectRiskIntelligence(simProject);

  const riskReduction = Number((base.riskScore - simulated.riskScore).toFixed(1));
  const daysSaved = Math.max(0, base.estimatedDelayDays - simulated.estimatedDelayDays);
  const healthGain = Number((simulated.healthScore - base.healthScore).toFixed(1));

  return {
    base,
    simulated,
    delta: {
      riskReduction,
      daysSaved,
      healthGain,
    },
  };
}

export function answerProjectQuery(query, projects) {
  const q = query.toLowerCase();

  // 1. Single Project explanation: "Why is Project X high risk?"
  const matchedProject = projects.find((p) => q.includes(p.name.toLowerCase()) || q.includes(`project ${p.id}`) || q.includes(`#${p.id}`));

  if (matchedProject || q.includes("why is") || q.includes("rail infrastructure")) {
    const target = matchedProject || projects.find((p) => p.name.includes("Rail") || p.status === "CRITICAL") || projects[0];
    const intel = calculateProjectRiskIntelligence(target);
    return {
      type: "PROJECT_EXPLANATION",
      title: target.name,
      response: `**${target.name}** is currently flagged at **${intel.riskLevel} (${intel.riskScore}%)** with a Project Health Score of **${intel.healthScore}/100 (${intel.healthCategory})**.\n\n` +
        `**Top Risk Drivers (SHAP Attribution):**\n` +
        intel.shapFactors.map((f, i) => `• ${f.factor}: **${f.percentage}% impact**`).join("\n") +
        `\n\n**Diagnosed Root Cause:**\n` +
        `**${intel.rootCause.primary}** (Confidence: ${intel.rootCause.confidence}%)\n` +
        `_${intel.rootCause.evidence[0]}_\n\n` +
        `**Recommended Corrective Action (${intel.recommendations.urgency} Priority):**\n` +
        intel.recommendations.actions.map((a, i) => `${i + 1}. ${a}`).join("\n") +
        `\n\n*Action Authority: ${intel.recommendations.authority} within ${intel.recommendations.timeline} days.*`,
    };
  }

  // 2. Anomaly query: "Which projects have anomalies?"
  if (q.includes("anomaly") || q.includes("financial utilization") || q.includes("mismatch") || q.includes("fraud")) {
    const flagged = projects.map((p) => ({ p, anom: detectProjectAnomalies(p) })).filter((item) => item.anom.isAnomaly);
    return {
      type: "ANOMALY_REPORT",
      title: "Data Integrity Screening",
      response: `⚠️ **Identified ${flagged.length} Projects with Potential Reporting Anomalies**:\n\n` +
        flagged
          .map(
            ({ p, anom }) =>
              `• **${p.name}** (${p.department}, ${p.location})\n` +
              `  - Physical Progress: ${p.physical_progress}% vs Financial Progress: ${p.financial_progress}%\n` +
              `  - Flag: _${anom.label}_ (Score: ${anom.score}/100)\n` +
              `  - Issue: ${anom.issues[0]}`
          )
          .join("\n\n") +
        `\n\n*Note: All flagged cases require administrative field verification by supervisory engineers.*`,
    };
  }

  // 3. Location or high risk filter
  if (q.includes("assam") || q.includes("high risk") || q.includes("critical")) {
    const filtered = projects.filter((p) => p.location.toLowerCase().includes("assam") || p.status === "CRITICAL" || p.status === "AT_RISK");
    return {
      type: "FILTERED_LIST",
      title: "Filtered Project Intelligence",
      response: `Found **${filtered.length} high-priority projects** matching your criteria:\n\n` +
        filtered
          .map((p) => {
            const intel = calculateProjectRiskIntelligence(p);
            return `• ${intel.badge} **${p.name}** (${p.department}) — Delay Risk: **${intel.riskScore}%**, Health: **${intel.healthScore}/100**, Progress: ${p.physical_progress}% physical / ${p.financial_progress}% financial.`;
          })
          .join("\n"),
    };
  }

  // Default summary overview
  const totalBudget = projects.reduce((acc, p) => acc + (p.approved_budget || 0), 0);
  const totalSpend = projects.reduce((acc, p) => acc + (p.expenditure || 0), 0);
  const avgPhys = (projects.reduce((acc, p) => acc + (p.physical_progress || 0), 0) / projects.length).toFixed(1);
  const criticalCount = projects.filter((p) => p.status === "CRITICAL").length;

  return {
    type: "PORTFOLIO_OVERVIEW",
    title: "National Infrastructure Portfolio Summary",
    response: `### 📊 MoSPI Executive Portfolio Overview\n\n` +
      `• **Total Projects Monitored:** ${projects.length}\n` +
      `• **Sanctioned Capital Outlay:** ₹${(totalBudget / 10000000).toFixed(1)} Cr (Utilized: ₹${(totalSpend / 10000000).toFixed(1)} Cr)\n` +
      `• **Average Physical Execution:** ${avgPhys}%\n` +
      `• **Projects in Critical Risk:** ${criticalCount}\n\n` +
      `*You can ask specific questions like "Why is Project 8 high risk?", "Which projects have anomalies?", or "High risk projects in Assam".*`,
  };
}

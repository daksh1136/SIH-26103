const API_BASE = "http://127.0.0.1:8000";

export async function getProjects() {
  const response = await fetch(`${API_BASE}/api/projects`);

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  return response.json();
}

export async function getDashboardSummary() {
  const response = await fetch(
    `${API_BASE}/api/dashboard/summary`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }

  return response.json();
}

export async function getStatusDistribution() {
  const response = await fetch(
    `${API_BASE}/api/dashboard/status-distribution`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch status distribution");
  }

  return response.json();
}

export async function getDepartmentSummary() {
  const response = await fetch(
    `${API_BASE}/api/dashboard/department-summary`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch department summary");
  }

  return response.json();
}

export async function getAlerts() {
  const response = await fetch(
    `${API_BASE}/api/alerts`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch alerts");
  }

  return response.json();
}

export async function getProjectRisk(projectId) {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/risk`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch project risk");
  }

  return response.json();
}

export async function generateAlert(projectId) {
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/generate-alert`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate alert");
  }

  return response.json();
}

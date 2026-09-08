"""
Natural Language Query Parser for Project Intelligence Assistant.
Parses user inquiries to extract intents, department filters, locations,
project identifiers, and risk thresholds.
"""

import re
from typing import Any, Dict, List, Optional


KNOWN_DEPARTMENTS = [
    "infrastructure", "railways", "rural development", "digital governance",
    "urban development", "energy", "power", "health", "education",
    "water resources", "road transport"
]

KNOWN_STATES = [
    "assam", "meghalaya", "tripura", "mizoram", "nagaland",
    "arunachal pradesh", "sikkim", "manipur", "uttar pradesh",
    "up", "maharashtra", "bihar", "odisha", "madhya pradesh",
    "mp", "rajasthan", "tamil nadu", "karnataka", "west bengal", "gujarat"
]


def parse_project_query(query_text: str) -> Dict[str, Any]:
    """
    Parses natural language query into intent and extracted query slots.
    """
    q = query_text.lower().strip()

    intent = "GENERAL_QUERY"
    project_id = None
    target_project_name = None
    target_dept = None
    target_state = None
    target_risk = None

    # 1. Project ID Extraction (e.g. "Project 8", "Project #2", "id 3")
    id_match = re.search(r"(?:project|id)\s*#?\s*(\d+)", q)
    if id_match:
        project_id = int(id_match.group(1))

    # 2. Location / State Extraction
    for state in KNOWN_STATES:
        pattern = r"\b" + re.escape(state) + r"\b"
        if re.search(pattern, q):
            target_state = "Uttar Pradesh" if state == "up" else "Madhya Pradesh" if state == "mp" else state.title()
            break

    # 3. Department Extraction
    for dept in KNOWN_DEPARTMENTS:
        pattern = r"\b" + re.escape(dept) + r"\b"
        if re.search(pattern, q):
            target_dept = dept.title()
            break

    # 4. Risk Level Extraction
    if "critical" in q:
        target_risk = "CRITICAL"
    elif "high risk" in q or "high-risk" in q:
        target_risk = "HIGH"
    elif "at risk" in q or "at-risk" in q:
        target_risk = "AT_RISK"
    elif "on track" in q or "healthy" in q:
        target_risk = "ON_TRACK"

    # 5. Intent Classification
    if any(w in q for w in ["why", "reason", "cause", "explain"]):
        intent = "PROJECT_EXPLANATION"
    elif any(w in q for w in ["action", "recommend", "corrective", "solution", "fix"]):
        intent = "PROJECT_RECOMMENDATION"
    elif any(w in q for w in ["health", "score", "performance index"]):
        intent = "PROJECT_HEALTH"
    elif any(w in q for w in ["anomaly", "discrepancy", "financial utilization", "mismatch", "fraud", "irregular"]):
        intent = "ANOMALY_QUERY"
    elif any(w in q for w in ["which", "list", "show", "filter", "find", "all"]):
        intent = "FILTER_QUERY"
    elif any(w in q for w in ["summary", "overview", "status", "dashboard", "report"]):
        intent = "PORTFOLIO_SUMMARY"

    return {
        "raw_query": query_text,
        "intent": intent,
        "project_id": project_id,
        "target_project_name": target_project_name,
        "department": target_dept,
        "location": target_state,
        "risk_level": target_risk,
    }

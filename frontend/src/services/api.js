
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function apiRequest(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export function getHealth() {
  return apiRequest("/health");
}

export function getCurrentDrought() {
  return apiRequest("/drought/current");
}

export function getDistricts() {
  return apiRequest("/drought/districts");
}

export function getDistrictHistory(district) {
  return apiRequest(
    `/drought/history/${encodeURIComponent(district)}`
  );
}

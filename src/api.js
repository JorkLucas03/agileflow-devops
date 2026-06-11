const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`StudyFlow API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchContent(options = {}) {
  return apiRequest('/api/content', options);
}

export function createStudyPlan(payload, options = {}) {
  return apiRequest('/api/study-plans', {
    ...options,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateStudyPlan(id, payload, options = {}) {
  return apiRequest(`/api/study-plans/${id}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

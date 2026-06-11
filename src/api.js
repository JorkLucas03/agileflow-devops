const configuredApiUrl = import.meta.env.VITE_API_URL || '';
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = (configuredApiUrl || (isLocalHost ? 'http://localhost:8000' : '')).replace(/\/$/, '');

const FIELD_LABELS = {
  subject: 'Materia',
  examDate: 'Fecha de examen',
  hoursPerDay: 'Horas por dia',
  difficulty: 'Dificultad',
  focus: 'Objetivo',
  topics: 'Temas pendientes',
};

export class StudyFlowApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = 'StudyFlowApiError';
    this.status = status;
    this.detail = detail;
  }
}

function validationMessageFor(field, message) {
  if (field === 'hoursPerDay') {
    return 'Ingresa entre 1 y 8 horas por dia.';
  }

  if (field === 'subject') {
    return 'Escribe una materia de 1 a 120 caracteres.';
  }

  if (field === 'topics') {
    return 'Los temas pendientes no pueden superar 600 caracteres.';
  }

  if (field === 'difficulty') {
    return 'Selecciona una dificultad valida.';
  }

  if (field === 'focus') {
    return 'Selecciona un objetivo valido.';
  }

  if (field === 'examDate') {
    return 'Selecciona una fecha de examen valida.';
  }

  return `${FIELD_LABELS[field] || 'Campo'}: ${message}`;
}

function formatValidationErrors(detail) {
  if (!Array.isArray(detail)) {
    return 'Revisa los datos del formulario.';
  }

  const messages = detail.map((item) => {
    const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
    return validationMessageFor(field, item.msg || 'valor invalido');
  });

  return [...new Set(messages)].join(' ');
}

function getApiErrorMessage(status, body) {
  if (status === 422) {
    return formatValidationErrors(body?.detail);
  }

  if (typeof body?.detail === 'string') {
    return body.detail;
  }

  if (status >= 500) {
    return 'La API respondio con un error interno. Intentalo de nuevo.';
  }

  return 'No se pudo completar la solicitud con la API.';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    throw new StudyFlowApiError(getApiErrorMessage(response.status, body), {
      status: response.status,
      detail: body?.detail,
    });
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

export function fetchStudyPlans(options = {}) {
  return apiRequest('/api/study-plans', options);
}

export function deleteStudyPlan(id, options = {}) {
  return apiRequest(`/api/study-plans/${id}`, {
    ...options,
    method: 'DELETE',
  });
}

export function updateStudyPlan(id, payload, options = {}) {
  return apiRequest(`/api/study-plans/${id}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

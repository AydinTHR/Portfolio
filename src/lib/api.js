const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

class ApiError extends Error {
  constructor(status, message) {
    super(message || `Request failed (${status})`);
    this.status = status;
  }
}

const request = async (path, { method = 'GET', body } = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json())?.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : undefined);
  }
  return res.json();
};

export const api = {
  // Content
  getContent: () => request('/api/content'),
  putContent: (content) => request('/api/content', { method: 'PUT', body: content }),

  // Contact
  submitContact: (data) => request('/api/contact', { method: 'POST', body: data }),

  // Auth
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // Messages (admin)
  getMessages: () => request('/api/messages'),
  setMessageRead: (id, read) =>
    request(`/api/messages/${id}`, { method: 'PATCH', body: { read } }),
  deleteMessage: (id) => request(`/api/messages/${id}`, { method: 'DELETE' }),

  // Analytics
  trackEvent: (event) =>
    request('/api/analytics/event', { method: 'POST', body: event }).catch(() => {}),
  getAnalyticsSummary: () => request('/api/analytics/summary'),
};

export { ApiError };

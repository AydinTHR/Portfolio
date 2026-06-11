const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

class ApiError extends Error {
  constructor(status, message) {
    super(message || `Request failed (${status})`);
    this.status = status;
  }
}

const request = async (path, { method = 'GET', body, formData } = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    // For FormData the browser sets the multipart boundary header itself.
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: formData || (body ? JSON.stringify(body) : undefined),
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

  // Draft (admin working copy)
  getDraft: () => request('/api/content/draft'),
  saveDraft: (content) => request('/api/content/draft', { method: 'PUT', body: content }),
  deleteDraft: () => request('/api/content/draft', { method: 'DELETE' }),

  // Versions (rollback history)
  getVersions: () => request('/api/content/versions'),
  restoreVersion: (id) => request(`/api/content/versions/${id}/restore`, { method: 'POST' }),

  // Contact
  submitContact: (data) => request('/api/contact', { method: 'POST', body: data }),

  // Auth
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // Messages (admin)
  getMessages: () => request('/api/messages'),
  getUnreadCount: () => request('/api/messages/unread-count'),
  setMessageRead: (id, read) =>
    request(`/api/messages/${id}`, { method: 'PATCH', body: { read } }),
  deleteMessage: (id) => request(`/api/messages/${id}`, { method: 'DELETE' }),

  // Analytics
  trackEvent: (event) =>
    request('/api/analytics/event', {
      method: 'POST',
      body: { visitor: getVisitorId(), ...event },
    }).catch(() => {}),
  getAnalyticsSummary: () => request('/api/analytics/summary'),

  // Images
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/images', { method: 'POST', formData });
  },
};

// Anonymous first-party device id so repeat visits from the same browser can
// be counted. Lives only in this site's localStorage; null when storage is
// unavailable (private mode), which the API tolerates.
const getVisitorId = () => {
  try {
    let id = localStorage.getItem('pf-visitor-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('pf-visitor-id', id);
    }
    return id;
  } catch {
    return null;
  }
};

// Stored image URLs are API paths ("/api/images/…"); point them at the API host.
export const resolveAssetUrl = (src) =>
  src && src.startsWith('/api/') ? `${API_BASE}${src}` : src;

export { ApiError };

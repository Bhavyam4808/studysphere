/**
 * StudySphere - API Client Helper
 * =================================
 * Communicates with the backend REST API at /api/*
 * Handles session tokens, JSON serialization, and error parsing.
 */

const API_BASE = '/api';

// Token and Session Storage
export const AuthStorage = {
  getToken: () => localStorage.getItem('studysphere_token') || '',
  setToken: (token) => localStorage.setItem('studysphere_token', token),
  clearToken: () => localStorage.removeItem('studysphere_token'),

  getUser: () => {
    try {
      const u = localStorage.getItem('studysphere_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('studysphere_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('studysphere_user'),

  logout: () => {
    AuthStorage.clearToken();
    AuthStorage.clearUser();
  }
};

// Generic Fetch Wrapper
async function request(endpoint, options = {}) {
  const token = AuthStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// API Methods
export const api = {
  // Auth
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      AuthStorage.setToken(data.token);
      AuthStorage.setUser(data.user);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (data.token) {
      AuthStorage.setToken(data.token);
      AuthStorage.setUser(data.user);
    }
    return data;
  },

  async getMe() {
    return request('/auth/me');
  },

  // Resources
  async getResources(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.subject && params.subject !== 'All') query.set('subject', params.subject);
    if (params.type && params.type !== 'All') query.set('type', params.type);
    if (params.sort) query.set('sort', params.sort);
    if (params.minRating) query.set('minRating', params.minRating);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/resources${qs}`);
  },

  async getResource(id) {
    return request(`/resources/${id}`);
  },

  // Ratings
  async rateResource(resourceId, rating) {
    return request('/ratings', {
      method: 'POST',
      body: JSON.stringify({ resourceId, rating })
    });
  },

  // Bookmarks
  async getBookmarks() {
    return request('/bookmarks');
  },

  async toggleBookmark(resourceId) {
    return request('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  // Activity & Progress
  async recordView(resourceId) {
    return request('/activity/view', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  async toggleComplete(resourceId, completed = true) {
    return request('/activity/complete', {
      method: 'POST',
      body: JSON.stringify({ resourceId, completed })
    });
  },

  async getDashboard() {
    return request('/dashboard');
  },

  // StudySphere AI Chat (with resource context)
  async askAI(messages, context = null) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context })
    });
  },

  // Admin Operations
  async adminGetStats() {
    return request('/admin/stats');
  },

  async adminGetLoginHistory() {
    return request('/admin/login-history');
  },

  async adminGetUsers() {
    return request('/admin/users');
  },

  async adminCreateResource(resourceData) {
    return request('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  },

  async adminUpdateResource(id, resourceData) {
    return request(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData)
    });
  },

  async adminDeleteResource(id) {
    return request(`/resources/${id}`, {
      method: 'DELETE'
    });
  },

  async adminUploadPdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const res = await request('/upload', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              data: base64Data
            })
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(file);
    });
  }
};

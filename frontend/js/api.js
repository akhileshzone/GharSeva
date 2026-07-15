/**
 * Ghar Seva API client — JWT in localStorage
 * Endpoints mirror backend/API.md
 */
(function () {
  const TOKEN_KEY = 'ghar_seva_token';
  const USER_KEY = 'ghar_seva_user';

  function getBase() {
    const base =
      (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:4000';
    return String(base).replace(/\/$/, '');
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${getBase()}${path}`, {
        ...options,
        headers,
      });
    } catch {
      const error = new Error(
        'Cannot reach the server. Check API_BASE_URL / that the Render service is Live.'
      );
      error.network = true;
      throw error;
    }

    let body = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text };
      }
    }

    if (!res.ok) {
      const isAuthForm =
        path.includes('/auth/login') || path.includes('/auth/signup');
      if (res.status === 401 && !isAuthForm) {
        clearSession();
      }
      const error = new Error(
        (body && (body.error || body.message)) || `Request failed (${res.status})`
      );
      error.status = res.status;
      error.body = body;
      throw error;
    }

    return body;
  }

  window.API = {
    getToken,
    getStoredUser,
    setSession,
    clearSession,
    getBase,

    // —— System ——
    health() {
      return request('/health');
    },
    apiInfo() {
      return request('/');
    },

    // —— Auth ——
    async signup({ name, email, phone, password, location }) {
      const data = await request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, location }),
      });
      setSession(data.token, data.user);
      return data;
    },

    async login({ email, password }) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.user);
      return data;
    },

    async me() {
      const data = await request('/api/auth/me');
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    },

    async updateProfile(fields) {
      const data = await request('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    },

    async updateLocation(location) {
      const data = await request('/api/auth/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location }),
      });
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    },

    async logout() {
      try {
        if (getToken()) await request('/api/auth/logout', { method: 'POST' });
      } catch {
        /* ignore network on logout */
      }
      clearSession();
    },

    // —— Catalog ——
    listServices() {
      return request('/api/services');
    },
    getService(id) {
      return request(`/api/services/${encodeURIComponent(id)}`);
    },
    getMeta() {
      return request('/api/meta');
    },

    // —— Bookings ——
    listBookings(status) {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      return request(`/api/bookings${q}`);
    },
    getBooking(id) {
      return request(`/api/bookings/${encodeURIComponent(id)}`);
    },
    getBookingByCode(code) {
      return request(`/api/bookings/code/${encodeURIComponent(code)}`);
    },
    createBooking(payload) {
      return request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    cancelBooking(id) {
      return request(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
        method: 'PATCH',
      });
    },
  };
})();

/**
 * HTTP client for Ghar Seva API (JWT in localStorage)
 */
(function () {
  const TOKEN_KEY = 'ghar_seva_token';
  const USER_KEY = 'ghar_seva_user';

  function getBase() {
    return (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:4000';
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
    } catch (err) {
      const error = new Error(
        'Cannot reach the server. Check your connection and that the API is running.'
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
      if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/signup')) {
        clearSession();
      }
      const error = new Error((body && body.error) || `Request failed (${res.status})`);
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

    async updateLocation(location) {
      const data = await request('/api/auth/me/location', {
        method: 'PATCH',
        body: JSON.stringify({ location }),
      });
      if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data;
    },

    async createBooking(payload) {
      return request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async listBookings() {
      return request('/api/bookings');
    },

    async health() {
      return request('/health');
    },
  };
})();

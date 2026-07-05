/* BlogHub — shared client helpers (auth state + API wrapper) */
window.BlogHub = (function () {
  const TOKEN_KEY = 'authToken';
  const USER_KEY = 'userData';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  };
  const setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };
  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };
  const isAuthed = () => !!getToken();

  /**
   * Thin fetch wrapper. Always talks to /api.
   *   api('/blogs')                          -> GET  /api/blogs
   *   api('/auth/login', {method,body})      -> POST /api/auth/login
   *   api('/blogs', {method:'POST', body, auth:true})
   */
  async function api(path, opts = {}) {
    const { method = 'GET', body, auth = false } = opts;
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const t = getToken();
      if (t) headers['Authorization'] = t;
    }
    let res;
    try {
      res = await fetch('/api' + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (netErr) {
      throw new Error('Network error — is the server running?');
    }

    let data = null;
    try { data = await res.json(); } catch (_) { /* non-json */ }

    if (!res.ok) {
      const err = new Error((data && data.message) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      // an expired / invalid token should log the user out
      if (res.status === 401 && auth) clearAuth();
      throw err;
    }
    return data;
  }

  return { getToken, getUser, setAuth, clearAuth, isAuthed, api };
})();

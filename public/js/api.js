(function () {
  const TOKEN_KEY = 'schoolpay.token';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

  async function request(method, path, body, { raw = false } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(`/api${path}`, { method, headers, body: payload });

    if (raw) return res;

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = { rawText: text }; }

    if (!res.ok) {
      const err = new Error((data && data.error && data.error.message) || res.statusText);
      err.status = res.status;
      err.code = data && data.error && data.error.code;
      err.details = data && data.error && data.error.details;
      if (res.status === 401 && token) {
        // Token expired / revoked — bounce to login.
        setToken(null);
        if (!location.hash.startsWith('#/login')) location.hash = '#/login';
      }
      throw err;
    }
    return data;
  }

  function download(path, filename) {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`/api${path}`, { headers }).then(async (res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  window.Api = {
    getToken, setToken,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    patch: (p, b) => request('PATCH', p, b),
    del: (p) => request('DELETE', p),
    download
  };
})();

(function () {
  const app = document.getElementById('app');
  const routes = {};
  let current = {};

  function route(hash, handler) { routes[hash] = handler; }
  function navigate(hash) { window.location.hash = hash; }
  function render(html) { app.innerHTML = html; }

  function escape(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function moneyFmt(amount, currency) {
    return `${Number(amount || 0).toLocaleString()} ${currency || ''}`.trim();
  }

  function statusBadge(s) {
    return `<span class="badge ${s}">${s}</span>`;
  }

  function protect() {
    if (!Api.getToken()) { navigate('#/login'); return false; }
    return true;
  }

  function logout() { Api.setToken(null); navigate('#/login'); }

  // ---------- Screens ----------

  route('#/register', async () => {
    render(`
      <div class="card" style="max-width:480px;margin:40px auto;">
        <h1>Register your school</h1>
        <p class="muted">Each school is an isolated tenant with its own students, configs and dashboard.</p>
        <form id="f">
          <div class="field"><label>School name</label><input name="name" required></div>
          <div class="field"><label>Slug (used in URLs &amp; webhooks)</label><input name="slug" pattern="[a-z0-9][a-z0-9-]*" required placeholder="greenwood-high"></div>
          <div class="field"><label>Contact email</label><input name="email" type="email" required></div>
          <div class="field"><label>Phone</label><input name="phone"></div>
          <div class="field"><label>Admin full name</label><input name="adminName" required></div>
          <div class="field"><label>Password (min 8 chars)</label><input name="password" type="password" minlength="8" required></div>
          <div class="field"><label>Plan</label>
            <select name="plan"><option value="basic">Basic - MTN only</option><option value="pro">Pro - MTN + Orange</option><option value="enterprise">Enterprise</option></select>
          </div>
          <div id="err"></div>
          <button type="submit">Register</button>
          <a href="#/login" style="margin-left:10px;">Already have an account?</a>
        </form>
      </div>`);

    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        const res = await Api.post('/schools/register', data);
        render(`
          <div class="card" style="max-width:640px;margin:40px auto;">
            <h1>Welcome to ${escape(res.school.name)}!</h1>
            <div class="alert success">Your school has been created. Save the API key below — it is shown only once.</div>
            <label class="muted">API key</label>
            <pre>${escape(res.apiKey)}</pre>
            <a class="btn" href="#/login">Continue to login</a>
          </div>`);
      } catch (err) {
        document.getElementById('err').innerHTML = `<div class="alert">${escape(err.message)}</div>`;
      }
    });
  });

  route('#/login', async () => {
    render(`
      <div class="card" style="max-width:420px;margin:40px auto;">
        <h1>Login</h1>
        <form id="f">
          <div class="field"><label>Email</label><input name="email" type="email" required></div>
          <div class="field"><label>Password</label><input name="password" type="password" required></div>
          <div class="field"><label>School slug (optional)</label><input name="schoolSlug" placeholder="leave blank to auto-detect"></div>
          <div id="err"></div>
          <button type="submit">Sign in</button>
          <a href="#/register" style="margin-left:10px;">Register new school</a>
        </form>
      </div>`);
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.schoolSlug) delete data.schoolSlug;
      try {
        const res = await Api.post('/auth/login', data);
        Api.setToken(res.token);
        navigate('#/dashboard');
      } catch (err) {
        document.getElementById('err').innerHTML = `<div class="alert">${escape(err.message)}</div>`;
      }
    });
  });

  function shell(active, body) {
    return `
      <div class="row" style="margin-bottom:16px;">
        <div><h1>${escape(current.school && current.school.name || 'Dashboard')}</h1>
             <div class="muted">Plan: ${escape(current.school && current.school.plan || '-')} · Role: ${escape(current.user && current.user.role || '-')}</div></div>
        <div style="flex:0;"><button class="secondary" id="logout">Logout</button></div>
      </div>
      <div class="tabs">
        <a href="#/dashboard" class="${active==='dashboard'?'active':''}">Overview</a>
        <a href="#/students" class="${active==='students'?'active':''}">Students</a>
        <a href="#/payments" class="${active==='payments'?'active':''}">Payments</a>
        <a href="#/configs" class="${active==='configs'?'active':''}">Providers</a>
        <a href="#/subscription" class="${active==='subscription'?'active':''}">Subscription</a>
      </div>
      ${body}`;
  }

  async function loadMe() {
    if (current.user) return;
    const r = await Api.get('/auth/me');
    current = r;
  }

  route('#/dashboard', async () => {
    if (!protect()) return;
    await loadMe();
    const data = await Api.get('/dashboard/overview');
    const s = data.summary || {};
    const body = `
      <div class="grid">
        <div class="stat"><div class="label">Students</div><div class="value">${data.studentCount}</div></div>
        <div class="stat"><div class="label">Collected</div><div class="value">${moneyFmt(s.amount_collected, 'XAF')}</div></div>
        <div class="stat"><div class="label">Successful</div><div class="value">${s.success || 0}</div></div>
        <div class="stat"><div class="label">Pending</div><div class="value">${s.pending || 0}</div></div>
        <div class="stat"><div class="label">Failed</div><div class="value">${s.failed || 0}</div></div>
      </div>
      <div class="card" style="margin-top:16px;">
        <h2>Provider breakdown</h2>
        <table><thead><tr><th>Provider</th><th>Txn count</th><th>Amount collected</th></tr></thead>
          <tbody>${(data.providerBreakdown || []).map(p => `
            <tr><td>${escape(p.provider)}</td><td>${p.count}</td><td>${moneyFmt(p.collected, 'XAF')}</td></tr>`).join('') || '<tr><td colspan=3 class="muted">No transactions yet.</td></tr>'}
          </tbody></table>
      </div>
      <div class="card">
        <h2>Recent transactions</h2>
        <table><thead><tr><th>Date</th><th>Provider</th><th>Ref</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${(data.recentTransactions || []).map(t => `
            <tr><td>${escape(t.created_at)}</td><td>${escape(t.provider)}</td><td>${escape(t.external_id)}</td><td>${moneyFmt(t.amount, t.currency)}</td><td>${statusBadge(t.status)}</td></tr>`).join('') || '<tr><td colspan=5 class="muted">Nothing yet.</td></tr>'}
          </tbody></table>
      </div>`;
    render(shell('dashboard', body));
    document.getElementById('logout').onclick = logout;
  });

  route('#/students', async () => {
    if (!protect()) return;
    await loadMe();
    const res = await Api.get('/students?limit=200');
    const rows = (res.students || []).map((s) => `
      <tr><td>${escape(s.student_code)}</td><td>${escape(s.full_name)}</td><td>${escape(s.class_name||'')}</td><td>${moneyFmt(s.balance, s.currency)}</td></tr>`).join('');
    const body = `
      <div class="card">
        <h2>Add student</h2>
        <form id="f" class="row">
          <div class="field"><label>Student code</label><input name="studentCode" required></div>
          <div class="field"><label>Full name</label><input name="fullName" required></div>
          <div class="field"><label>Class</label><input name="className"></div>
          <div class="field"><label>Phone</label><input name="phone"></div>
          <div class="field" style="flex:0;"><label>&nbsp;</label><button type="submit">Add</button></div>
        </form>
        <div id="err"></div>
      </div>
      <div class="card">
        <h2>Students</h2>
        <table><thead><tr><th>Code</th><th>Name</th><th>Class</th><th>Balance</th></tr></thead>
          <tbody>${rows || '<tr><td colspan=4 class="muted">No students yet.</td></tr>'}</tbody></table>
      </div>`;
    render(shell('students', body));
    document.getElementById('logout').onclick = logout;
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try { await Api.post('/students', data); navigate('#/students'); location.reload(); }
      catch (err) { document.getElementById('err').innerHTML = `<div class="alert">${escape(err.message)}</div>`; }
    });
  });

  route('#/payments', async () => {
    if (!protect()) return;
    await loadMe();
    const [txList, configs] = await Promise.all([Api.get('/payments?limit=100'), Api.get('/schools/me/payment-configs')]);
    const providers = (configs.configs || []).filter((c) => c.is_active).map((c) => c.provider);
    const rows = (txList.transactions || []).map((t) => `
      <tr><td>${escape(t.created_at)}</td><td>${escape(t.provider)}</td><td>${escape(t.external_id)}</td><td>${moneyFmt(t.amount, t.currency)}</td><td>${statusBadge(t.status)}</td></tr>`).join('');
    const body = `
      <div class="card">
        <h2>Submit payment for verification</h2>
        <form id="f" class="row">
          <div class="field"><label>Student code</label><input name="studentCode" required></div>
          <div class="field"><label>Provider</label>
            <select name="provider" required>
              ${providers.length ? providers.map((p) => `<option value="${escape(p)}">${escape(p)}</option>`).join('')
                : '<option value="">Configure a provider first</option>'}
            </select>
          </div>
          <div class="field"><label>Transaction ID</label><input name="externalId" required></div>
          <div class="field" style="flex:0;"><label>&nbsp;</label><button type="submit">Verify</button></div>
        </form>
        <div id="err"></div>
      </div>
      <div class="card">
        <h2>Transactions</h2>
        <table><thead><tr><th>Date</th><th>Provider</th><th>Ref</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${rows || '<tr><td colspan=5 class="muted">No transactions yet.</td></tr>'}</tbody></table>
      </div>`;
    render(shell('payments', body));
    document.getElementById('logout').onclick = logout;
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try { await Api.post('/payments', data); location.reload(); }
      catch (err) { document.getElementById('err').innerHTML = `<div class="alert">${escape(err.message)}</div>`; }
    });
  });

  route('#/configs', async () => {
    if (!protect()) return;
    await loadMe();
    const res = await Api.get('/schools/me/payment-configs');
    const rows = (res.configs || []).map((c) => `
      <tr><td>${escape(c.provider)}</td><td>${c.is_active ? '✅ active' : '⚠ inactive'}</td><td>${c.has_credentials ? 'set' : 'missing'}</td><td>${escape(c.updated_at||'')}</td></tr>`).join('');
    const body = `
      <div class="card">
        <h2>Configure a provider</h2>
        <p class="muted">Credentials are encrypted at rest with AES-256-GCM. Each school's keys are isolated.</p>
        <form id="f">
          <div class="row">
            <div class="field"><label>Provider</label>
              <select name="provider"><option value="MTN">MTN</option><option value="ORANGE">Orange</option></select>
            </div>
            <div class="field"><label>Base URL (optional)</label><input name="base_url" placeholder="defaults to sandbox"></div>
          </div>
          <div class="field"><label>API key</label><input name="api_key" required></div>
          <div class="field"><label>API secret</label><input name="api_secret" required></div>
          <div id="err"></div>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="card">
        <h2>Current configs</h2>
        <table><thead><tr><th>Provider</th><th>Status</th><th>Credentials</th><th>Updated</th></tr></thead>
          <tbody>${rows || '<tr><td colspan=4 class="muted">None configured.</td></tr>'}</tbody></table>
      </div>`;
    render(shell('configs', body));
    document.getElementById('logout').onclick = logout;
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.base_url) delete data.base_url;
      try { await Api.put('/schools/me/payment-configs', data); location.reload(); }
      catch (err) { document.getElementById('err').innerHTML = `<div class="alert">${escape(err.message)}</div>`; }
    });
  });

  route('#/subscription', async () => {
    if (!protect()) return;
    await loadMe();
    const [plans, current2] = await Promise.all([Api.get('/subscriptions/plans'), Api.get('/subscriptions/current')]);
    const planCards = (plans.plans || []).map((p) => `
      <div class="card">
        <h2>${escape(p.name)}</h2>
        <div class="stat"><div class="label">Price</div><div class="value">${p.price == null ? 'Custom' : `$${p.price}/mo`}</div></div>
        <ul>
          <li>Providers: ${(p.features.providers || []).join(', ')}</li>
          <li>Max students: ${p.features.maxStudents == null ? 'Unlimited' : p.features.maxStudents}</li>
          <li>Reports: ${p.features.reports ? 'Yes' : 'No'}</li>
          <li>Audit logs: ${p.features.auditLogs ? 'Yes' : 'No'}</li>
        </ul>
        <button data-plan="${escape(p.id)}" class="choose">Choose ${escape(p.name)}</button>
      </div>`).join('');
    const body = `
      <div class="card">
        <h2>Current plan: ${escape((current2.plan && current2.plan.name) || '-')}</h2>
        <div class="muted">Status: ${escape(current2.status || '-')} · Expires: ${escape(current2.expiresAt || '—')}</div>
      </div>
      <div class="grid">${planCards}</div>`;
    render(shell('subscription', body));
    document.getElementById('logout').onclick = logout;
    document.querySelectorAll('button.choose').forEach((b) => {
      b.addEventListener('click', async () => {
        try { await Api.post('/subscriptions/change', { plan: b.dataset.plan, paymentReference: 'manual' }); location.reload(); }
        catch (err) { alert(err.message); }
      });
    });
  });

  function dispatch() {
    const hash = window.location.hash || '#/login';
    const handler = routes[hash] || routes['#/login'];
    handler();
  }

  window.addEventListener('hashchange', dispatch);
  window.addEventListener('load', dispatch);
})();

(function () {
  const app = document.getElementById('app');
  const toastsEl = document.getElementById('toasts');
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

  /**
   * Show an ephemeral toast. `type` is 'success' | 'error' | 'warn' | 'info'.
   * Auto-dismisses after `ms` (default 4s). Click to dismiss early.
   */
  function toast(message, type = 'info', { title, ms = 4000 } = {}) {
    if (!toastsEl) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      ${title ? `<div class="title">${escape(title)}</div>` : ''}
      <div class="msg">${escape(message)}</div>
    `;
    el.addEventListener('click', () => el.remove());
    toastsEl.appendChild(el);
    if (ms > 0) setTimeout(() => el.remove(), ms);
  }

  /**
   * Run `fn` and toast any thrown error. Returns the fn's return value, or
   * `undefined` if it threw. Keeps callers tidy.
   */
  async function tryAction(fn, { errorTitle = 'Something went wrong' } = {}) {
    try { return await fn(); }
    catch (err) { toast(err.message || 'Unexpected error', 'error', { title: errorTitle }); }
  }

  /**
   * Show a blocking confirmation modal. Resolves to true if the user confirmed,
   * false otherwise. Useful for destructive actions (delete, reverse, rotate).
   */
  function confirmDialog({ title = 'Are you sure?', body = '', confirmText = 'Confirm', danger = false } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <h2>${escape(title)}</h2>
          <div style="margin-bottom:16px;">${body}</div>
          <div class="row" style="justify-content:flex-end;">
            <button class="secondary shrink" data-action="cancel">Cancel</button>
            <button class="${danger ? 'danger' : ''} shrink" data-action="confirm">${escape(confirmText)}</button>
          </div>
        </div>`;
      const done = (value) => { overlay.remove(); resolve(value); };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) done(false);
        const action = e.target.getAttribute && e.target.getAttribute('data-action');
        if (action === 'cancel') done(false);
        if (action === 'confirm') done(true);
      });
      document.body.appendChild(overlay);
      overlay.querySelector('[data-action="confirm"]').focus();
    });
  }

  window.__ui = { toast, tryAction, confirmDialog };

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
        toast('School created. Save the API key — shown only once.', 'success', { title: `Welcome to ${res.school.name}` });
        render(`
          <div class="card" style="max-width:640px;margin:40px auto;">
            <h1>Welcome to ${escape(res.school.name)}!</h1>
            <div class="alert success">Save the API key below — it is shown only once.</div>
            <label class="muted">API key</label>
            <pre>${escape(res.apiKey)}</pre>
            <a class="btn" href="#/login">Continue to login</a>
          </div>`);
      } catch (err) {
        toast(err.message, 'error', { title: 'Registration failed' });
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
          <a href="#/forgot" style="margin-left:10px;">Forgot password?</a>
        </form>
      </div>`);
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.schoolSlug) delete data.schoolSlug;
      try {
        const res = await Api.post('/auth/login', data);
        Api.setToken(res.token);
        current = {};
        toast(`Signed in as ${res.user.email}`, 'success');
        navigate('#/dashboard');
      } catch (err) {
        toast(err.message, 'error', { title: 'Login failed' });
      }
    });
  });

  route('#/forgot', async () => {
    render(`
      <div class="card" style="max-width:420px;margin:40px auto;">
        <h1>Forgot password</h1>
        <p class="muted">Enter your email. If an account exists, we'll issue a reset token that's valid for 1 hour.</p>
        <form id="f">
          <div class="field"><label>Email</label><input name="email" type="email" required></div>
          <div class="field"><label>School slug (optional)</label><input name="schoolSlug"></div>
          <button type="submit">Send reset link</button>
          <a href="#/login" style="margin-left:10px;">Back to login</a>
        </form>
        <div id="devToken" style="margin-top:14px;"></div>
      </div>`);
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.schoolSlug) delete data.schoolSlug;
      try {
        const res = await Api.post('/auth/password-reset/request', data);
        toast('If the account exists, a reset link has been issued.', 'success');
        // When the server is configured with PASSWORD_RESET_EXPOSE_TOKEN=1 (dev mode),
        // it returns the plaintext token in the response so we can surface a one-click link.
        if (res && res.token) {
          const link = `${location.origin}/#/reset?token=${encodeURIComponent(res.token)}`;
          document.getElementById('devToken').innerHTML = `
            <div class="alert warn"><b>Dev mode:</b> server returned the reset token directly.
              <div style="margin-top:6px;"><a href="${link}">Open reset link</a></div>
              <pre style="margin-top:6px;">${escape(res.token)}</pre>
            </div>`;
        }
      } catch (err) {
        toast(err.message, 'error', { title: 'Request failed' });
      }
    });
  });

  route('#/reset', async (params) => {
    const token = (params && params.get('token')) || '';
    render(`
      <div class="card" style="max-width:420px;margin:40px auto;">
        <h1>Reset password</h1>
        <form id="f">
          <div class="field"><label>Reset token</label><input name="token" value="${escape(token)}" required></div>
          <div class="field"><label>New password (min 8 chars)</label><input name="newPassword" type="password" minlength="8" required></div>
          <button type="submit">Set new password</button>
          <a href="#/login" style="margin-left:10px;">Back to login</a>
        </form>
      </div>`);
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        await Api.post('/auth/password-reset/confirm', data);
        toast('Password updated. Please sign in.', 'success');
        navigate('#/login');
      } catch (err) {
        toast(err.message, 'error', { title: 'Reset failed' });
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
        <a href="#/settings" class="${active==='settings'?'active':''}">Settings</a>
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
      try {
        const r = await Api.post('/students', data);
        toast(`Added ${r.student.full_name}`, 'success');
        location.reload();
      } catch (err) {
        toast(err.message, 'error', { title: 'Could not add student' });
      }
    });
  });

  route('#/payments', async () => {
    if (!protect()) return;
    await loadMe();
    const [txList, configs] = await Promise.all([Api.get('/payments?limit=100'), Api.get('/schools/me/payment-configs')]);
    const providers = (configs.configs || []).filter((c) => c.is_active).map((c) => c.provider);
    const isAdmin = current.user && current.user.role === 'admin';
    const rows = (txList.transactions || []).map((t) => `
      <tr>
        <td>${escape(t.created_at)}</td>
        <td>${escape(t.provider)}</td>
        <td>${escape(t.external_id)}</td>
        <td>${moneyFmt(t.amount, t.currency)}</td>
        <td>${statusBadge(t.status)}</td>
        <td style="text-align:right;">${
          isAdmin && t.status === 'success'
            ? `<button class="secondary small reverse" data-id="${escape(t.id)}" data-ref="${escape(t.external_id)}" data-amount="${escape(t.amount)}" data-currency="${escape(t.currency)}">Reverse</button>`
            : ''
        }</td>
      </tr>`).join('');
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
      </div>
      <div class="card">
        <div class="toolbar">
          <h2 style="margin:0;">Transactions</h2>
          <div class="spacer"></div>
          <button class="secondary small" id="exportCsv">Export CSV</button>
        </div>
        <table><thead><tr><th>Date</th><th>Provider</th><th>Ref</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan=6 class="muted">No transactions yet.</td></tr>'}</tbody></table>
      </div>`;
    render(shell('payments', body));
    document.getElementById('logout').onclick = logout;
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        const r = await Api.post('/payments', data);
        toast(`Verified & credited ${moneyFmt(r.transaction.amount, r.transaction.currency)}`, 'success', { title: 'Payment posted' });
        location.reload();
      } catch (err) {
        toast(err.message, 'error', { title: 'Payment verification failed' });
      }
    });
    document.getElementById('exportCsv').addEventListener('click', async () => {
      const btn = document.getElementById('exportCsv');
      btn.disabled = true;
      const original = btn.textContent;
      btn.innerHTML = '<span class="spinner"></span> Exporting…';
      try {
        const filename = `transactions-${(current.school && current.school.slug) || 'export'}-${new Date().toISOString().slice(0,10)}.csv`;
        await Api.download('/payments/export.csv?limit=10000', filename);
        toast('CSV exported', 'success');
      } catch (err) {
        toast(err.message, 'error', { title: 'Export failed' });
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
    document.querySelectorAll('button.reverse').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const { id, ref, amount, currency } = btn.dataset;
        const ok = await confirmDialog({
          title: 'Reverse transaction?',
          body: `This will debit the student's balance by <b>${escape(moneyFmt(amount, currency))}</b> and mark transaction <span class="mono">${escape(ref)}</span> as reversed. This cannot be undone from the UI.`,
          confirmText: 'Reverse',
          danger: true
        });
        if (!ok) return;
        try {
          await Api.post(`/payments/${encodeURIComponent(id)}/reverse`, { reason: 'Reversed from dashboard' });
          toast(`Transaction ${ref} reversed`, 'success');
          location.reload();
        } catch (err) {
          toast(err.message, 'error', { title: 'Reversal failed' });
        }
      });
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
      try {
        await Api.put('/schools/me/payment-configs', data);
        toast(`${data.provider} credentials saved (encrypted)`, 'success');
        location.reload();
      } catch (err) {
        toast(err.message, 'error', { title: 'Could not save provider config' });
      }
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
        try {
          await Api.post('/subscriptions/change', { plan: b.dataset.plan, paymentReference: 'manual' });
          toast(`Plan changed to ${b.dataset.plan}`, 'success');
          location.reload();
        } catch (err) {
          toast(err.message, 'error', { title: 'Plan change failed' });
        }
      });
    });
  });

  route('#/settings', async () => {
    if (!protect()) return;
    await loadMe();
    const school = (await Api.get('/schools/me')).school;
    const body = `
      <div class="card">
        <h2>Profile</h2>
        <div class="row">
          <div><label>Email</label><input value="${escape(current.user.email)}" disabled></div>
          <div><label>Role</label><input value="${escape(current.user.role)}" disabled></div>
        </div>
      </div>

      <div class="card">
        <h2>School</h2>
        <div class="row">
          <div><label>Name</label><input value="${escape(school.name)}" disabled></div>
          <div><label>Slug</label><input value="${escape(school.slug)}" disabled></div>
          <div><label>Plan</label><input value="${escape(school.subscription_plan)}" disabled></div>
        </div>
        <div class="muted">Webhook URL: <span class="mono">${location.origin}/webhooks/&lt;PROVIDER&gt;/${escape(school.slug)}</span></div>
      </div>

      <div class="card">
        <h2>Change password</h2>
        <form id="pwf">
          <div class="row">
            <div><label>Current password</label><input name="currentPassword" type="password" required></div>
            <div><label>New password (min 8)</label><input name="newPassword" type="password" minlength="8" required></div>
            <div class="shrink"><label>&nbsp;</label><button type="submit">Update</button></div>
          </div>
        </form>
      </div>

      <div class="card">
        <h2>API key</h2>
        <p class="muted">The plaintext key is only shown at creation or rotation. Only its SHA-256 hash is stored.</p>
        <button class="secondary" id="rotate">Rotate API key</button>
        <div id="newkey" style="margin-top:12px;"></div>
      </div>

      <div class="card" style="border-color: var(--danger);">
        <h2 style="color: var(--danger);">Danger zone</h2>
        <p class="muted">Deleting the school is permanent. It cascades: students, transactions, provider configs, users, audit log — all gone.</p>
        <button class="danger" id="del">Delete this school</button>
      </div>`;
    render(shell('settings', body));
    document.getElementById('logout').onclick = logout;

    document.getElementById('pwf').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        await Api.post('/auth/change-password', data);
        toast('Password updated', 'success');
        e.target.reset();
      } catch (err) {
        toast(err.message, 'error', { title: 'Password change failed' });
      }
    });

    document.getElementById('rotate').addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Rotate API key?',
        body: 'The current key will stop working immediately. Save the new one — it is shown only once.',
        confirmText: 'Rotate',
        danger: true
      });
      if (!ok) return;
      try {
        const r = await Api.post('/schools/me/api-key/rotate');
        document.getElementById('newkey').innerHTML = `
          <div class="alert success">New API key (shown once):</div>
          <pre>${escape(r.apiKey)}</pre>`;
        toast('API key rotated', 'success');
      } catch (err) {
        toast(err.message, 'error', { title: 'Rotation failed' });
      }
    });

    document.getElementById('del').addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Delete this school?',
        body: `This removes <b>${escape(school.name)}</b> and all associated students, transactions, users and provider configs. This cannot be undone.`,
        confirmText: `Delete ${school.slug}`,
        danger: true
      });
      if (!ok) return;
      try {
        await Api.del('/schools/me');
        toast('School deleted', 'success');
        Api.setToken(null);
        current = {};
        navigate('#/register');
      } catch (err) {
        toast(err.message, 'error', { title: 'Deletion failed' });
      }
    });
  });

  function dispatch() {
    const raw = window.location.hash || '#/login';
    const [path, query = ''] = raw.split('?');
    const params = new URLSearchParams(query);
    const handler = routes[path] || routes['#/login'];
    handler(params);
  }

  window.addEventListener('hashchange', dispatch);
  window.addEventListener('load', dispatch);
})();

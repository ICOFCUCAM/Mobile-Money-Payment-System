/**
 * SchoolPay drop-in widget.
 *
 * Usage (from a school's website):
 *
 *   <script
 *     src="https://yoursystem.com/widget.js"
 *     data-school-id="SCH001"
 *     data-api-key="pk_live_xxx"
 *     data-provider="MTN"          (optional default)
 *     data-theme="light"            (light|dark, default light)
 *     data-api-base="https://yoursystem.com"  (optional, defaults to script origin)
 *   ></script>
 *   <div id="schoolpay-widget"></div>
 *
 * IMPORTANT: only embed your PUBLIC school API key here (the key you rotate
 * from the dashboard Settings page). Never embed a secret provider key. All
 * requests are scoped server-side by the API key's tenant.
 */
(function () {
  'use strict';

  // Find the script tag so we can read its data-* attributes.
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.indexOf('/widget.js') !== -1) return scripts[i];
      }
      return null;
    })();

  if (!currentScript) return;

  var config = {
    schoolId: currentScript.getAttribute('data-school-id') || '',
    apiKey: currentScript.getAttribute('data-api-key') || '',
    provider: (currentScript.getAttribute('data-provider') || 'MTN').toUpperCase(),
    theme: (currentScript.getAttribute('data-theme') || 'light').toLowerCase(),
    apiBase:
      currentScript.getAttribute('data-api-base') ||
      (function () {
        try { return new URL(currentScript.src).origin; } catch (_) { return ''; }
      })(),
    mountId: currentScript.getAttribute('data-mount') || 'schoolpay-widget'
  };

  if (!config.apiKey) {
    // eslint-disable-next-line no-console
    console.error('[SchoolPay widget] data-api-key is required');
    return;
  }

  // Inject styles once.
  if (!document.getElementById('schoolpay-widget-styles')) {
    var css =
      '.sp-widget{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'max-width:440px;margin:0 auto;padding:24px;border-radius:14px;' +
      'box-shadow:0 10px 30px rgba(15,23,42,.08);background:#fff;color:#0f172a;' +
      'border:1px solid #e2e8f0;box-sizing:border-box}' +
      '.sp-widget.sp-dark{background:#0f172a;color:#e2e8f0;border-color:#1e293b}' +
      '.sp-widget .sp-title{font-size:18px;font-weight:700;margin:0 0 4px}' +
      '.sp-widget .sp-sub{font-size:13px;color:#64748b;margin:0 0 16px}' +
      '.sp-widget.sp-dark .sp-sub{color:#94a3b8}' +
      '.sp-widget label{display:block;font-size:12px;font-weight:600;margin:10px 0 4px;color:#334155}' +
      '.sp-widget.sp-dark label{color:#cbd5e1}' +
      '.sp-widget input,.sp-widget select{width:100%;padding:10px 12px;border:1px solid #cbd5e1;' +
      'border-radius:8px;font-size:14px;background:#fff;color:#0f172a;box-sizing:border-box;' +
      'outline:none;transition:border-color .15s,box-shadow .15s}' +
      '.sp-widget.sp-dark input,.sp-widget.sp-dark select{background:#111c2f;border-color:#334155;color:#e2e8f0}' +
      '.sp-widget input:focus,.sp-widget select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}' +
      '.sp-widget button{width:100%;padding:11px 14px;border:0;border-radius:8px;background:#2563eb;' +
      'color:#fff;font-weight:600;font-size:14px;cursor:pointer;margin-top:14px;transition:background .15s}' +
      '.sp-widget button:hover{background:#1d4ed8}' +
      '.sp-widget button:disabled{background:#94a3b8;cursor:not-allowed}' +
      '.sp-widget .sp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.sp-widget .sp-msg{margin-top:14px;padding:12px;border-radius:8px;font-size:13px;line-height:1.5}' +
      '.sp-widget .sp-msg.sp-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}' +
      '.sp-widget .sp-msg.sp-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}' +
      '.sp-widget.sp-dark .sp-msg.sp-ok{background:rgba(16,185,129,.12);color:#6ee7b7;border-color:rgba(16,185,129,.3)}' +
      '.sp-widget.sp-dark .sp-msg.sp-err{background:rgba(239,68,68,.12);color:#fca5a5;border-color:rgba(239,68,68,.3)}' +
      '.sp-widget .sp-brand{margin-top:14px;text-align:center;font-size:11px;color:#94a3b8}' +
      '.sp-widget .sp-brand a{color:inherit;text-decoration:none;font-weight:600}';
    var style = document.createElement('style');
    style.id = 'schoolpay-widget-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function render() {
    var mount = document.getElementById(config.mountId);
    if (!mount) {
      // eslint-disable-next-line no-console
      console.error('[SchoolPay widget] mount element #' + config.mountId + ' not found');
      return;
    }
    mount.innerHTML = '';

    var root = document.createElement('div');
    root.className = 'sp-widget' + (config.theme === 'dark' ? ' sp-dark' : '');
    root.innerHTML =
      '<h3 class="sp-title">Pay school fees</h3>' +
      '<p class="sp-sub">Verify your mobile-money transaction to credit the student.</p>' +
      '<form id="sp-form">' +
      '  <label>Student ID</label>' +
      '  <input name="student_id" required placeholder="STU001" autocomplete="off" />' +
      '  <div class="sp-row">' +
      '    <div>' +
      '      <label>Provider</label>' +
      '      <select name="provider">' +
      '        <option value="MTN"' + (config.provider === 'MTN' ? ' selected' : '') + '>MTN MoMo</option>' +
      '        <option value="ORANGE"' + (config.provider === 'ORANGE' ? ' selected' : '') + '>Orange Money</option>' +
      '        <option value="AIRTEL"' + (config.provider === 'AIRTEL' ? ' selected' : '') + '>Airtel Money</option>' +
      '      </select>' +
      '    </div>' +
      '    <div>' +
      '      <label>Transaction ID</label>' +
      '      <input name="transaction_id" required placeholder="MoMo-ABC123" autocomplete="off" />' +
      '    </div>' +
      '  </div>' +
      '  <button type="submit" id="sp-submit">Verify payment</button>' +
      '  <div id="sp-msg" aria-live="polite"></div>' +
      '</form>' +
      '<div class="sp-brand">Powered by <a href="' + config.apiBase + '" target="_blank" rel="noopener">SchoolPay</a></div>';

    mount.appendChild(root);

    var form = root.querySelector('#sp-form');
    var btn = root.querySelector('#sp-submit');
    var msg = root.querySelector('#sp-msg');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = '';
      msg.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Verifying…';

      var fd = new FormData(form);
      var payload = {
        school_id: config.schoolId || undefined,
        student_id: String(fd.get('student_id') || '').trim(),
        transaction_id: String(fd.get('transaction_id') || '').trim(),
        provider: String(fd.get('provider') || config.provider).toUpperCase()
      };

      fetch(config.apiBase + '/api/public/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.apiKey
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (resp) {
          if (resp.status >= 200 && resp.status < 300 && resp.body.ok) {
            var amount = resp.body.transaction && resp.body.transaction.amount;
            var currency = resp.body.transaction && resp.body.transaction.currency;
            var studentName = resp.body.student && resp.body.student.name;
            msg.className = 'sp-msg sp-ok';
            msg.textContent =
              'Payment verified! ' +
              (studentName ? studentName + ' has been credited ' : 'Credited ') +
              (amount ? amount.toLocaleString() + ' ' + (currency || '') : 'the payment') + '.';
            form.reset();
            var evt;
            try { evt = new CustomEvent('schoolpay:success', { detail: resp.body }); }
            catch (_) { evt = document.createEvent('Event'); evt.initEvent('schoolpay:success', true, true); evt.detail = resp.body; }
            window.dispatchEvent(evt);
          } else {
            var errMsg = (resp.body && resp.body.error && resp.body.error.message) || 'Payment verification failed.';
            msg.className = 'sp-msg sp-err';
            msg.textContent = errMsg;
          }
        })
        .catch(function (err) {
          msg.className = 'sp-msg sp-err';
          msg.textContent = 'Network error — please try again. (' + err.message + ')';
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = 'Verify payment';
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  // Expose a minimal global for programmatic use.
  window.SchoolPay = window.SchoolPay || { render: render, config: config };
})();

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code2, Webhook, KeyRound, ShieldCheck, Copy, CheckCircle2, ArrowRight,
  Terminal, Package, ExternalLink, AlertTriangle
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';
import { toast } from '@/components/ui/use-toast';

const apiBase = typeof window !== 'undefined' ? window.location.origin : 'https://yoursystem.com';

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'bash' }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({ title: 'Copied' });
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <div className="relative group">
      <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition opacity-0 group-hover:opacity-100"
        aria-label="Copy"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

const restExample = `curl -X POST ${apiBase}/api/public/verify-payment \\
  -H "Authorization: Bearer SCHOOL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "school_id":     "SCH001",
    "student_id":    "STU102",
    "transaction_id":"ABC123",
    "provider":      "MTN"
  }'`;

const restResponse = `{
  "ok": true,
  "status": "success",
  "transaction": {
    "id": "d3b0c4…",
    "provider": "MTN",
    "external_id": "ABC123",
    "amount": 45000,
    "currency": "XAF",
    "verified_at": "2026-04-21T12:30:45.123Z"
  },
  "student": {
    "id": "a1f2…",
    "code": "STU102",
    "name": "Amina Nkomo",
    "balance": 90000,
    "currency": "XAF"
  }
}`;

const htmlForm = `<form id="fees">
  <input name="student_id" placeholder="Student ID" required />
  <select name="provider">
    <!-- Any provider code your tenant has configured -->
    <option>MTN</option>
    <option>ORANGE</option>
    <option>AIRTEL</option>
    <!-- Request a new network and we'll plug it in in days. -->
  </select>
  <input name="transaction_id" placeholder="Transaction ID" required />
  <button type="submit">Verify payment</button>
</form>

<script>
document.getElementById('fees').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    school_id: 'SCH001',
    student_id: fd.get('student_id'),
    transaction_id: fd.get('transaction_id'),
    provider: fd.get('provider'),
  };
  const r = await fetch('${apiBase}/api/public/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SCHOOL_API_KEY'
    },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  alert(j.ok ? 'Verified! ' + j.student.name + ' credited.' : 'Failed: ' + j.error.message);
});
</script>`;

const widgetEmbed = `<!-- SchoolPay drop-in widget -->
<script
  src="${apiBase}/widget.js"
  data-school-id="SCH001"
  data-api-key="YOUR_SCHOOL_API_KEY"
  data-provider="MTN"
  data-theme="light"
></script>
<div id="schoolpay-widget"></div>`;

const lookupExample = `curl "${apiBase}/api/public/transactions/ABC123?provider=MTN" \\
  -H "Authorization: Bearer SCHOOL_API_KEY"`;

const webhookExample = `// Example incoming webhook (MTN format, simplified):
POST /webhooks/mtn/{school_slug}
X-MTN-Signature: sha256=<hmac>
Content-Type: application/json

{
  "externalId": "ABC123",
  "status": "success",
  "amount": 45000,
  "currency": "XAF",
  "phone": "+237612345678"
}`;

const errorCodes = [
  { code: 'VALIDATION_ERROR', status: 400, desc: 'Required fields missing or malformed.' },
  { code: 'STUDENT_NOT_FOUND', status: 404, desc: 'No student with that student_id in this school.' },
  { code: 'DUPLICATE',         status: 409, desc: 'This transaction_id has already been processed.' },
  { code: 'PROVIDER_REJECTED', status: 400, desc: 'The mobile-money provider returned failure.' },
  { code: 'RATE_LIMIT',        status: 429, desc: 'Too many requests — back off and retry.' },
  { code: 'UNAUTHORIZED',      status: 401, desc: 'Missing or invalid Bearer API key.' },
];

const DevelopersInner: React.FC = () => {
  const { setMode } = useAuthDialog();
  return (
    <>
      <section className="relative bg-navy text-white py-24 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute -top-40 -right-20 w-[520px] h-[520px] rounded-full bg-royal/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-[520px] h-[520px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
              <Terminal className="w-3 h-3" /> Developer docs
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Integrate SchoolPay <span className="text-gold">in minutes</span>
            </h1>
            <p className="mt-5 text-slate-300 text-lg leading-relaxed max-w-xl">
              Three ways to accept mobile-money payments from your own website: a REST API, a drop-in widget, or a hosted payment page.
              All three verify with the provider, credit the student, and log every request.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="bg-gold hover:bg-gold-600 text-navy font-semibold" onClick={() => setMode('register')}>
                Get an API key <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
                <a href="#getting-started">Read the quickstart</a>
              </Button>
            </div>
          </div>
          <Card className="p-5 shadow-2xl border-0 bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <div className="text-xs text-gold mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-widest"><Terminal className="w-3.5 h-3.5" /> Quickstart</div>
            <CodeBlock code={restExample} />
          </Card>
        </div>
      </section>

      {/* 3 options */}
      <section id="getting-started" className="bg-white py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold">Choose your integration path</h2>
            <p className="mt-2 text-slate-600">Pick the option that matches your stack. You can switch later.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Code2,   title: 'REST API',      body: 'Call one endpoint from your server or frontend. Most flexible.', href: '#api',      badge: 'Recommended' },
              { icon: Package, title: 'Drop-in Widget', body: 'Paste two HTML lines. Zero code. Renders a payment form.',     href: '#widget',   badge: 'Zero code' },
              { icon: ExternalLink, title: 'Hosted Page', body: 'Link parents to our hosted page. We handle the UX entirely.', href: '#hosted', badge: 'Simplest' },
            ].map((o) => (
              <Card key={o.title} className="p-6 border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <o.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold">{o.title}</h3>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{o.badge}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{o.body}</p>
                <a href={o.href} className="text-sm font-medium text-blue-600 inline-flex items-center gap-1">
                  Read docs <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REST API */}
      <section id="api" className="bg-slate-50 border-y border-slate-100 py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 hover:bg-blue-600">Option 1</Badge>
            <h2 className="font-display text-2xl font-bold">REST API</h2>
          </div>
          <p className="text-slate-600 mb-6 max-w-3xl">
            Best when you already have a backend. Parents enter their MoMo transaction ID on your site; your server
            (or, for simple cases, your frontend) POSTs it to our endpoint; we verify with the provider and credit
            the student on your behalf.
          </p>

          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Request</div>
              <CodeBlock code={restExample} />
              <div className="mt-4 text-xs uppercase tracking-widest text-slate-500 mb-2">Response (200)</div>
              <CodeBlock code={restResponse} lang="json" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Plain HTML example</div>
              <CodeBlock code={htmlForm} lang="html" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Polling / lookup</div>
            <p className="text-sm text-slate-600 mb-3">
              If you submitted a payment and want to check its status later (e.g. for reconciliation):
            </p>
            <CodeBlock code={lookupExample} />
          </div>
        </div>
      </section>

      {/* Widget */}
      <section id="widget" className="bg-white py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 hover:bg-blue-600">Option 2</Badge>
            <h2 className="font-display text-2xl font-bold">Drop-in Widget</h2>
          </div>
          <p className="text-slate-600 mb-6 max-w-3xl">
            Paste two HTML lines anywhere on your school site. The widget auto-renders a styled payment form,
            POSTs to our API with your key, and shows the parent a verified/credited confirmation. No bundler needed.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Embed</div>
              <CodeBlock code={widgetEmbed} lang="html" />
              <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Use your public school API key only.</div>
                  Never embed provider secret keys. The widget talks to our scoped <code className="text-xs">/api/public</code> endpoint;
                  the key identifies your school, not your provider credentials.
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-slate-700">
                <div className="font-semibold">Events:</div>
                <div><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">schoolpay:success</code> — dispatched on <code className="text-xs">window</code> after a verified payment. Listen to drive your own UI.</div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Live preview</div>
              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50">
                <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
                  <div className="font-semibold mb-1">Pay school fees</div>
                  <div className="text-xs text-slate-500 mb-4">Verify your mobile-money transaction to credit the student.</div>
                  <label className="text-[11px] font-semibold text-slate-600">Student ID</label>
                  <div className="mt-1 p-2 border rounded-md text-sm text-slate-400">STU001</div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Provider</label>
                      <div className="mt-1 p-2 border rounded-md text-sm text-slate-700">MTN MoMo</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Transaction ID</label>
                      <div className="mt-1 p-2 border rounded-md text-sm text-slate-400">MoMo-ABC123</div>
                    </div>
                  </div>
                  <div className="mt-4 w-full py-2 bg-blue-600 text-white text-center text-sm font-semibold rounded-md">Verify payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hosted */}
      <section id="hosted" className="bg-slate-50 border-y border-slate-100 py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 hover:bg-blue-600">Option 3</Badge>
            <h2 className="font-display text-2xl font-bold">Hosted payment page</h2>
          </div>
          <p className="text-slate-600 mb-4 max-w-3xl">
            Link parents directly to a SchoolPay-hosted page. Simplest option — we handle the UX, you handle nothing.
          </p>
          <CodeBlock code={`${apiBase}/pay?school=SCH001&student_id=STU102`} lang="url" />
          <p className="text-xs text-slate-500 mt-2">
            Pre-fill <code className="bg-slate-200 px-1 rounded">student_id</code> and <code className="bg-slate-200 px-1 rounded">provider</code> in the query string to skip steps.
          </p>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="bg-white py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-1">
            <Webhook className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-2xl font-bold">Webhooks (automatic crediting)</h2>
          </div>
          <p className="text-slate-600 mb-6 max-w-3xl">
            Beyond pull-based verification, mobile-money providers can push us their transactions directly. We verify the
            HMAC signature, deduplicate against <code className="bg-slate-100 px-1 rounded text-xs">UNIQUE(school, provider, external_id)</code>,
            and credit the student automatically — no action required from the parent's side.
          </p>
          <CodeBlock code={webhookExample} lang="http" />
          <p className="text-sm text-slate-500 mt-3">
            Configure your webhook URL and secret from the <Link to="/pricing" className="text-blue-600 hover:underline">dashboard Settings</Link>.
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="bg-slate-50 border-y border-slate-100 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Security rules
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: KeyRound,    title: 'Never expose secret keys in frontend',
                body: 'Only your public school API key goes in browser code. MTN/Orange provider credentials stay on our server, AES-256-GCM encrypted at rest.' },
              { icon: ShieldCheck, title: 'Per-school API keys, rotatable',
                body: 'Each school gets its own key. Compromised keys can be rotated instantly from the dashboard — the old key is revoked the moment the new one is generated.' },
              { icon: CheckCircle2, title: 'All inputs validated server-side',
                body: 'Every verify call is validated: required fields, provider whitelist, tenant scope, and duplicate detection before any provider call is made.' },
              { icon: Code2,       title: 'Every request audit-logged',
                body: 'Payments, reversals, key rotations, webhook hits — all written to an append-only audit log, scoped by school_id, visible in your dashboard.' }
            ].map((r) => (
              <Card key={r.title} className="p-5 bg-white border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2.5">
                  <r.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="font-semibold mb-1">{r.title}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{r.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Error codes */}
      <section id="errors" className="bg-white py-14 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold mb-4">Error codes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-6">Code</th>
                  <th className="py-3 pr-6">HTTP</th>
                  <th className="py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {errorCodes.map((e) => (
                  <tr key={e.code} className="border-b border-slate-100">
                    <td className="py-3 pr-6 font-mono text-xs">{e.code}</td>
                    <td className="py-3 pr-6">{e.status}</td>
                    <td className="py-3 text-slate-600">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="support" className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-14 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold">Need a hand?</h2>
          <p className="mt-2 text-blue-100">Stuck integrating or running into errors we didn't list? We reply same-day.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              <a href="mailto:support@schoolpay.example">Email support</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
              <a href="/health">Status page</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

const Developers: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <DevelopersInner />
  </SiteLayoutWithAuthCtx>
);

export default Developers;

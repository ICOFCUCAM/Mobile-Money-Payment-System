import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Zap, CreditCard, BarChart3, Webhook, ShieldCheck, Layers, Lock, KeyRound,
  ArrowRight, CheckCircle2, Sparkles, Activity, Users, RotateCcw, FileText,
  Globe2, Building2
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const FeaturesInner: React.FC = () => {
  const { setMode } = useAuthDialog();

  return (
    <>
      {/* Banner hero */}
      <section className="relative bg-navy text-white py-24 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute -top-40 -right-20 w-[520px] h-[520px] rounded-full bg-royal/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-[520px] h-[520px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" /> Features
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Everything you need to manage <span className="text-gold">school payments at scale</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            A full fintech stack — verification, reconciliation, encryption, reporting — designed for African
            schools of every size.
          </p>
        </div>
      </section>

      {/* Section 1: Payment automation */}
      <FeatureSection
        id="automation"
        label="Payment automation"
        title="Verify and credit students automatically"
        body="Parents send the transaction ID; we query the provider in real time, verify the amount, credit the student ledger, and write the audit record — all in under two seconds."
        items={[
          { icon: Zap,  title: 'Sub-second verification' },
          { icon: RotateCcw, title: 'Auto-reconciliation worker' },
          { icon: CheckCircle2, title: 'Duplicate protection by design' },
          { icon: Activity, title: 'Real-time student balance ledger' }
        ]}
        accent="royal"
      />

      {/* Section 2: Multi-provider */}
      <FeatureSection
        id="providers"
        label="Multi-provider integration"
        title="MTN, Orange, Airtel — one API"
        body="Plug in any provider's credentials; we handle the quirks. Add a new network without re-wiring your app. Webhooks come HMAC-verified out of the box."
        items={[
          { icon: CreditCard, title: 'MTN MoMo' },
          { icon: CreditCard, title: 'Orange Money' },
          { icon: CreditCard, title: 'Airtel Money' },
          { icon: Webhook, title: 'HMAC-verified webhooks' }
        ]}
        accent="gold"
        reverse
      />

      {/* Section 3: Real-time reporting */}
      <FeatureSection
        id="reporting"
        label="Real-time reporting"
        title="Dashboards that actually update"
        body="Live revenue by provider, pending transactions, reconciliation lag, per-student balances, per-grade totals. Export to CSV for your auditors without leaving the page."
        items={[
          { icon: BarChart3, title: 'Live revenue breakdowns' },
          { icon: FileText, title: 'CSV export (10K rows)' },
          { icon: Activity, title: 'Reconciliation lag timer' },
          { icon: Users, title: 'Per-student & per-grade totals' }
        ]}
        accent="royal"
      />

      {/* Section 4: Security & encryption */}
      <FeatureSection
        id="security"
        label="Security & encryption"
        title="Bank-grade, by default"
        body="AES-256-GCM for provider credentials. bcrypt for passwords. SHA-256 hashed API keys. TLS everywhere. Rotate any secret in a single click — and revoke the previous in the same transaction."
        items={[
          { icon: Lock, title: 'AES-256-GCM at rest' },
          { icon: ShieldCheck, title: 'Replay-protected by UNIQUE index' },
          { icon: KeyRound, title: 'One-click API key rotation' },
          { icon: Layers, title: 'Multi-tenant isolation (school_id)' }
        ]}
        accent="gold"
        reverse
      />

      {/* Section 5: API & webhooks */}
      <FeatureSection
        id="api"
        label="API & webhooks"
        title="Build on SchoolPay from your own site"
        body="Drop the widget.js into any HTML page, or call the REST endpoint from your backend. Incoming webhooks from providers are HMAC-verified and auto-routed to the right tenant."
        items={[
          { icon: Webhook, title: 'POST /api/public/verify-payment' },
          { icon: Globe2, title: 'widget.js drop-in form' },
          { icon: Building2, title: 'Provider → SchoolPay webhooks' },
          { icon: FileText, title: 'OpenAPI spec + error codes' }
        ]}
        accent="royal"
        cta={{ label: 'Read API docs', to: '/developers' }}
      />

      {/* CTA */}
      <section className="relative bg-navy text-white py-20 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full bg-royal/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">See these features live</h2>
          <p className="mt-3 text-slate-300">Start a free trial, configure your providers, and collect your first MoMo payment today.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-gold hover:bg-gold-600 text-navy font-semibold" onClick={() => setMode('register')}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

/**
 * Alternating feature section — text on one side, icon card on the other.
 * Swap sides with `reverse`. Accent `royal` or `gold` drives the color.
 */
const FeatureSection: React.FC<{
  id: string;
  label: string;
  title: string;
  body: string;
  items: { icon: React.ComponentType<{ className?: string }>; title: string }[];
  accent: 'royal' | 'gold';
  reverse?: boolean;
  cta?: { label: string; to: string };
}> = ({ id, label, title, body, items, accent, reverse, cta }) => {
  const eyebrow = accent === 'royal' ? 'text-royal' : 'text-gold-600';
  const chip =
    accent === 'royal'
      ? 'bg-royal/10 text-royal'
      : 'bg-gold/15 text-gold-600';
  return (
    <section id={id} className="py-24 bg-white border-b border-slate-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:[&>*:first-child]:order-last' : ''}`}>
          <FadeIn>
            <div className={`text-[11px] uppercase tracking-[0.25em] font-semibold mb-3 ${eyebrow}`}>{label}</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight mb-4">{title}</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6 max-w-xl">{body}</p>
            {cta && (
              <Button asChild variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                <Link to={cta.to}>{cta.label} <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            )}
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {items.map((it) => (
                <div key={it.title} className="p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${chip}`}>
                    <it.icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-navy text-sm leading-snug">{it.title}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

const Features: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <FeaturesInner />
  </SiteLayoutWithAuthCtx>
);

export default Features;

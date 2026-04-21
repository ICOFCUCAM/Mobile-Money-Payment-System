import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Layers, CreditCard, ShieldCheck, Zap, Webhook, BarChart3, KeyRound, Globe2,
  Lock, ArrowRight, CheckCircle2
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const coreFeatures = [
  { id: 'multi-tenant', icon: Layers,       title: 'Multi-Tenant Architecture', body: 'Each school gets isolated data, a custom subdomain, and dedicated configuration. Zero cross-tenant leakage.' },
  { id: 'providers',    icon: CreditCard,   title: 'Multi-Provider Payments',   body: 'Accept MTN MoMo, Orange Money, Airtel Money through a single unified API.' },
  { id: 'security',     icon: ShieldCheck,  title: 'Bank-Grade Security',        body: 'AES-256-GCM encryption for provider credentials, bcrypt for passwords, full audit trails.' },
  { id: 'verify',       icon: Zap,          title: 'Instant Verification',       body: 'Sub-second provider verification with automatic duplicate detection via UNIQUE(school, provider, external_id).' },
  { id: 'webhooks',     icon: Webhook,      title: 'Webhook Automation',         body: 'HMAC-verified provider webhooks auto-route payments to the correct school and student.' },
  { id: 'analytics',    icon: BarChart3,    title: 'Real-Time Analytics',        body: 'Track revenue, balances, provider health and reconciliation lag in beautiful dashboards.' },
  { id: 'rbac',         icon: KeyRound,     title: 'Role-Based Access',          body: 'Separate permissions for admins, bursars, and auditors — with session-scoped JWTs.' },
  { id: 'africa',       icon: Globe2,       title: 'Pan-African Ready',          body: 'Deployed across Cameroon, Nigeria, Ghana, Kenya, Senegal and more.' },
];

const FeaturesInner: React.FC = () => {
  const { setMode } = useAuthDialog();
  return (
    <>
      <section className="relative bg-gradient-to-b from-blue-50/60 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-4">Core Features</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Everything your school needs</h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            From student management to payment reconciliation, built for scale and security.
          </p>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreFeatures.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.05}>
              <Card id={f.id} className="p-5 bg-white border-slate-100 h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 scroll-mt-24">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-blue-950 text-blue-300 border-blue-900 mb-3">Architecture</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Built for multi-tenant scale</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Production-grade architecture with tenant isolation, encrypted credentials, and horizontal scaling.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center"><Lock className="w-4 h-4 text-blue-400" /></div>
                <h3 className="font-semibold">Tenant Isolation</h3>
              </div>
              <pre className="bg-black/40 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
{`// Every query is scoped by school_id
db.query(
  \`SELECT * FROM students
   WHERE school_id = $1\`,
  [req.school.id]
); // ← isolated`}
              </pre>
            </div>
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center"><Layers className="w-4 h-4 text-indigo-400" /></div>
                <h3 className="font-semibold">Provider Abstraction</h3>
              </div>
              <pre className="bg-black/40 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
{`class BaseProvider {
  async verifyTransaction(externalId) {...}
}
class MTNProvider    extends BaseProvider {...}
class OrangeProvider extends BaseProvider {...}
// dynamic dispatch per school config`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold">See it in your dashboard</h2>
          <p className="mt-2 text-blue-100">Spin up a free trial and explore every feature live.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => setMode('register')}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
          <div className="mt-5 flex items-center justify-center gap-6 text-sm text-blue-100 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> 14-day trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </>
  );
};

const Features: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <FeaturesInner />
  </SiteLayoutWithAuthCtx>
);

export default Features;

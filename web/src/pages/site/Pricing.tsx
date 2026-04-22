import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  CheckCircle2, ArrowRight, Coins, CalendarClock, Server, Sparkles, Zap,
  ShieldCheck, Webhook, BarChart3, CreditCard, Users, Wallet
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const plans = [
  {
    id: 'basic', name: 'Basic', price: 10,
    tag: 'For small schools getting started',
    features: [
      '1 Payment Provider',
      'Up to 100 students',
      'Basic Dashboard',
      'Email Support',
      'CSV Export'
    ]
  },
  {
    id: 'pro', name: 'Pro', price: 25, popular: true,
    tag: 'Most teams pick this',
    features: [
      '3 Payment Providers',
      'Up to 1,000 students',
      'Advanced Analytics',
      'Priority Support',
      'CSV Import/Export',
      'Webhooks',
      'API Access'
    ]
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 99,
    tag: 'Networks and groups of schools',
    features: [
      'Unlimited Providers',
      'Unlimited Students',
      'White-Label Branding',
      'Dedicated Support',
      'Custom Integrations',
      'SLA Guarantee',
      'Audit Log Exports'
    ]
  }
];

const PricingInner: React.FC = () => {
  const { setMode } = useAuthDialog();
  const [studentCount, setStudentCount] = useState(500);
  const recommendedPlanId =
    studentCount <= 100 ? 'basic' :
    studentCount <= 1000 ? 'pro' :
    'enterprise';

  return (
    <>
      {/* Banner hero */}
      <section className="relative bg-navy text-white py-24 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-royal/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" /> Premium pricing
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Built for every <span className="text-gold">school size</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            Three payment models, three subscription tiers, one 14-day free trial. No per-transaction fees, ever.
          </p>
        </div>
      </section>

      {/* Payment Models row */}
      <section id="models" className="bg-white py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              Step 1 — Pick a payment model
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">
              How would you like to <span className="text-royal">pay for SchoolPay</span>?
            </h2>
          </FadeIn>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prepaid */}
            <FadeIn>
              <div id="prepaid" className="group relative bg-white rounded-2xl border border-slate-200 p-8 h-full hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all scroll-mt-24">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal to-royal-400 rounded-t-2xl" />
                <div className="w-14 h-14 rounded-xl bg-royal/10 text-royal flex items-center justify-center mb-5 group-hover:bg-royal group-hover:text-white transition-colors">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-royal font-bold mb-2">Prepaid</div>
                <h3 className="font-display text-2xl font-bold text-navy mb-3">Pay per student</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Top up a credit bundle and consume it as parents make payments. No monthly commitment.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {['Pay only for students you onboard', 'No minimum commitment', 'Top up from $20', 'Credits never expire'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-royal mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="text-3xl font-display font-bold text-navy">$0.50<span className="text-base font-normal text-slate-500">/student</span></div>
                  <div className="text-xs text-slate-500 mt-1">Ideal for &lt; 200 students</div>
                </div>
              </div>
            </FadeIn>

            {/* Postpaid (recommended) */}
            <FadeIn delay={0.1}>
              <div id="postpaid" className="relative bg-navy text-white rounded-2xl border-2 border-gold p-8 h-full shadow-2xl shadow-navy/30 hover:-translate-y-1 transition-all lg:scale-[1.04] scroll-mt-24">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold text-navy text-[11px] font-bold uppercase tracking-widest shadow-lg">
                  <Sparkles className="w-3 h-3" /> Most popular
                </div>
                <div className="w-14 h-14 rounded-xl bg-gold text-navy flex items-center justify-center mb-5 shadow-md">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold font-bold mb-2">Postpaid</div>
                <h3 className="font-display text-2xl font-bold mb-3">Monthly subscription</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Flat monthly or yearly fee, unlimited transactions, unlimited students. The predictable choice.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-200">
                  {['Unlimited transactions & students', 'Multi-provider support', 'Priority support & SLA', 'Monthly or yearly (save 2 months)'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-white/15">
                  <div className="text-3xl font-display font-bold">From $25<span className="text-base font-normal text-slate-400">/month</span></div>
                  <div className="text-xs text-slate-400 mt-1">Ideal for 200 – 5,000 students</div>
                </div>
              </div>
            </FadeIn>

            {/* License */}
            <FadeIn delay={0.2}>
              <div id="license" className="group relative bg-white rounded-2xl border border-slate-200 p-8 h-full hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all scroll-mt-24">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold to-gold-600 rounded-t-2xl" />
                <div className="w-14 h-14 rounded-xl bg-gold/15 text-gold-600 flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-navy transition-colors">
                  <Server className="w-6 h-6" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold-600 font-bold mb-2">License</div>
                <h3 className="font-display text-2xl font-bold text-navy mb-3">One-time purchase</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Buy the SchoolPay system outright and run it on your own servers. Manage one school or an entire network.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {['Self-hosted, your infrastructure', 'Manage multiple schools per license', 'White-label branding included', 'Source-available; one year of updates'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="text-3xl font-display font-bold text-navy">From $2,500<span className="text-base font-normal text-slate-500"> one-time</span></div>
                  <div className="text-xs text-slate-500 mt-1">Networks & ministries</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Subscription tiers with slider */}
      <section className="bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-10 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              Step 2 — Pick a tier (Postpaid subscribers)
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">
              Size your plan with the <span className="text-royal">student slider</span>
            </h2>
          </FadeIn>

          <FadeIn>
            <div className="max-w-3xl mx-auto mb-14 p-7 rounded-2xl bg-navy text-white shadow-xl shadow-navy/30 border border-white/10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400">How many students?</div>
                  <div className="font-display text-3xl font-bold mt-1">
                    {studentCount >= 5000 ? '5,000+' : studentCount.toLocaleString()}
                    <span className="text-slate-400 text-base font-normal ml-2">students</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-navy text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Recommended: {recommendedPlanId}
                </div>
              </div>
              <Slider value={[studentCount]} onValueChange={(v) => setStudentCount(v[0])} min={10} max={5000} step={10} className="mt-6" />
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>10</span><span>100</span><span>1,000</span><span>5,000+</span>
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((p, i) => {
              const isRecommended = p.id === recommendedPlanId;
              return (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <div
                    className={`relative rounded-2xl p-7 h-full transition-all duration-300 ${
                      isRecommended
                        ? 'bg-navy text-white border-2 border-gold shadow-2xl shadow-navy/30 md:scale-[1.04]'
                        : 'bg-white text-navy border border-slate-200 hover:shadow-xl hover:shadow-navy/10 hover:-translate-y-1'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold text-navy text-[11px] font-bold uppercase tracking-widest shadow-lg">
                        <Sparkles className="w-3 h-3" /> Recommended
                      </div>
                    )}
                    <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-2 ${isRecommended ? 'text-gold' : 'text-royal'}`}>{p.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-display text-5xl font-bold">${p.price}</span>
                      <span className={isRecommended ? 'text-slate-400' : 'text-slate-500'}>/month</span>
                    </div>
                    <div className={`text-sm mb-5 ${isRecommended ? 'text-slate-300' : 'text-slate-600'}`}>{p.tag}</div>
                    <ul className="space-y-2.5 mb-7">
                      {p.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-sm ${isRecommended ? 'text-slate-200' : 'text-slate-700'}`}>
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isRecommended ? 'text-gold' : 'text-royal'}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        isRecommended
                          ? 'bg-gold hover:bg-gold-600 text-navy font-semibold'
                          : 'bg-navy hover:bg-navy-800 text-white'
                      }`}
                      onClick={() => setMode('register')}
                    >
                      Start Free Trial
                    </Button>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="bg-white py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">Included in every plan</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">Never a hidden fee</h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Sub-second verification' },
              { icon: CreditCard, title: 'MTN / Orange / Airtel' },
              { icon: BarChart3, title: 'Real-time dashboards' },
              { icon: Webhook, title: 'Webhooks + REST API' },
              { icon: ShieldCheck, title: 'AES-256 at rest + TLS' },
              { icon: Users, title: 'Role-based access' },
              { icon: Wallet, title: 'Student balance ledger' },
              { icon: CheckCircle2, title: 'Duplicate protection' },
              { icon: BarChart3, title: 'CSV exports' }
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-royal/10 text-royal flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-navy text-sm">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">FAQ</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">Frequently asked</h2>
          </FadeIn>
          <div className="space-y-4">
            {[
              { q: 'Can I switch between Prepaid, Postpaid, and License?', a: 'Yes. Moving from Prepaid → Postpaid takes effect immediately. License purchases are a separate deployment — talk to sales.' },
              { q: 'Do you charge per transaction?', a: 'No. Postpaid plans are all-inclusive; Prepaid is per-student. We do not take a percentage of your payments.' },
              { q: 'What happens when I exceed my student limit on Postpaid?', a: 'We notify you first, then you can upgrade. We never silently block transactions.' },
              { q: 'Is the License the source code?', a: 'It is source-available under a commercial license. You deploy to your infrastructure and we hand over the repository plus one year of updates.' },
              { q: 'Is there a free trial?', a: 'Yes — 14 days on Postpaid plans, no credit card required.' }
            ].map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-5 group">
                <summary className="font-semibold text-navy cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-royal group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Pick a model. Start in minutes.</h2>
          <p className="mt-3 text-slate-300">14-day free trial. No credit card. Cancel anytime.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-gold hover:bg-gold-600 text-navy font-semibold" onClick={() => setMode('register')}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Link to="/developers">Developer docs</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

const Pricing: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <PricingInner />
  </SiteLayoutWithAuthCtx>
);

export default Pricing;

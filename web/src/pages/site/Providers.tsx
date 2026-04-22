import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Webhook, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const providers = [
  {
    name: 'MTN Mobile Money',
    users: '280M users',
    initials: 'MTN',
    badgeBg: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
    badgeText: 'text-yellow-950',
    blurb: 'Accept payments from MTN MoMo subscribers across 17 countries. HMAC-verified webhooks, instant verification, and automatic student crediting.',
    countries: ['Cameroon', 'Ghana', 'Uganda', 'Rwanda', "Côte d'Ivoire", 'Benin', 'Nigeria', 'Zambia']
  },
  {
    name: 'Orange Money',
    users: '70M users',
    initials: 'OM',
    badgeBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    badgeText: 'text-white',
    blurb: 'Seamless integration across West & Central Africa. One set of credentials, one verified call per transaction.',
    countries: ['Cameroon', 'Senegal', "Côte d'Ivoire", 'Mali', 'Burkina Faso', 'Guinea']
  },
  {
    name: 'Airtel Money',
    users: '27M users',
    initials: 'AM',
    badgeBg: 'bg-gradient-to-br from-red-400 to-red-600',
    badgeText: 'text-white',
    blurb: 'Airtel Money coverage for East & Southern Africa. Webhook-first, so every payment is credited the instant Airtel confirms it.',
    countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Zambia', 'Malawi']
  }
];

const ProvidersInner: React.FC = () => {
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
            <Sparkles className="w-3 h-3" /> Integration partners
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Connect to Africa's <span className="text-gold">leading mobile money networks</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            One unified API covering every major network on the continent — MTN, Orange, Airtel today;
            Wave, M-Pesa, TigoCash and others added on request. We handle the HMAC signatures, the replay
            protection, and each provider's quirks — so you don't have to.
          </p>
        </div>
      </section>

      {/* Provider cards */}
      <section className="bg-white py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.08}>
              <div className="relative bg-white rounded-2xl border border-slate-200 p-7 h-full hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-14 h-14 rounded-xl ${p.badgeBg} ${p.badgeText} flex items-center justify-center font-display font-bold text-sm shadow-lg tracking-tight`}>
                    {p.initials}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-navy">{p.name}</h3>
                <div className="text-sm text-royal mt-0.5 font-semibold">{p.users}</div>
                <p className="text-sm text-slate-600 mt-4 leading-relaxed">{p.blurb}</p>
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Live in</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.countries.map((c) => (
                      <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Ready to integrate
                </div>
              </div>
            </FadeIn>
          ))}

          {/*
            Extensibility card — we support MTN/Orange/Airtel today and add
            new networks on request. The dashed border + gold accent signals
            "new network" without pretending it's live yet.
          */}
          <FadeIn delay={0.24}>
            <div className="relative rounded-2xl p-7 h-full border-2 border-dashed border-gold/50 bg-gradient-to-br from-gold/10 to-white hover:border-gold hover:bg-gold/5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-xl bg-gold/15 text-gold-600 flex items-center justify-center ring-1 ring-gold/40 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold-600 text-[10px] font-bold uppercase tracking-widest">
                  On request
                </div>
              </div>
              <h3 className="font-display text-xl font-bold text-navy">+ Add your network</h3>
              <div className="text-sm text-gold-600 mt-0.5 font-semibold">Ships in under a week</div>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                Wave, M-Pesa, TigoCash, Moov Money, Afrimoney, MoMo Pay — anything with an API. Our
                <code className="bg-slate-100 px-1 rounded text-[11px] mx-1">BaseProvider</code>
                abstraction means plugging in a new network takes days, not months.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {['Wave', 'M-Pesa', 'TigoCash', 'Moov', 'Afrimoney'].map((n) => (
                  <span key={n} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">{n}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Guarantees strip */}
      <section className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-12 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">Built-in guarantees</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">The same rules, every provider</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Webhook,     title: 'HMAC-verified webhooks', body: "Every incoming webhook is signature-verified with your provider's shared secret before we touch the ledger." },
              { icon: ShieldCheck, title: 'Replay protection built-in', body: 'A UNIQUE index on (school, provider, tx_id) means the same receipt cannot credit the same student twice.' },
              { icon: Zap,         title: 'Instant reconciliation', body: 'A background worker re-checks pending transactions with each provider, so stuck payments never stay stuck.' }
            ].map((g) => (
              <div key={g.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 rounded-lg bg-royal/10 text-royal flex items-center justify-center mb-4">
                  <g.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy mb-2">{g.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Network missing? <span className="text-gold">We'll add it.</span></h2>
          <p className="mt-3 text-slate-300">Our provider abstraction lets us ship new networks in under a week. Tell us where you need us.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-gold hover:bg-gold-600 text-navy font-semibold" onClick={() => setMode('register')}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Link to="/developers#webhooks">Webhook docs</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

const Providers: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <ProvidersInner />
  </SiteLayoutWithAuthCtx>
);

export default Providers;

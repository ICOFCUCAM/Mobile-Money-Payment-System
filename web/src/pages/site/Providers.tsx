import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, ArrowRight, Webhook, ShieldCheck } from 'lucide-react';
import { SiteLayoutWithAuthCtx } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const providers = [
  { name: 'MTN Mobile Money', users: '280M users', blurb: 'Accept payments from MTN MoMo subscribers across 17 countries.', grad: 'from-yellow-400 to-orange-500',
    countries: ['Cameroon', 'Ghana', 'Uganda', 'Rwanda', "Côte d'Ivoire", 'Benin', 'Nigeria', 'Zambia'] },
  { name: 'Orange Money', users: '70M users', blurb: 'Seamless integration with Orange Money across West & Central Africa.', grad: 'from-orange-400 to-orange-600',
    countries: ['Cameroon', 'Senegal', "Côte d'Ivoire", 'Mali', 'Burkina Faso', 'Guinea'] },
  { name: 'Airtel Money', users: '27M users', blurb: 'Airtel Money support for East & Southern Africa markets.', grad: 'from-red-400 to-red-600',
    countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Zambia', 'Malawi'] },
];

const Providers: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <section className="relative bg-gradient-to-b from-blue-50/60 to-white py-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-4">Integrated Providers</Badge>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Accept payments from every major network</h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          One API, three networks, dozens of countries. We handle the HMAC, the replay protection, and the provider quirks so you don't have to.
        </p>
      </div>
    </section>

    <section className="bg-white pb-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-5">
        {providers.map((p, i) => (
          <FadeIn key={p.name} delay={i * 0.08}>
            <Card className="p-6 border-slate-100 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.grad} flex items-center justify-center mb-4`}>
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="text-sm text-slate-500 mt-0.5">{p.users}</div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{p.blurb}</p>
              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Live in</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.countries.map((c) => (
                    <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{c}</span>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Ready to integrate
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>
    </section>

    <section className="bg-slate-50 border-y border-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <Webhook className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">HMAC-verified webhooks</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every provider webhook is signature-verified with the shared secret you supplied. Unrecognized signatures are rejected
            before they ever hit your student ledger.
          </p>
        </Card>
        <Card className="p-6 border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Replay protection built-in</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            A UNIQUE index on <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">(school_id, provider, external_id)</code> means the same
            receipt cannot credit the same student twice, even under concurrent writes.
          </p>
        </Card>
      </div>
    </section>

    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-14">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-display text-3xl font-bold">Network missing? We'll add it.</h2>
        <p className="mt-2 text-blue-100">Our provider abstraction supports new networks in under a week. Tell us where you need us.</p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
            <Link to="/developers#webhooks">Read webhook docs <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  </SiteLayoutWithAuthCtx>
);

export default Providers;

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CheckCircle2 } from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

const plans = [
  { id: 'basic', name: 'Basic', price: 10,
    features: ['1 Payment Provider', 'Up to 100 students', 'Basic Dashboard', 'Email Support'] },
  { id: 'pro', name: 'Pro', price: 25, popular: true,
    features: ['3 Payment Providers', 'Up to 1,000 students', 'Advanced Analytics', 'Priority Support', 'CSV Import/Export', 'Webhooks'] },
  { id: 'enterprise', name: 'Enterprise', price: 99,
    features: ['Unlimited Providers', 'Unlimited Students', 'White-Label Branding', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee', 'Audit Logs'] }
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
      <section className="bg-slate-950 text-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <Badge variant="outline" className="bg-blue-950 text-blue-300 border-blue-900 mb-3">Simple Pricing</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold">Choose your plan</h1>
            <p className="mt-3 text-slate-400">All plans include a 14-day free trial. Cancel anytime.</p>
          </FadeIn>

          <FadeIn>
            <div className="max-w-3xl mx-auto mb-14 p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">How many students?</div>
                  <div className="font-display text-3xl font-bold mt-1">
                    {studentCount >= 5000 ? '5,000+' : studentCount.toLocaleString()}
                    <span className="text-slate-400 text-base font-normal ml-2">students</span>
                  </div>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-600 text-sm capitalize">Recommended: {recommendedPlanId}</Badge>
              </div>
              <Slider value={[studentCount]} onValueChange={(v) => setStudentCount(v[0])} min={10} max={5000} step={10} className="mt-6" />
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>10</span><span>100</span><span>1 000</span><span>5 000+</span>
              </div>
              <p className="mt-5 text-sm text-slate-400">
                {recommendedPlanId === 'basic' && <>Your school fits comfortably on <span className="text-white font-medium">Basic — $10/mo</span>. Upgrade any time as you grow.</>}
                {recommendedPlanId === 'pro' && <>At this scale, <span className="text-white font-medium">Pro — $25/mo</span> gives you multi-provider support, analytics and priority support.</>}
                {recommendedPlanId === 'enterprise' && <>Over 1 000 students — you'll want <span className="text-white font-medium">Enterprise — $99/mo</span> for unlimited students, custom integrations and an SLA.</>}
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((p, i) => {
              const isRecommended = p.id === recommendedPlanId;
              return (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <Card
                    className={`p-6 bg-slate-900 text-white border-slate-800 h-full relative transition-all duration-300 ${
                      isRecommended ? 'ring-2 ring-blue-500 shadow-2xl md:scale-[1.03]' : p.popular ? 'ring-1 ring-slate-700' : ''
                    }`}
                  >
                    {isRecommended && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-600">Recommended for you</Badge>
                    )}
                    <h3 className="font-display text-xl font-bold">{p.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-5xl font-bold tracking-tight">${p.price}</span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    <ul className="mt-6 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-7 ${isRecommended ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-100 text-slate-900 hover:bg-white'}`}
                      onClick={() => setMode('register')}
                    >
                      Get Started
                    </Button>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Frequently asked</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I switch plans later?', a: 'Yes. Upgrades take effect immediately, downgrades take effect at the end of the current billing cycle.' },
              { q: 'Do you charge per transaction?', a: 'No. The monthly plan is all-inclusive. We do not take a percentage of your payments.' },
              { q: 'What happens when I exceed my student limit?', a: 'We notify you first, then you can upgrade. We never silently block transactions.' },
              { q: 'Is there a free trial?', a: 'Yes — 14 days, no credit card required.' },
            ].map((f) => (
              <details key={f.q} className="rounded-lg border border-slate-200 bg-slate-50 p-4 group">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
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

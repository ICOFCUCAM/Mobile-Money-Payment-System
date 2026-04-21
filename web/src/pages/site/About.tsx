import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Compass, Handshake, Zap } from 'lucide-react';
import { SiteLayoutWithAuthCtx } from '@/components/site/SiteLayout';
import { FadeIn, AnimatedNumber } from '@/components/site/motion';

const About: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <section className="relative bg-gradient-to-b from-blue-50/60 to-white py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-4">About SchoolPay</Badge>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Built by educators, for educators.</h1>
        <p className="mt-4 text-slate-600 text-lg leading-relaxed">
          We started SchoolPay because the schools we grew up with were still chasing MoMo receipts over WhatsApp and
          reconciling them in Excel. Every parent already pays on mobile money — the finance office just needed a way
          to keep up. One afternoon of setup should be enough.
        </p>
      </div>
    </section>

    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-4 text-center">
        {[
          { to: 500,  suffix: '+',  decimals: 0, label: 'Schools' },
          { to: 2.4,  suffix: 'M+', decimals: 1, label: 'Transactions' },
          { to: 18,   prefix: '$', suffix: 'M+', decimals: 0, label: 'Volume' },
          { to: 12,   suffix: '',   decimals: 0, label: 'Countries' }
        ].map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.08}>
            <AnimatedNumber to={s.to} suffix={s.suffix} prefix={s.prefix} decimals={s.decimals}
              className="block font-display text-4xl font-bold text-blue-600 tracking-tight" />
            <div className="text-sm text-slate-500 mt-2">{s.label}</div>
          </FadeIn>
        ))}
      </div>
    </section>

    <section className="bg-slate-50 border-y border-slate-100 py-20">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-6">
        {[
          { icon: Target,    title: 'Our mission',   body: 'Make accepting mobile-money payments trivial for any school in Africa — regardless of size, budget, or technical expertise.' },
          { icon: Compass,   title: 'Our principles',body: 'Multi-tenant isolation is non-negotiable. Encryption is default. Audit logs are the source of truth.' },
          { icon: Handshake, title: 'Our customers', body: 'From 40-student village schools to 12,000-student university systems. One platform, all scales.' },
          { icon: Zap,       title: 'How we move',   body: 'Small team, fast ships. New provider integrations land in under a week; bug fixes often in hours.' },
        ].map((v) => (
          <Card key={v.title} className="p-6 bg-white border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <v.icon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1.5">{v.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{v.body}</p>
          </Card>
        ))}
      </div>
    </section>

    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-14">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-display text-3xl font-bold">Want to talk?</h2>
        <p className="mt-2 text-blue-100">Whether you're a school, a network, or an NGO, we want to hear from you.</p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
            <Link to="/developers#support">Contact support <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  </SiteLayoutWithAuthCtx>
);

export default About;

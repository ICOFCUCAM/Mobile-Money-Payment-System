import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, CreditCard, ShieldCheck, Zap, CheckCircle2, ArrowRight,
  TrendingUp, Layers, Lock, Globe2, Building2, Settings2, Wallet, Quote,
  History, Activity, UserPlus, Undo2, Webhook, KeyRound
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn, AnimatedNumber } from '@/components/site/motion';

const HomeInner: React.FC = () => {
  const { setMode } = useAuthDialog();

  const [heroTab, setHeroTab] = useState<'overview' | 'verify' | 'audit'>('overview');
  const [tabPinned, setTabPinned] = useState(false);
  useEffect(() => {
    if (tabPinned) return;
    const id = setInterval(() => {
      setHeroTab((t) => (t === 'overview' ? 'verify' : t === 'verify' ? 'audit' : 'overview'));
    }, 5000);
    return () => clearInterval(id);
  }, [tabPinned]);
  const pickTab = (t: typeof heroTab) => { setHeroTab(t); setTabPinned(true); };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.35) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)'
          }}
        />
        <div className="absolute -top-20 -left-24 w-[420px] h-[420px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-[520px] h-[520px] rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium mb-6">
              Multi-Tenant Fintech Infrastructure
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              School Payments,<br />
              <span className="text-blue-600">Unified &<br />Automated.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
              The complete SaaS platform for schools to accept mobile money payments from MTN,
              Orange, and Airtel — with automatic verification, student credit, and real-time dashboards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => setMode('register')}>
                Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/developers">See Developer Docs</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup in minutes</span>
            </div>
          </div>

          <Card className="p-0 shadow-2xl border-slate-100 overflow-hidden relative">
            <div className="absolute -top-3 -right-3 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {([
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'verify',   label: 'Verify Payment', icon: Zap },
                { id: 'audit',    label: 'Audit Log', icon: History },
              ] as const).map((t) => {
                const active = heroTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => pickTab(t.id)}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                      active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                    {active && (
                      <motion.span
                        layoutId="heroTabBar"
                        className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-6 min-h-[380px]">
              <AnimatePresence mode="wait">
                {heroTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="text-xs text-slate-500">Total Revenue</div>
                        <div className="font-display text-3xl font-bold mt-1 tracking-tight">1,335,000 XAF</div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        <TrendingUp className="w-3 h-3 mr-1" /> +24.5%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div className="text-[11px] text-yellow-700 font-medium">MTN MoMo</div>
                        <div className="font-bold mt-0.5">540K</div>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="text-[11px] text-orange-700 font-medium">Orange</div>
                        <div className="font-bold mt-0.5">660K</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-600 font-medium">Pending</div>
                        <div className="font-bold mt-0.5">80K</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { initial: 'A', grad: 'from-blue-400 to-indigo-500',    name: 'Amina Nkomo',   id: 'STU001', amount: '45,000 XAF',  status: 'verified', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { initial: 'K', grad: 'from-emerald-400 to-teal-500',   name: 'Kwame Mensah',  id: 'STU002', amount: '150,000 XAF', status: 'verified', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { initial: 'Z', grad: 'from-purple-400 to-pink-500',    name: 'Zainab Hassan', id: 'STU003', amount: '30,000 XAF',  status: 'pending',  statusClass: 'bg-amber-50 text-amber-700 border-amber-200' },
                      ].map((r) => (
                        <div key={r.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${r.grad} flex items-center justify-center text-white font-bold text-sm`}>
                              {r.initial}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{r.name}</div>
                              <div className="text-xs text-slate-500">{r.id}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{r.amount}</div>
                            <Badge variant="outline" className={`${r.statusClass} text-[10px] mt-1 hover:bg-inherit`}>{r.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {heroTab === 'verify' && (
                  <motion.div key="verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="text-xs text-slate-500 mb-1">Verify payment</div>
                    <div className="font-display text-xl font-bold mb-5">Submit a mobile-money receipt</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-slate-500 mb-1">Student</div>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">A</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Amina Nkomo</div>
                            <div className="text-[11px] text-slate-500">STU001 · Grade 10</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] text-slate-500 mb-1">Provider</div>
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-500" /> MTN
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 mb-1">Reference</div>
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-sm font-mono">MoMo-9F3A21</div>
                        </div>
                      </div>
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-emerald-900">Verified &amp; credited</div>
                          <div className="text-xs text-emerald-800">Amina's balance: 45,000 XAF → <b>90,000 XAF</b></div>
                        </div>
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">+45,000</Badge>
                      </motion.div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Replay-protected: UNIQUE (school, provider, external_id)
                      </div>
                    </div>
                  </motion.div>
                )}

                {heroTab === 'audit' && (
                  <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="text-xs text-slate-500">Audit Log</div>
                        <div className="font-display text-xl font-bold mt-0.5">Recent activity</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Live</Badge>
                    </div>
                    <ul className="space-y-3">
                      {[
                        { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', title: 'Payment verified', body: 'MoMo-9F3A21 · 45,000 XAF · Amina Nkomo', time: 'just now' },
                        { icon: UserPlus,     color: 'text-blue-600 bg-blue-50',       title: 'Student added',    body: 'STU018 · Kofi Asante · Grade 11',      time: '2m ago' },
                        { icon: Undo2,        color: 'text-red-600 bg-red-50',         title: 'Payment reversed', body: 'MoMo-88EF02 · −30,000 XAF · admin@…',  time: '14m ago' },
                        { icon: KeyRound,     color: 'text-amber-600 bg-amber-50',     title: 'API key rotated',  body: 'by james.chama@quin-chama.edu',         time: '1h ago' },
                        { icon: Webhook,      color: 'text-indigo-600 bg-indigo-50',   title: 'Webhook received', body: 'MTN → 150,000 XAF · HMAC verified',    time: '1h ago' },
                      ].map((row, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center shrink-0`}>
                            <row.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium flex items-center justify-between gap-2">
                              <span>{row.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{row.time}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">{row.body}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </section>

      {/* Logo wall */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center text-xs uppercase tracking-widest text-slate-400 mb-6">
              Trusted by schools across Africa
            </div>
            <div className="flex items-center justify-around flex-wrap gap-x-10 gap-y-5 opacity-70 grayscale">
              {[
                { name: 'Greenwood High',        icon: GraduationCap },
                { name: 'Lycée Saint-Joseph',   icon: Building2 },
                { name: 'Nairobi Prep',          icon: Globe2 },
                { name: 'Quin Chama Academy',    icon: ShieldCheck },
                { name: 'Accra International',   icon: Layers },
                { name: 'Dakar Montessori',      icon: CreditCard },
              ].map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-slate-600">
                  <l.icon className="w-5 h-5" />
                  <span className="font-display font-semibold tracking-tight">{l.name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { to: 500,  prefix: '', suffix: '+',  decimals: 0, label: 'Schools Onboarded' },
            { to: 2.4,  prefix: '', suffix: 'M+', decimals: 1, label: 'Transactions Processed' },
            { to: 18,   prefix: '$', suffix: 'M+', decimals: 0, label: 'Volume Managed' },
            { to: 99.9, prefix: '', suffix: '%',  decimals: 1, label: 'Uptime SLA' }
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08}>
              <AnimatedNumber to={s.to} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals}
                className="block font-display text-4xl md:text-5xl font-bold text-blue-600 tracking-tight" />
              <div className="text-sm text-slate-500 mt-2">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">How it works</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">From zero to collecting fees in an afternoon</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Three steps. No phone calls, no bank meetings, no hardware to ship.</p>
          </FadeIn>
          <div className="relative grid md:grid-cols-3 gap-5">
            <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent pointer-events-none" />
            {[
              { n: '01', icon: Building2, title: 'Register your school', body: 'Pick a subdomain, create an admin, choose a plan. 60 seconds — no credit card.', accent: 'from-blue-500 to-indigo-600' },
              { n: '02', icon: Settings2, title: 'Configure providers', body: 'Paste your MTN / Orange API keys (encrypted at rest with AES-256-GCM). We generate your signed webhook URLs.', accent: 'from-indigo-500 to-purple-600' },
              { n: '03', icon: Wallet, title: 'Collect payments', body: 'Parents pay from any phone. We verify with the provider, credit the student, and log everything for your audit trail.', accent: 'from-purple-500 to-pink-600' }
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.12}>
                <div className="relative bg-white rounded-xl border border-slate-100 p-6 h-full hover:shadow-lg transition-shadow">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-md mb-4 relative z-10`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-slate-400 mb-1">Step {s.n}</div>
                  <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center mt-10">
            <Button asChild variant="outline">
              <Link to="/features">Explore features <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">What schools say</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Bursars love it. So do parents.</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'James Chama', role: 'Finance Director', school: 'Quin Chama Academy', initial: 'J', grad: 'from-blue-500 to-indigo-600',
                quote: 'We used to chase parents for MoMo receipts and type them into Excel. With SchoolPay a payment is verified and the student credited in under two seconds.' },
              { name: 'Sarah Okonkwo', role: 'Head Bursar', school: 'Greenwood High', initial: 'S', grad: 'from-emerald-500 to-teal-600',
                quote: 'The audit log alone justified the subscription. Every reversal, every provider webhook, every student edit is on one timeline we can hand to the auditors.' },
              { name: 'Pierre Mbappe', role: 'School Administrator', school: 'Lycée Saint-Joseph', initial: 'P', grad: 'from-purple-500 to-pink-600',
                quote: 'Setup took an afternoon. We configured MTN and Orange, pointed the webhooks, and parents started paying the same day.' }
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <Card className="p-6 h-full border-slate-100 bg-white relative hover:shadow-md transition-shadow">
                  <Quote className="absolute top-4 right-4 w-6 h-6 text-blue-100" />
                  <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white font-bold`}>
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role} · {t.school}</div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to modernize your school payments?</h2>
          <p className="mt-3 text-blue-100">Join 500+ schools across Africa already using SchoolPay.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => setMode('register')}>
              Start Your Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
              <Link to="/developers">Developer docs</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

const Home: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <HomeInner />
  </SiteLayoutWithAuthCtx>
);

export default Home;

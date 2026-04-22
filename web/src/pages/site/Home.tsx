import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, CreditCard, ShieldCheck, Zap, CheckCircle2, ArrowRight,
  TrendingUp, Layers, Lock, Globe2, Building2, Settings2, Wallet, Quote,
  History, Activity, UserPlus, Undo2, Webhook, KeyRound,
  Coins, CalendarClock, Server, Sparkles
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
      <section className="relative bg-navy">
        {/*
         * Clean photograph of African children going to school. The image is not
         * blurred or washed. A narrow left-side navy gradient gives the headline
         * enough contrast without dimming the rest of the photograph.
         */}
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=85"
          alt="African schoolchildren on their way to class"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget.style.display = 'none'); }}
        />
        {/* Left-biased navy vignette — keeps the text edge readable while the
            right-side photo stays clean under the dashboard widget. */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/30 to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          {/* Headline — transparent, sits directly on the photo */}
          <div className="text-white [text-shadow:0_2px_16px_rgba(11,28,61,0.65)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Mobile-money native
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04]">
              School Payments.<br />
              Built for <span className="text-royal-400">Africa</span>.<br />
              <span className="text-gold">Powered by Mobile Money.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-200 leading-relaxed max-w-xl">
              SchoolPay is the payment infrastructure for African schools — one API that integrates
              MTN MoMo, Orange Money and Airtel Money, verifies every receipt, credits the student,
              and hands your bursar a real-time audit trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 [text-shadow:none]">
              <Button
                size="lg"
                className="bg-royal hover:bg-royal-700 text-white font-semibold shadow-lg shadow-royal/40"
                onClick={() => setMode('register')}
              >
                Start Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/5 border-white/30 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/developers">View Documentation</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-200 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> Setup in minutes</span>
            </div>
          </div>

          {/* Rotating dashboard widget — white card, as before. Sits on top of the
              clean photograph on the right. */}
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
                        { icon: Undo2,        color: 'text-red-600 bg-red-50',         title: 'Payment reversed', body: 'MoMo-88EF02 · −30,000 XAF',            time: '14m ago' },
                        { icon: KeyRound,     color: 'text-amber-600 bg-amber-50',     title: 'API key rotated',  body: 'by an admin account',                   time: '1h ago' },
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

      {/* Trusted by schools — logo strip */}
      <section className="bg-white border-b border-slate-100 py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <div className="text-center text-[11px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-8">
              Trusted by <span className="text-navy">500+ schools</span> across Africa
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-6 items-center">
              {[
                { name: 'Greenwood High',       icon: GraduationCap },
                { name: 'Lycée Saint-Joseph',  icon: Building2 },
                { name: 'Nairobi Prep',         icon: Globe2 },
                { name: 'Riverbend Academy',    icon: ShieldCheck },
                { name: 'Accra International',  icon: Layers },
                { name: 'Dakar Montessori',     icon: CreditCard },
              ].map((l) => (
                <div
                  key={l.name}
                  className="flex items-center justify-center gap-2 text-slate-500 hover:text-navy transition-colors grayscale hover:grayscale-0"
                >
                  <l.icon className="w-5 h-5" />
                  <span className="font-display font-semibold text-sm tracking-tight">{l.name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              The shift
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              From Excel sheets to <span className="text-royal">real-time reconciliation</span>
            </h2>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Problem card — dark */}
            <FadeIn>
              <div className="relative bg-navy rounded-2xl p-8 md:p-10 text-white h-full overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-red-200 text-[11px] font-semibold uppercase tracking-widest mb-5">
                    Today's pain
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold mb-6">
                    The bursar's Friday problem
                  </h3>
                  <ul className="space-y-4 text-slate-300">
                    {[
                      'Parents send MoMo receipts over WhatsApp — one-by-one.',
                      'Bursars type transaction IDs into Excel, sometimes twice.',
                      'Duplicate payments go unnoticed; refunds take weeks.',
                      'No audit trail when regulators or auditors come calling.',
                      'Sales calls and bank meetings before you can even start.'
                    ].map((p) => (
                      <li key={p} className="flex gap-3">
                        <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-300 text-xs font-bold">×</span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>

            {/* Solution card — light with gold accent */}
            <FadeIn delay={0.1}>
              <div className="relative bg-white rounded-2xl p-8 md:p-10 h-full overflow-hidden border border-slate-200 shadow-lg shadow-slate-900/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold-600 text-[11px] font-semibold uppercase tracking-widest mb-5">
                    SchoolPay way
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-navy mb-6">
                    Verified, credited, audited — in two seconds
                  </h3>
                  <ul className="space-y-4 text-slate-700">
                    {[
                      'Parents pay from any phone; we verify with the provider instantly.',
                      'Student balance credited automatically — no re-keying.',
                      'Duplicate protection by design: UNIQUE(school, provider, tx_id).',
                      'Append-only audit log you can hand straight to auditors.',
                      'Sign up in 60 seconds — no sales call, no bank meeting.'
                    ].map((p) => (
                      <li key={p} className="flex gap-3">
                        <CheckCircle2 className="shrink-0 mt-0.5 w-5 h-5 text-royal" />
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
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
      <section className="bg-white py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              How it works
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              From zero to collecting fees <span className="text-royal">in an afternoon</span>
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Three steps. No phone calls, no bank meetings, no hardware to ship.
            </p>
          </FadeIn>

          <div className="relative grid md:grid-cols-3 gap-6">
            {/* Dashed connector line between steps */}
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px border-t-2 border-dashed border-royal/20 pointer-events-none" />

            {[
              {
                n: '01',
                icon: Building2,
                title: 'Register your school',
                body: 'Pick a subdomain, create an admin, choose a plan. 60 seconds — no credit card required.'
              },
              {
                n: '02',
                icon: Settings2,
                title: 'Configure providers',
                body: 'Paste your MTN / Orange / Airtel API keys (AES-256-GCM at rest). We generate your signed webhook URLs.'
              },
              {
                n: '03',
                icon: Wallet,
                title: 'Collect payments',
                body: 'Parents pay from any phone. We verify with the provider, credit the student, and log everything for audit.'
              }
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.12}>
                <div className="relative bg-white rounded-2xl border border-slate-200 p-8 h-full hover:shadow-xl hover:shadow-navy/5 hover:-translate-y-1 transition-all duration-300">
                  {/* Step number badge — navy with gold hairline */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white shadow-lg shadow-navy/30 mb-5 ring-2 ring-gold/40">
                    <s.icon className="w-7 h-7 text-gold" />
                  </div>
                  <div className="font-mono text-xs text-royal font-semibold mb-1.5 tracking-widest">STEP {s.n}</div>
                  <h3 className="font-display text-xl font-bold text-navy mb-2.5">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12">
            <Button asChild variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
              <Link to="/features">Explore all features <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Providers — MTN / Orange / Airtel */}
      <section className="relative bg-navy text-white py-24 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-royal/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold mb-3">
              Integration partners
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Connect to Africa's <span className="text-gold">leading</span> mobile money networks
            </h2>
            <p className="mt-4 text-slate-300 text-lg">
              One unified API. HMAC-verified webhooks, replay protection, and live reconciliation — out of the box.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'MTN Mobile Money',
                users: '280M users',
                blurb: 'MoMo subscribers across 17 countries — Cameroon, Ghana, Uganda, Rwanda, Côte d\'Ivoire and more.',
                initials: 'MTN',
                ring: 'ring-yellow-400/40',
                badgeBg: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
                badgeText: 'text-yellow-950'
              },
              {
                name: 'Orange Money',
                users: '70M users',
                blurb: 'Seamless integration across West & Central Africa — Senegal, Mali, Côte d\'Ivoire, Cameroon and beyond.',
                initials: 'OM',
                ring: 'ring-orange-400/40',
                badgeBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
                badgeText: 'text-white'
              },
              {
                name: 'Airtel Money',
                users: '27M users',
                blurb: 'Coverage for East & Southern Africa — Kenya, Uganda, Tanzania, Rwanda, Zambia, Malawi.',
                initials: 'AM',
                ring: 'ring-red-400/40',
                badgeBg: 'bg-gradient-to-br from-red-400 to-red-600',
                badgeText: 'text-white'
              }
            ].map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.08}>
                <div className={`relative bg-white/[0.04] backdrop-blur-sm rounded-2xl p-7 h-full border border-white/10 hover:border-gold/40 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 ring-1 ${p.ring}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl ${p.badgeBg} ${p.badgeText} flex items-center justify-center font-display font-bold text-sm shadow-lg tracking-tight`}>
                      {p.initials}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                  <div className="text-sm text-gold mt-0.5 font-semibold">{p.users}</div>
                  <p className="text-sm text-slate-300 mt-4 leading-relaxed">{p.blurb}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12">
            <Button asChild className="bg-gold hover:bg-gold-600 text-navy font-semibold">
              <Link to="/providers">See all provider coverage <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Payment Models — Prepaid / Postpaid / License */}
      <section className="relative bg-white py-28">
        {/* Subtle dot pattern for premium texture */}
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(11 28 61 / 0.06) 1px, transparent 0)',
            backgroundSize: '22px 22px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              Payment models
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              Three ways to pay for <span className="text-royal">SchoolPay</span>
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Whether you're a 40-student village school, a 12,000-student academy, or a network of schools — there's
              a model that fits your scale and cash-flow.
            </p>
          </FadeIn>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prepaid — small schools */}
            <FadeIn>
              <div className="group relative bg-white rounded-2xl border border-slate-200 p-8 h-full hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all duration-300">
                {/* Top gradient accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal to-royal-400 rounded-t-2xl" />

                <div className="w-14 h-14 rounded-xl bg-royal/10 text-royal flex items-center justify-center mb-5 group-hover:bg-royal group-hover:text-white transition-colors">
                  <Coins className="w-6 h-6" />
                </div>

                <div className="text-[11px] uppercase tracking-[0.2em] text-royal font-bold mb-2">
                  Prepaid
                </div>
                <h3 className="font-display text-2xl font-bold text-navy mb-3">
                  Pay per student
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Top up a credit bundle and spend it as parents make payments. No monthly
                  commitment — perfect for small schools or seasonal intakes.
                </p>

                <ul className="space-y-2.5 mb-8 text-sm text-slate-700">
                  {[
                    'Pay only for students you onboard',
                    'No minimum commitment',
                    'Top up from $20',
                    'Credits never expire'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-royal mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-display font-bold text-navy">$0.50<span className="text-base font-normal text-slate-500">/student</span></div>
                    <div className="text-xs text-slate-500 mt-1">Ideal for &lt; 200 students</div>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 bg-white border-2 border-navy text-navy hover:bg-navy hover:text-white"
                  onClick={() => setMode('register')}
                >
                  Start with Prepaid
                </Button>
              </div>
            </FadeIn>

            {/* Postpaid — RECOMMENDED, large schools */}
            <FadeIn delay={0.1}>
              <div className="group relative bg-navy text-white rounded-2xl border-2 border-gold p-8 h-full shadow-2xl shadow-navy/30 hover:-translate-y-1 transition-all duration-300 lg:scale-[1.04]">
                {/* Gold "recommended" badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold text-navy text-[11px] font-bold uppercase tracking-widest shadow-lg">
                  <Sparkles className="w-3 h-3" /> Most popular
                </div>

                <div className="w-14 h-14 rounded-xl bg-gold text-navy flex items-center justify-center mb-5 shadow-md">
                  <CalendarClock className="w-6 h-6" />
                </div>

                <div className="text-[11px] uppercase tracking-[0.2em] text-gold font-bold mb-2">
                  Postpaid
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">
                  Monthly subscription
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Flat monthly or yearly fee, unlimited transactions, unlimited students. The predictable
                  choice for schools managing thousands of payments a month.
                </p>

                <ul className="space-y-2.5 mb-8 text-sm text-slate-200">
                  {[
                    'Unlimited transactions & students',
                    'Multi-provider support',
                    'Priority support & SLA',
                    'Monthly or yearly (save 2 months)'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-white/15 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-display font-bold">From $25<span className="text-base font-normal text-slate-400">/month</span></div>
                    <div className="text-xs text-slate-400 mt-1">Ideal for 200 – 5,000 students</div>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 bg-gold hover:bg-gold-600 text-navy font-semibold"
                  onClick={() => setMode('register')}
                >
                  Start with Postpaid
                </Button>
              </div>
            </FadeIn>

            {/* License — one-time, self-hosted, networks */}
            <FadeIn delay={0.2}>
              <div className="group relative bg-white rounded-2xl border border-slate-200 p-8 h-full hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold to-gold-600 rounded-t-2xl" />

                <div className="w-14 h-14 rounded-xl bg-gold/15 text-gold-600 flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-navy transition-colors">
                  <Server className="w-6 h-6" />
                </div>

                <div className="text-[11px] uppercase tracking-[0.2em] text-gold-600 font-bold mb-2">
                  License
                </div>
                <h3 className="font-display text-2xl font-bold text-navy mb-3">
                  One-time purchase
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Buy the SchoolPay system outright and run it on your own servers. Manage one school,
                  a district, or an entire network — tier depends on the license you pick.
                </p>

                <ul className="space-y-2.5 mb-8 text-sm text-slate-700">
                  {[
                    'Self-hosted, your infrastructure',
                    'Manage multiple schools per license',
                    'White-label branding included',
                    'Source-available; one year of updates'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-display font-bold text-navy">From $2,500<span className="text-base font-normal text-slate-500"> one-time</span></div>
                    <div className="text-xs text-slate-500 mt-1">Networks & ministries</div>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full mt-6 bg-white border-2 border-navy text-navy hover:bg-navy hover:text-white"
                >
                  <Link to="/pricing#license">Talk to sales</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          <FadeIn className="text-center mt-10 text-sm text-slate-500">
            Not sure which model fits? <Link to="/pricing" className="text-royal font-semibold hover:underline">Compare plans side-by-side →</Link>
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
              { name: 'Amadou Diallo', role: 'Finance Director', school: 'Riverbend Academy', initial: 'A', grad: 'from-blue-500 to-indigo-600',
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

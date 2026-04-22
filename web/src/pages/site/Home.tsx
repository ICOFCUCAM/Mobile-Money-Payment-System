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
  Coins, CalendarClock, Server, Sparkles, MoreHorizontal, FileCheck, AlertCircle,
  Clock, Shield
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn, AnimatedNumber } from '@/components/site/motion';
import { AfricaMap } from '@/components/site/AfricaMap';
import { LiveTicker } from '@/components/site/LiveTicker';

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
      {/* Hero — headline on the left, Africa map on the right. The rotating
           dashboard widget has moved to its own "See it live" section below,
           so the hero stays focused on headline + geography. */}
      <section className="relative bg-navy text-white overflow-hidden pb-0">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute -top-40 -left-20 w-[620px] h-[620px] rounded-full bg-royal/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[620px] h-[620px] rounded-full bg-gold/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 lg:pt-24 pb-12 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-6 items-center">
          {/* Left column — headline */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Live across 12 countries
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04]">
              School Payments.<br />
              Built for <span className="text-royal-400">Africa</span>.<br />
              <span className="text-gold">Powered by Mobile Money.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              SchoolPay is the payment infrastructure for African schools — one API that connects to every
              major mobile-money network on the continent (MTN MoMo, Orange Money, Airtel Money — with new
              networks added every quarter), verifies every receipt, credits the student, and hands your
              bursar a real-time audit trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
            <div className="mt-6 flex items-center gap-6 text-sm text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> Setup in minutes</span>
            </div>
          </div>

          {/* Right column — Africa map, naturally sized inside the grid cell */}
          <div className="relative hidden md:block">
            <AfricaMap className="w-full h-auto" />
            {/* Floating metric pill under the map */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/90 font-semibold">3 networks</span>
              <span className="text-white/40">·</span>
              <span className="text-gold font-semibold">12 countries</span>
            </div>
          </div>
        </div>

        {/* Row 3 — live transactions ticker spanning full-width of the hero */}
        <div className="relative border-t border-white/10 bg-navy-950/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2">
            <div className="flex items-center gap-4 py-1">
              <div className="shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
              <div className="flex-1 min-w-0">
                <LiveTicker />
              </div>
            </div>
          </div>
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

      {/* Problem → Solution — premium fintech storytelling section.
           Section header → 3-column layout (pain | live dashboard | solution) →
           bottom trust bar. */}
      <section className="relative bg-gradient-to-b from-white via-slate-50 to-white py-24 lg:py-28 overflow-hidden">
        {/* Decorative dot grid in the corners */}
        <div
          className="absolute top-10 left-6 w-32 h-32 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(11 28 61 / 0.18) 1px, transparent 0)',
            backgroundSize: '14px 14px'
          }}
        />
        <div
          className="absolute top-10 right-6 w-32 h-32 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(11 28 61 / 0.18) 1px, transparent 0)',
            backgroundSize: '14px 14px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

          {/* ─── Section header ─────────────────────────── */}
          <FadeIn className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal/10 border border-royal/20 text-royal text-[11px] font-bold uppercase tracking-[0.18em] mb-6">
              Built for schools · Trusted by parents
            </div>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-navy tracking-tight leading-[1.1]">
              From Excel sheets to <span className="bg-gradient-to-r from-royal to-royal-400 bg-clip-text text-transparent">real-time reconciliation</span>
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              SchoolPay brings clarity, speed, and trust to every transaction.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[12px] font-semibold text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live in your dashboard
            </div>
          </FadeIn>

          {/* ─── 3-column layout ─────────────────────────── */}
          <div className="grid lg:grid-cols-[1fr_1.3fr_1fr] gap-6 items-stretch">

            {/* ░░ LEFT — Pain card ░░ */}
            <FadeIn>
              <div className="group relative h-full bg-gradient-to-br from-navy via-navy to-navy-950 rounded-[24px] p-7 lg:p-8 text-white shadow-2xl shadow-navy/30 overflow-hidden hover:-translate-y-1 transition-all duration-500">
                {/* Red glow bottom-right */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
                {/* Subtle top sheen */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-7">
                    <span className="w-7 h-7 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">
                      Today's manual workflow
                    </span>
                  </div>
                  <h3 className="font-display text-[26px] md:text-3xl font-bold leading-[1.1] mb-7">
                    The bursar's <br /> Friday bottleneck
                  </h3>
                  <ul className="space-y-4 text-[14px]">
                    {[
                      'WhatsApp receipt screenshots arrive one-by-one',
                      'Transaction IDs copied manually into Excel',
                      'Duplicate payments go unnoticed',
                      'No audit trail when regulators come calling',
                      'Bank meetings required before activation'
                    ].map((p) => (
                      <li key={p} className="flex gap-3">
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center text-red-300 text-[11px] font-bold leading-none">×</span>
                        <span className="text-slate-300 leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warning indicator bottom-right */}
                <div className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </FadeIn>

            {/* ░░ CENTER — Live dashboard (15% larger via grid + lg:scale) ░░ */}
            <FadeIn delay={0.05}>
              <div className="relative h-full lg:scale-[1.04] origin-center transition-transform duration-500">
                <div className="bg-white rounded-[28px] shadow-2xl shadow-navy/15 ring-1 ring-slate-200/70 overflow-hidden h-full flex flex-col">
                  {/* Tab bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-2">
                    <div className="flex">
                      {([
                        { id: 'overview', label: 'Overview',       icon: Activity },
                        { id: 'verify',   label: 'Verify',         icon: ShieldCheck },
                        { id: 'audit',    label: 'Audit',          icon: FileCheck }
                      ] as const).map((t) => {
                        const active = heroTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => pickTab(t.id)}
                            className={`relative flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-medium transition-colors ${
                              active ? 'text-royal' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                            {active && (
                              <motion.span
                                layoutId="heroTabBar"
                                className="absolute inset-x-2 bottom-0 h-[2px] bg-royal rounded-full"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button className="px-2 text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6 pt-6 pb-5 flex-1">
                    <AnimatePresence mode="wait">
                      {heroTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                        >
                          {/* Header: revenue + chart */}
                          <div className="grid grid-cols-[1fr_auto] gap-5 items-end mb-5">
                            <div>
                              <div className="text-[11px] text-slate-500">Total Revenue</div>
                              <div className="font-display text-[28px] font-bold tracking-tight text-navy mt-0.5">
                                1,335,000 <span className="text-base text-slate-500 font-medium">XAF</span>
                              </div>
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                                <TrendingUp className="w-3 h-3" /> 24.5%
                                <span className="text-[10px] text-slate-500 font-normal ml-1">vs last 30 days</span>
                              </div>
                            </div>
                            {/* Mini line chart — animated draw on view */}
                            <svg viewBox="0 0 140 50" className="w-[140px] h-[50px]">
                              <defs>
                                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <path d="M0,40 L20,32 L35,36 L52,28 L70,30 L88,18 L105,22 L122,12 L140,8 L140,50 L0,50 Z" fill="url(#chartFill)" />
                              <path
                                d="M0,40 L20,32 L35,36 L52,28 L70,30 L88,18 L105,22 L122,12 L140,8"
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="300"
                                strokeDashoffset="300"
                              >
                                <animate attributeName="stroke-dashoffset" from="300" to="0" dur="1.4s" begin="0.3s" fill="freeze" />
                              </path>
                              <circle cx="140" cy="8" r="3" fill="#2563EB">
                                <animate attributeName="opacity" from="0" to="1" begin="1.6s" dur="0.3s" fill="freeze" />
                              </circle>
                            </svg>
                          </div>

                          {/* Provider segmentation cards */}
                          <div className="grid grid-cols-3 gap-2 mb-5">
                            <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-50/50 border border-yellow-200 p-3">
                              <div className="text-[10px] text-yellow-700 font-bold uppercase tracking-wider">MTN</div>
                              <div className="font-display font-bold text-navy mt-1">540K</div>
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Settled
                              </div>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200 p-3">
                              <div className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">Orange</div>
                              <div className="font-display font-bold text-navy mt-1">660K</div>
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Settled
                              </div>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 p-3">
                              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Pending</div>
                              <div className="font-display font-bold text-navy mt-1">80K</div>
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                                <Clock className="w-3 h-3" /> To verify
                              </div>
                            </div>
                          </div>

                          {/* Recent transactions */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[12px] font-semibold text-navy">Recent Transactions</div>
                            <button className="text-[11px] text-royal hover:underline font-medium">View all</button>
                          </div>
                          <div className="space-y-2">
                            {[
                              { initial: 'A', grad: 'from-blue-400 to-indigo-500',  name: 'Amina Nkomo',   id: 'STU001', amount: '45,000',  status: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
                              { initial: 'K', grad: 'from-emerald-400 to-teal-500', name: 'Kwame Mensah',  id: 'STU002', amount: '150,000', status: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
                              { initial: 'Z', grad: 'from-purple-400 to-pink-500',  name: 'Zainab Hassan', id: 'STU003', amount: '30,000',  status: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200',         icon: Clock }
                            ].map((r, i) => (
                              <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                                className="flex items-center justify-between py-1.5"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.grad} flex items-center justify-center text-white font-bold text-xs`}>
                                    {r.initial}
                                  </div>
                                  <div>
                                    <div className="font-medium text-[13px] text-navy">{r.name}</div>
                                    <div className="text-[11px] text-slate-500">{r.id}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="font-semibold text-[13px] text-navy">{r.amount} XAF</div>
                                  <Badge variant="outline" className={`${r.cls} text-[10px] font-semibold inline-flex items-center gap-1 hover:bg-inherit`}>
                                    <r.icon className="w-3 h-3" /> {r.status}
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {heroTab === 'verify' && (
                        <motion.div key="verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                          <div className="text-[11px] text-slate-500 mb-1">Verify payment</div>
                          <div className="font-display text-xl font-bold text-navy mb-5">Submit a mobile-money receipt</div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">A</div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-navy">Amina Nkomo</div>
                                <div className="text-[11px] text-slate-500">STU001 · Grade 10</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-sm flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-500" /> MTN
                              </div>
                              <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono">MoMo-9F3A21</div>
                            </div>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-emerald-900">Verified &amp; credited</div>
                                <div className="text-xs text-emerald-800">45,000 XAF → balance: <b>90,000 XAF</b></div>
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
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-[11px] text-slate-500">Audit Log</div>
                              <div className="font-display text-xl font-bold text-navy mt-0.5">Recent activity</div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-semibold">Live</Badge>
                          </div>
                          <ul className="space-y-3">
                            {[
                              { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', title: 'Payment verified', body: 'MoMo-9F3A21 · 45,000 XAF · Amina', time: 'now' },
                              { icon: UserPlus,     color: 'text-blue-600 bg-blue-50',       title: 'Student added',    body: 'STU018 · Kofi Asante · Grade 11', time: '2m' },
                              { icon: Undo2,        color: 'text-red-600 bg-red-50',         title: 'Payment reversed', body: 'MoMo-88EF02 · −30,000 XAF',       time: '14m' },
                              { icon: KeyRound,     color: 'text-amber-600 bg-amber-50',     title: 'API key rotated',  body: 'by an admin account',              time: '1h' },
                              { icon: Webhook,      color: 'text-indigo-600 bg-indigo-50',   title: 'Webhook received', body: 'MTN · HMAC verified',              time: '1h' }
                            ].map((row, i) => (
                              <li key={i} className="flex gap-3 items-start">
                                <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center shrink-0`}>
                                  <row.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-medium text-navy flex items-center justify-between gap-2">
                                    <span>{row.title}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{row.time}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">{row.body}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Trust footer strip */}
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-500" /> Bank grade security</span>
                    <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> PCI-DSS Compliant</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 99.99% Uptime</span>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* ░░ RIGHT — Solution card ░░ */}
            <FadeIn delay={0.1}>
              <div className="group relative h-full bg-white rounded-[24px] p-7 lg:p-8 border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden hover:-translate-y-1 transition-all duration-500">
                {/* Cream/gold gradient watermark in the upper-right */}
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-gold/15 via-amber-100/40 to-transparent blur-2xl pointer-events-none" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.2em] mb-7">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    SchoolPay automation
                  </div>
                  <h3 className="font-display text-[26px] md:text-3xl font-bold text-navy leading-[1.1] mb-7">
                    Verified, credited, audited <br /> — in two seconds
                  </h3>
                  <ul className="space-y-4 text-[14px]">
                    {[
                      'Payments verified instantly with providers.',
                      'Student balances updated automatically — no re-keying.',
                      'Duplicate protection by design: UNIQUE(school, provider, tx_id).',
                      'Append-only audit log you can hand straight to auditors.',
                      'Activation in under 60 seconds — no sales call, no bank meeting.'
                    ].map((p, i) => (
                      <motion.li
                        key={p}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                        className="flex gap-3"
                      >
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </span>
                        <span className="text-slate-700 leading-relaxed">{p}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Shield watermark bottom-right */}
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-emerald-300/40 rounded-full blur-2xl scale-150" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
                    </div>
                    {/* Sparkles */}
                    <Sparkles className="absolute -top-3 -left-4 w-3 h-3 text-emerald-300" />
                    <Sparkles className="absolute -bottom-2 -right-3 w-2.5 h-2.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* ─── Bottom trust bar ─────────────────────────── */}
          <FadeIn delay={0.2} className="mt-12">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5 grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-6 items-center">
              <div className="md:col-span-1 text-[12px] text-slate-500 font-medium">
                Trusted by progressive schools &amp; networks
              </div>
              {[
                { icon: Zap,         caption: 'Real-time',  label: 'Reconciliation' },
                { icon: ShieldCheck, caption: 'Instant',    label: 'Verification' },
                { icon: Layers,      caption: 'Zero',       label: 'Duplicates' },
                { icon: FileCheck,   caption: '100%',       label: 'Auditable' }
              ].map((t) => (
                <div key={t.caption} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 text-royal flex items-center justify-center shrink-0">
                    <t.icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-navy leading-tight">{t.caption}</div>
                    <div className="text-[11px] text-slate-500">{t.label}</div>
                  </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/*
              Fourth card makes extensibility explicit: any new network can
              be plugged in via our BaseProvider abstraction. Dashed border
              + gold accent signals "slot available" rather than "live now".
            */}
            <FadeIn delay={0.24}>
              <div className="relative rounded-2xl p-7 h-full border-2 border-dashed border-gold/40 bg-gradient-to-br from-gold/[0.06] to-transparent hover:border-gold hover:bg-gold/[0.1] transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-display font-bold shadow-inner ring-1 ring-gold/30">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-semibold uppercase tracking-widest">
                    New
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-white">+ Your network</h3>
                <div className="text-sm text-gold mt-0.5 font-semibold">Ships in under a week</div>
                <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                  Wave, M-Pesa, TigoCash, Moov Money — our <code className="bg-white/10 px-1 rounded text-[11px]">BaseProvider</code> abstraction
                  means new networks plug in without touching your app.
                </p>
              </div>
            </FadeIn>
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
                  Your wallet is debited $6 per active student at the start of each academic year.
                  No monthly commitment — ideal for small schools and seasonal intakes.
                </p>

                <ul className="space-y-2.5 mb-8 text-sm text-slate-700">
                  {[
                    'Pay per active student, once a year',
                    'No monthly commitment',
                    'Wallet balance never expires',
                    'Prorated top-ups mid-year'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-royal mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-display font-bold text-navy">$6<span className="text-base font-normal text-slate-500">/student/yr</span></div>
                    <div className="text-xs text-slate-500 mt-1">Best under ~100 students</div>
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
                    <div className="text-3xl font-display font-bold">From $19<span className="text-base font-normal text-slate-400">/month</span></div>
                    <div className="text-xs text-slate-400 mt-1">Up to 3,000 students</div>
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
                    'Flat one-off — no annual maintenance',
                    '1 year of updates + email support'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-display font-bold text-navy">From $6,000<span className="text-base font-normal text-slate-500"> one-time</span></div>
                    <div className="text-xs text-slate-500 mt-1">Flat fee · no recurring charges</div>
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

      {/* Features grid — 6 cards */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">
              Platform capabilities
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              Everything you need to <span className="text-royal">run school payments</span> at scale
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              A complete fintech stack, purpose-built for African education.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                title: 'Payment verification',
                body: 'Sub-second verification with every provider. Replay-protected by UNIQUE(school, provider, tx_id) — the same receipt cannot credit a student twice.',
                accent: 'bg-royal/10 text-royal group-hover:bg-royal group-hover:text-white'
              },
              {
                icon: CreditCard,
                title: 'Every major network — extensible',
                body: 'MTN, Orange, Airtel today; Wave, M-Pesa, TigoCash tomorrow. New providers plug into our BaseProvider abstraction in under a week — no rewrites on your side.',
                accent: 'bg-gold/15 text-gold-600 group-hover:bg-gold group-hover:text-navy'
              },
              {
                icon: Activity,
                title: 'Real-time dashboards',
                body: 'Live revenue by provider, pending transactions, reconciliation lag and student balances — updated the moment each payment verifies.',
                accent: 'bg-royal/10 text-royal group-hover:bg-royal group-hover:text-white'
              },
              {
                icon: Webhook,
                title: 'Webhooks & API',
                body: 'HMAC-verified inbound webhooks, a REST API for your own school website, and a drop-in widget.js for sites with no backend.',
                accent: 'bg-gold/15 text-gold-600 group-hover:bg-gold group-hover:text-navy'
              },
              {
                icon: Lock,
                title: 'Security & encryption',
                body: 'AES-256-GCM for provider credentials at rest, bcrypt for passwords, SHA-256 hashed API keys, TLS everywhere. Rotate keys in one click.',
                accent: 'bg-royal/10 text-royal group-hover:bg-royal group-hover:text-white'
              },
              {
                icon: Layers,
                title: 'Multi-tenant isolation',
                body: 'Every query scoped by school_id. Students, transactions, settings, API keys — nothing crosses a tenant boundary, ever.',
                accent: 'bg-gold/15 text-gold-600 group-hover:bg-gold group-hover:text-navy'
              }
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <div className="group bg-white rounded-2xl border border-slate-200 p-7 h-full hover:shadow-xl hover:shadow-navy/10 hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${f.accent}`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12">
            <Button asChild variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
              <Link to="/features">See the full feature list <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">What schools say</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              Bursars love it. <span className="text-royal">So do parents.</span>
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Amadou Diallo', role: 'Finance Director', school: 'Riverbend Academy', initial: 'A',
                quote: 'We used to chase parents for MoMo receipts and type them into Excel. With SchoolPay a payment is verified and the student credited in under two seconds.' },
              { name: 'Sarah Okonkwo', role: 'Head Bursar', school: 'Greenwood High', initial: 'S',
                quote: 'The audit log alone justified the subscription. Every reversal, every provider webhook, every student edit is on one timeline we can hand to the auditors.' },
              { name: 'Pierre Mbappe', role: 'School Administrator', school: 'Lycée Saint-Joseph', initial: 'P',
                quote: 'Setup took an afternoon. We configured MTN and Orange, pointed the webhooks, and parents started paying the same day.' }
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className="relative bg-white rounded-2xl border border-slate-200 p-7 h-full hover:shadow-xl hover:shadow-navy/10 hover:-translate-y-1 transition-all duration-300">
                  <Quote className="absolute top-5 right-5 w-7 h-7 text-gold/60" />
                  {/* 5-star row */}
                  <div className="flex gap-0.5 mb-4">
                    {[0,1,2,3,4].map((i) => (
                      <svg key={i} viewBox="0 0 20 20" className="w-4 h-4 fill-gold"><path d="M10 1l2.5 6 6.5.5-5 4.5 1.5 6.5L10 15l-5.5 3.5L6 12 1 7.5l6.5-.5z"/></svg>
                    ))}
                  </div>
                  <p className="text-[15px] text-slate-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy to-royal flex items-center justify-center text-white font-display font-bold shadow-md">
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-navy">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role} · {t.school}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview — teaser */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn className="text-center mb-12 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.25em] text-royal font-semibold mb-3">Simple pricing</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight">
              Start free. Pay only when <span className="text-royal">your school grows</span>.
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Three plans, a 14-day free trial on each, and no hidden per-transaction fees.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: 'Basic',      price: 19,  tag: 'Up to 150 students',    highlight: false },
              { name: 'Pro',        price: 49,  tag: 'Up to 750 students',    highlight: true  },
              { name: 'Enterprise', price: 149, tag: 'Up to 3,000 students',  highlight: false }
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border transition-all ${
                  p.highlight
                    ? 'bg-navy text-white border-gold shadow-xl shadow-navy/30 md:scale-105'
                    : 'bg-white text-navy border-slate-200 hover:shadow-lg'
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest ${p.highlight ? 'text-gold' : 'text-royal'}`}>{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">${p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
                </div>
                <div className={`mt-2 text-sm ${p.highlight ? 'text-slate-300' : 'text-slate-600'}`}>{p.tag}</div>
              </div>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <Button asChild size="lg" className="bg-navy hover:bg-navy-800 text-white">
              <Link to="/pricing">Compare all plans & models <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-navy text-white py-24 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-royal/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" /> Ready when you are
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Modernize your school payments <span className="text-gold">this afternoon</span>.
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            Join 500+ schools across Africa already reconciling mobile-money payments in real time.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-gold hover:bg-gold-600 text-navy font-semibold" onClick={() => setMode('register')}>
              Start Your Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Link to="/developers">Read the docs</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> Cancel anytime</span>
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

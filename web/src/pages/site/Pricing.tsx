import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, ArrowRight, Users, CalendarClock, Shield, Server,
  Sparkles, Info, Lock, Building2, GraduationCap, BadgeCheck
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

// Prepaid pricing tiers — first 100 students at $4/yr, next 50 at $6/yr.
// Above 150 students, Postpaid Basic ($190/yr for up to 150) is always
// better, so we cap Prepaid at 150 on the UI and nudge schools upward.
const PREPAID_T1_RATE = 4;   // per student for students 1–100
const PREPAID_T2_RATE = 6;   // per student for students 101–150
const PREPAID_T1_CAP  = 100;
const PREPAID_T2_CAP  = 150;

function prepaidCost(students: number): {
  tier1Count: number;
  tier2Count: number;
  tier1Sub: number;
  tier2Sub: number;
  total: number;
} {
  const tier1Count = Math.min(students, PREPAID_T1_CAP);
  const tier2Count = Math.max(0, Math.min(students, PREPAID_T2_CAP) - PREPAID_T1_CAP);
  const tier1Sub = tier1Count * PREPAID_T1_RATE;
  const tier2Sub = tier2Count * PREPAID_T2_RATE;
  return { tier1Count, tier2Count, tier1Sub, tier2Sub, total: tier1Sub + tier2Sub };
}

type Tab = 'prepaid' | 'subscription' | 'license';
type Billing = 'monthly' | 'yearly';

const PricingInner: React.FC = () => {
  const { setMode } = useAuthDialog();
  const [tab, setTab] = useState<Tab>('subscription');
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20 lg:py-24 overflow-hidden">
      {/* Decorative corner dots */}
      <div
        className="absolute top-10 right-6 w-40 h-40 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(37 99 235 / 0.18) 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />
      <div
        className="absolute top-10 left-6 w-40 h-40 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(37 99 235 / 0.18) 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        {/* ─── Section header ─────────────────────────── */}
        <FadeIn className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal/10 border border-royal/20 text-royal text-[11px] font-bold uppercase tracking-[0.18em] mb-6">
            Simple, transparent pricing
          </div>
          <h1 className="font-display text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-navy tracking-tight leading-[1.1]">
            Flexible payment plans<br />
            that <span className="bg-gradient-to-r from-royal to-royal-400 bg-clip-text text-transparent">grow with your school</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            Choose how you want to run SchoolPay — pay per student, subscribe monthly, or deploy your own licensed infrastructure.
          </p>
        </FadeIn>

        {/* ─── Segmented tab switcher ─────────────────── */}
        <FadeIn delay={0.05}>
          <div className="mx-auto mb-12 max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {([
              { id: 'prepaid',      label: 'Pay per student',     sub: 'Prepaid',  icon: Users },
              { id: 'subscription', label: 'Subscription plans',  sub: 'Postpaid', icon: CalendarClock },
              { id: 'license',      label: 'License plans',       sub: 'One-time', icon: Shield }
            ] as const).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-br from-royal to-royal-700 text-white shadow-md shadow-royal/30'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-[13px] font-semibold leading-tight ${active ? '' : 'text-navy'}`}>{t.label}</div>
                    <div className={`text-[11px] ${active ? 'text-white/80' : 'text-slate-500'}`}>{t.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* ─── Tab panels ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {tab === 'prepaid'      && <PrepaidPanel     key="prepaid" onStart={() => setMode('register')} />}
          {tab === 'subscription' && <SubscriptionPanel key="subscription" billing={billing} onBilling={setBilling} onStart={() => setMode('register')} />}
          {tab === 'license'      && <LicensePanel      key="license" onStart={() => setMode('register')} />}
        </AnimatePresence>

        {/* ─── Bottom trust strip ─────────────────── */}
        <FadeIn delay={0.15} className="mt-14">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-5 items-center">
            {[
              { icon: BadgeCheck, caption: 'No hidden fees',      label: 'Ever.' },
              { icon: CalendarClock, caption: 'Cancel anytime',   label: 'No lock-ins.' },
              { icon: Lock,          caption: 'Secure & compliant', label: 'Bank-grade security.' },
              { icon: GraduationCap, caption: 'Trusted by schools',  label: 'Across the region.' }
            ].map((t) => (
              <div key={t.caption} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-royal/10 text-royal flex items-center justify-center shrink-0">
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
  );
};

/* ═══ MODEL 1: PREPAID ═══════════════════════════════════════════════════ */
const PrepaidPanel: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const [students, setStudents] = useState(80);
  const { tier1Count, tier2Count, tier1Sub, tier2Sub, total } = prepaidCost(students);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-900/5 overflow-hidden"
    >
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 p-8 lg:p-12 items-center">
        {/* Left — pricing */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-royal mb-3">
            <div className="w-6 h-6 rounded-md bg-royal/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            Prepaid
          </div>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">
            Pay per student
          </h3>
          <p className="mt-3 text-slate-600 leading-relaxed max-w-md">
            Perfect for small schools and seasonal intakes. Pay $4 per student per year while
            you're small; the rate ticks up to $6 for students 101–150 to cushion the jump to
            our Postpaid Basic plan.
          </p>

          {/* Two-tier price blocks */}
          <div className="mt-7 grid grid-cols-2 gap-3 max-w-md">
            <div className="rounded-xl border border-royal/30 bg-royal/5 p-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-royal">Tier 1</div>
              <div className="mt-1 font-display text-3xl font-bold text-navy">$4</div>
              <div className="text-[11px] text-slate-600 leading-tight">per student / year<br/>first 100 students</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Tier 2</div>
              <div className="mt-1 font-display text-3xl font-bold text-navy">$6</div>
              <div className="text-[11px] text-slate-600 leading-tight">per student / year<br/>students 101–150</div>
            </div>
          </div>

          <ul className="mt-7 space-y-2.5 max-w-md">
            {[
              'Wallet debited once per academic year',
              'Marginal tiers — every student only charged at its own rate',
              'Balance never expires; top up anytime',
              'Over 150 students? Postpaid Basic ($190/yr) is cheaper'
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-slate-700">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Button
            className="mt-8 w-full max-w-md bg-white hover:bg-royal hover:text-white border-2 border-royal text-royal font-semibold"
            onClick={onStart}
          >
            Get Started
          </Button>
        </div>

        {/* Right — live calculator + illustration */}
        <div className="space-y-6">
          {/* Live cost calculator */}
          <div className="rounded-2xl bg-gradient-to-br from-navy via-navy to-navy-950 p-6 lg:p-7 text-white shadow-xl shadow-navy/25">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gold font-bold">
                  Wallet calculator
                </div>
                <div className="mt-1 font-display text-3xl font-bold">{students} students</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Annual cost</div>
                <div className="mt-1 font-display text-3xl font-bold text-gold">${total}</div>
              </div>
            </div>

            <Slider
              value={[students]}
              onValueChange={(v) => setStudents(v[0])}
              min={10}
              max={PREPAID_T2_CAP}
              step={5}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>10</span>
              <span>100 <span className="text-gold/80">(tier jump)</span></span>
              <span>150 (cap)</span>
            </div>

            {/* Breakdown */}
            <div className="mt-5 rounded-xl bg-white/5 border border-white/10 p-4 text-[13px] space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Students 1–{tier1Count} × $4</span>
                <span className="font-mono text-white">${tier1Sub}</span>
              </div>
              {tier2Count > 0 && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Students 101–{PREPAID_T1_CAP + tier2Count} × $6</span>
                  <span className="font-mono text-white">${tier2Sub}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between font-semibold">
                <span>Year 1 total</span>
                <span className="font-mono text-gold">${total}</span>
              </div>
            </div>
          </div>

          <PrepaidIllustration />
        </div>
      </div>
    </motion.div>
  );
};

/** Decorative payment illustration with 4 avatar bubbles orbiting a $2 receipt. */
const PrepaidIllustration: React.FC = () => {
  const avatars = [
    { top: '8%',  left: '70%', grad: 'from-indigo-400 to-blue-500',   initial: 'A' },
    { top: '42%', left: '92%', grad: 'from-emerald-400 to-teal-500',  initial: 'K' },
    { top: '75%', left: '68%', grad: 'from-amber-400 to-orange-500',  initial: 'Z' },
    { top: '55%', left: '5%',  grad: 'from-purple-400 to-pink-500',   initial: 'M' }
  ];
  return (
    <div className="relative w-full h-[240px] hidden lg:block">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 340">
        <circle cx="200" cy="170" r="150" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.5" />
        <circle cx="200" cy="170" r="110" fill="none" stroke="#cbd5e1" strokeWidth="1"   strokeDasharray="3 5" opacity="0.5" />
      </svg>

      {avatars.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className={`absolute w-14 h-14 rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center text-white font-display font-bold text-lg shadow-lg ring-4 ring-white`}
          style={{ top: a.top, left: a.left, transform: 'translate(-50%, -50%)' }}
        >
          {a.initial}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl shadow-royal/20 ring-1 ring-slate-200 px-6 py-5 min-w-[200px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Annual wallet debit</div>
            <div className="mt-1 font-display text-2xl font-bold text-navy">$6.00</div>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" /> Paid
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══ MODEL 2: POSTPAID SUBSCRIPTION ════════════════════════════════════ */
type Plan = {
  id: string;
  name: string;
  tag: string;
  monthly: number;
  yearly: number;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'basic', name: 'Basic', tag: 'Everything a starter school needs.',
    // Yearly is ~17% off (2 months free): $19 × 12 = $228 → $190/yr (save $38)
    monthly: 19, yearly: 190,
    features: [
      'Up to 150 students',
      '1 Payment Provider',
      'Basic Dashboard',
      'Email Support',
      'CSV Export'
    ]
  },
  {
    id: 'pro', name: 'Pro', tag: 'Advanced features for growing schools.',
    // $49 × 12 = $588 → $490/yr (save $98)
    monthly: 49, yearly: 490, popular: true,
    features: [
      'Up to 750 students',
      '3 Payment Providers',
      'Advanced Analytics',
      'Priority Support',
      'CSV Import/Export',
      'Webhooks',
      'API Access'
    ]
  },
  {
    id: 'enterprise', name: 'Enterprise', tag: 'For large schools and networks.',
    // $149 × 12 = $1,788 → $1,490/yr (save $298)
    monthly: 149, yearly: 1490,
    features: [
      'Up to 3,000 students',
      'Unlimited Providers',
      'White-Label Branding',
      'Dedicated Support',
      'Custom Integrations',
      'SLA Guarantee',
      'Audit Log Exports'
    ]
  }
];

const SubscriptionPanel: React.FC<{
  billing: Billing;
  onBilling: (b: Billing) => void;
  onStart: () => void;
}> = ({ billing, onBilling, onStart }) => {
  // Student slider state — recommends a tier based on count.
  // Thresholds match the new plan student caps: Basic 150, Pro 750, Enterprise 3000.
  const [students, setStudents] = useState(500);
  const recommendedId: 'basic' | 'pro' | 'enterprise' =
    students <= 150  ? 'basic' :
    students <= 750  ? 'pro'   :
    'enterprise';
  const overCap = students > 3000;

  return (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25 }}
    className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-900/5 p-6 md:p-10"
  >
    {/* Panel header row */}
    <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row mb-8">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-royal mb-2">
          <div className="w-6 h-6 rounded-md bg-royal/10 flex items-center justify-center">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          Postpaid subscription plans
        </div>
        <p className="text-slate-600 text-sm">Billed monthly or save more with annual billing.</p>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="relative flex items-center rounded-full bg-slate-100 p-1">
        <button
          onClick={() => onBilling('monthly')}
          className={`relative z-10 px-4 py-2 text-[13px] font-semibold rounded-full transition-colors ${
            billing === 'monthly' ? 'text-navy' : 'text-slate-500'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onBilling('yearly')}
          className={`relative z-10 px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
            billing === 'yearly' ? 'text-white' : 'text-slate-500'
          }`}
        >
          Yearly <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${billing === 'yearly' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'} font-bold`}>2 months free</span>
        </button>
        {/* Animated pill */}
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`absolute inset-y-1 rounded-full bg-royal shadow ${
            billing === 'monthly' ? 'left-1 right-[60%]' : 'left-[35%] right-1'
          }`}
        />
      </div>
    </div>

    {/* Student-count slider — "Step 2: Pick a tier" — recommends a plan */}
    <div className="mb-8 rounded-2xl bg-navy p-6 lg:p-7 text-white shadow-xl shadow-navy/25 border border-white/10">
      <div className="flex items-start md:items-end justify-between gap-4 flex-col md:flex-row">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold font-bold mb-2">
            Size your plan with the student slider
          </div>
          <div className="font-display text-3xl font-bold">
            {students >= 3000 ? '3,000+' : students.toLocaleString()}
            <span className="text-slate-400 text-base font-normal ml-2">students</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-navy text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          {overCap ? 'See License plans' : `Recommended: ${recommendedId}`}
        </div>
      </div>

      <Slider
        value={[students]}
        onValueChange={(v) => setStudents(v[0])}
        min={10}
        max={3000}
        step={10}
        className="mt-5"
      />
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>10</span>
        <span>150 <span className="text-gold/70">(Basic cap)</span></span>
        <span>750 <span className="text-gold/70">(Pro cap)</span></span>
        <span>3,000+</span>
      </div>

      <p className="mt-4 text-sm text-slate-300">
        {recommendedId === 'basic'      && <>At this size, <b className="text-white">Basic</b> covers you for about <b className="text-gold">${Math.round(190 / Math.max(students, 10))}/student/year</b>.</>}
        {recommendedId === 'pro'        && <>At this size, <b className="text-white">Pro</b> is the sweet spot — <b className="text-gold">${Math.round(490 / students * 100) / 100}/student/year</b> with webhooks, API and priority support.</>}
        {recommendedId === 'enterprise' && !overCap && <>Over 750 students — <b className="text-white">Enterprise</b> unlocks unlimited providers, SLA, and audit exports for <b className="text-gold">${Math.round(1490 / students * 100) / 100}/student/year</b>.</>}
        {overCap && <>Over 3,000 students? <b className="text-white">License plans</b> work out cheaper — break-even in 2–3 years plus you own the software.</>}
      </p>
    </div>

    {/* Plan cards */}
    <div className="grid md:grid-cols-3 gap-5">
      {PLANS.map((p, i) => {
        const price = billing === 'monthly' ? p.monthly : Math.round(p.yearly / 12);
        const yearly = p.yearly;
        const savings = p.monthly * 12 - p.yearly;
        const isRecommended = p.id === recommendedId && !overCap;
        // Merge "popular" styling (original Pro highlight) with dynamic
        // slider-driven "recommended" so the card lights up contextually.
        const highlight = p.popular || isRecommended;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className={`relative rounded-2xl p-6 lg:p-7 h-full transition-all duration-300 ${
              highlight
                ? 'bg-gradient-to-br from-navy via-navy to-navy-950 text-white border-2 border-royal shadow-2xl shadow-royal/25 md:scale-[1.04]'
                : 'bg-white text-navy border border-slate-200 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-royal text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                <Sparkles className="w-3 h-3" /> {isRecommended ? 'Recommended' : 'Most Popular'}
              </div>
            )}

            <div className="mb-1">
              <h3 className={`font-display text-2xl font-bold ${highlight ? 'text-white' : 'text-navy'}`}>{p.name}</h3>
            </div>
            <p className={`text-[13px] mb-5 ${highlight ? 'text-slate-300' : 'text-slate-600'}`}>{p.tag}</p>

            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${p.id}-${billing}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-5xl font-bold"
                >
                  ${price}
                </motion.span>
              </AnimatePresence>
              <span className={highlight ? 'text-slate-400' : 'text-slate-500'}>/month</span>
            </div>

            <div className={`mt-2 inline-flex items-center gap-2 text-[12px] ${highlight ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className={highlight ? 'text-royal-300 font-semibold' : 'text-royal font-semibold'}>${yearly}</span>
              <span>/year</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                highlight ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>Save ${savings}</span>
            </div>

            <div className={`my-5 h-px ${highlight ? 'bg-white/10' : 'bg-slate-100'}`} />

            <ul className="space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className={`flex items-start gap-2 text-[13.5px] ${highlight ? 'text-slate-200' : 'text-slate-700'}`}>
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-royal-300' : 'text-royal'}`} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className={`w-full mt-6 font-semibold ${
                highlight
                  ? 'bg-royal hover:bg-royal-700 text-white'
                  : 'bg-white hover:bg-royal hover:text-white border-2 border-royal text-royal'
              }`}
              onClick={onStart}
            >
              Start Free Trial
            </Button>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
  );
};

/* ═══ MODEL 3: LICENSE ═══════════════════════════════════════════════════ */
type License = {
  id: string;
  name: string;
  price?: number;
  priceText?: string;
  extra?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

// License tiers are FLAT one-off purchases — no annual maintenance fee.
// What's included: perpetual use, all core features, 1 year of free updates,
// 1 year of email/priority support. No recurring billing.
const LICENSES: License[] = [
  { id: '1',     name: '1 School',      price: 6000,  features: ['Self-hosted deployment', 'All core features', '1 year of free updates', 'Email support (1 yr)'], cta: 'Get License' },
  { id: '2',     name: '2 Schools',     price: 9000,  features: ['All 1-School features', 'Manage 2 schools', '1 year of free updates', 'Email support (1 yr)'], cta: 'Get License' },
  { id: '3-5',   name: '3 – 5 Schools', price: 16000, features: ['All 1-School features', 'Manage 3–5 schools', '1 year of free updates', 'Email support (1 yr)'], cta: 'Get License' },
  { id: '5-10',  name: '5 – 10 Schools',price: 25000, features: ['All 1-School features', 'Manage 5–10 schools', '1 year of free updates', 'Priority support (1 yr)'], cta: 'Get License' },
  { id: '10p',   name: '10+ Schools',   priceText: 'Contact', extra: 'our team for custom pricing', features: ['Custom deployments', 'Volume discounts', 'Dedicated support', 'SLA & Onboarding'], cta: 'Contact Sales', highlight: true }
];

const LicensePanel: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25 }}
    className="rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-900/5 p-6 md:p-10"
  >
    <div className="mb-8">
      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-royal mb-2">
        <div className="w-6 h-6 rounded-md bg-royal/10 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5" />
        </div>
        License plans (one-time)
      </div>
      <p className="text-slate-600 text-sm">
        Run SchoolPay on your own infrastructure. <span className="font-semibold text-navy">Flat one-off fee — no annual maintenance, no recurring charges.</span>
      </p>
    </div>

    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
      {LICENSES.map((l, i) => (
        <motion.div
          key={l.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`relative rounded-2xl p-5 h-full transition-all duration-300 ${
            l.highlight
              ? 'bg-gradient-to-br from-royal/5 to-royal/10 border-2 border-royal/40 shadow-xl shadow-royal/10'
              : 'bg-white border border-slate-200 hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          <h4 className="font-display text-lg font-bold text-navy">{l.name}</h4>

          {l.price !== undefined ? (
            <>
              <div className="mt-3 font-display text-3xl font-bold text-navy">
                ${l.price.toLocaleString()}
              </div>
              <div className="text-[12px] text-slate-500">one-time</div>
            </>
          ) : (
            <>
              <div className="mt-3">
                <Server className="w-7 h-7 text-royal" />
              </div>
              <div className="mt-2 text-[13px] text-slate-700 leading-snug">
                <div className="font-semibold">Contact our team for</div>
                <div>custom pricing</div>
              </div>
            </>
          )}

          <ul className="mt-5 space-y-2">
            {l.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-royal" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            className={`w-full mt-5 text-[13px] font-semibold ${
              l.highlight
                ? 'bg-royal hover:bg-royal-700 text-white'
                : 'bg-white hover:bg-royal hover:text-white border-2 border-royal text-royal'
            }`}
            onClick={l.highlight ? onStart : onStart}
          >
            {l.cta}
          </Button>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const Pricing: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <PricingInner />
  </SiteLayoutWithAuthCtx>
);

export default Pricing;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowRight, CheckCircle2, Clock, Copy, Smartphone, Sparkles, ShieldCheck,
  GraduationCap, RefreshCw
} from 'lucide-react';

/**
 * Subscribe flow — step 1: pick plan + billing period.
 * Step 2: see payment instructions (corporate MoMo number + reference code).
 *
 * No payment is collected in-app. We instruct the school to send via MoMo;
 * the inbound webhook on our billing tenant does the crediting.
 */

const CORPORATE_MOMO_MTN = '+237 680 688 123';
const CORPORATE_MOMO_ORANGE = '+237 6XX XXX XXX (coming soon)';

// Local currencies we quote in. Sorted by likely user base; pre-select by
// the school's country if we add country detection later.
const SUPPORTED_CURRENCIES: { code: string; label: string }[] = [
  { code: 'XAF', label: 'Central African CFA (XAF)' },
  { code: 'XOF', label: 'West African CFA (XOF)' },
  { code: 'NGN', label: 'Nigerian naira (NGN)' },
  { code: 'GHS', label: 'Ghanaian cedi (GHS)' },
  { code: 'KES', label: 'Kenyan shilling (KES)' },
  { code: 'UGX', label: 'Ugandan shilling (UGX)' },
  { code: 'TZS', label: 'Tanzanian shilling (TZS)' },
  { code: 'RWF', label: 'Rwandan franc (RWF)' },
  { code: 'ZAR', label: 'South African rand (ZAR)' },
  { code: 'USD', label: 'United States dollar (USD)' }
];

type Step = 'choose' | 'instructions';

const Subscribe: React.FC = () => {
  const { user, school, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('choose');
  const [catalog, setCatalog] = useState<Record<string, { monthly_cents: number; yearly_cents: number }>>({});
  const [plan, setPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<string>('XAF');
  const [fx, setFx] = useState<null | { usd_display: string; local_display: string; rate: number; local_amount: number }>(null);
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<null | {
    id: string;
    reference: string;
    amount_cents: number;
    expires_at: string;
    plan: string | null;
    billing_period: string | null;
  }>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    Api.billingCatalog().then((r) => setCatalog(r.plans)).catch(() => {});
  }, []);

  const price = catalog[plan]
    ? billing === 'monthly' ? catalog[plan].monthly_cents : catalog[plan].yearly_cents
    : 0;

  // Live FX quote: refresh whenever plan/billing/currency change.
  useEffect(() => {
    if (!price) { setFx(null); return; }
    if (currency === 'USD') { setFx(null); return; }
    Api.fxQuote({ to: currency, usdCents: price })
      .then((q) => setFx({ usd_display: q.usd_display, local_display: q.local_display, rate: q.rate, local_amount: q.local_amount }))
      .catch(() => setFx(null));
  }, [price, currency]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await Api.createBillingIntent({
        intent_type: 'subscription',
        plan,
        billing_period: billing,
        // Include the FX-converted local amount so the server stores what
        // the school actually sees on-screen. Payment tolerance is ±5%.
        local_amount: fx ? fx.local_amount : undefined,
        local_currency: currency !== 'USD' ? currency : undefined
      });
      setIntent(r.intent);
      setStep('instructions');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast({ title: 'Could not start checkout', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: `${label} copied` }));
  };

  if (loading || !user || !school) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Slim header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal to-royal-700 flex items-center justify-center shadow-md shadow-royal/40 ring-1 ring-white/10">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-navy">SchoolPay</span>
          </Link>
          <div className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-navy">{school.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {step === 'choose' && (
          <ChooseStep
            plan={plan} setPlan={setPlan}
            billing={billing} setBilling={setBilling}
            currency={currency} setCurrency={setCurrency}
            fx={fx}
            catalog={catalog}
            submitting={submitting}
            onSubmit={submit}
          />
        )}

        {step === 'instructions' && intent && (
          <InstructionsStep
            intent={intent}
            plan={plan}
            billing={billing}
            price={price}
            fx={fx}
            currency={currency}
            onCopy={copy}
            onBack={() => setStep('choose')}
          />
        )}
      </main>
    </div>
  );
};

/* ─── Step 1: plan picker ─────────────────────────────────────────── */
const ChooseStep: React.FC<{
  plan: 'basic' | 'pro' | 'enterprise';
  setPlan: (p: 'basic' | 'pro' | 'enterprise') => void;
  billing: 'monthly' | 'yearly';
  setBilling: (b: 'monthly' | 'yearly') => void;
  currency: string;
  setCurrency: (c: string) => void;
  fx: null | { usd_display: string; local_display: string; rate: number; local_amount: number };
  catalog: Record<string, { monthly_cents: number; yearly_cents: number }>;
  submitting: boolean;
  onSubmit: () => void;
}> = ({ plan, setPlan, billing, setBilling, currency, setCurrency, fx, catalog, submitting, onSubmit }) => {
  const plans: Array<{ id: 'basic' | 'pro' | 'enterprise'; name: string; tag: string; popular?: boolean }> = [
    { id: 'basic',      name: 'Basic',      tag: 'Up to 150 students' },
    { id: 'pro',        name: 'Pro',        tag: 'Up to 750 students', popular: true },
    { id: 'enterprise', name: 'Enterprise', tag: 'Up to 3,000 students' }
  ];

  const priceOf = (id: 'basic' | 'pro' | 'enterprise') =>
    catalog[id] ? (billing === 'monthly' ? catalog[id].monthly_cents : catalog[id].yearly_cents) : null;

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal/10 border border-royal/20 text-royal text-[11px] font-bold uppercase tracking-[0.18em] mb-4">
          Subscribe
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">
          Pick a plan, pay via Mobile Money
        </h1>
        <p className="mt-3 text-slate-600">
          We'll give you a permanent reference code. Send the amount to our corporate MoMo number with that
          code as the memo — your subscription activates automatically.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="relative flex items-center rounded-full bg-slate-100 p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`relative z-10 px-4 py-2 text-[13px] font-semibold rounded-full transition-colors ${
              billing === 'monthly' ? 'text-navy' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`relative z-10 px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
              billing === 'yearly' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Yearly
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>2 months free</span>
          </button>
          <span
            className={`absolute inset-y-1 rounded-full bg-royal shadow transition-all ${
              billing === 'monthly' ? 'left-1 right-[60%]' : 'left-[35%] right-1'
            }`}
          />
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-8">
        {plans.map((p) => {
          const cents = priceOf(p.id);
          const selected = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={`text-left rounded-2xl p-6 transition-all duration-300 ${
                selected
                  ? 'bg-navy text-white border-2 border-royal shadow-2xl shadow-royal/25 scale-[1.02]'
                  : 'bg-white text-navy border border-slate-200 hover:border-royal/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${selected ? 'text-gold' : 'text-royal'}`}>
                  {p.name}
                </div>
                {p.popular && (
                  <Badge className={`text-[9px] ${selected ? 'bg-gold/20 text-gold border-gold/40' : 'bg-slate-100 text-slate-700'}`}>
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Most popular
                  </Badge>
                )}
              </div>
              <div className={`text-[12px] mb-4 ${selected ? 'text-slate-300' : 'text-slate-600'}`}>{p.tag}</div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">
                  {cents != null ? `$${cents / 100}` : '—'}
                </span>
                <span className={`text-sm ${selected ? 'text-slate-400' : 'text-slate-500'}`}>
                  /{billing === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-[13px] ${selected ? 'text-gold' : 'text-slate-400'}`}>
                {selected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                {selected ? 'Selected' : 'Click to select'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Currency selector + live FX preview */}
      <div className="max-w-md mx-auto mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
          Pay in your currency
        </div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-navy"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>

        {currency !== 'USD' && fx && (
          <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500">You'll send approximately</div>
              <div className="font-display text-2xl font-bold text-navy mt-0.5">{fx.local_display}</div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div>= {fx.usd_display}</div>
              <div className="mt-0.5">1 USD ≈ {fx.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}</div>
            </div>
          </div>
        )}
        {currency !== 'USD' && !fx && (
          <div className="mt-3 text-[11px] text-slate-500">Loading today's rate…</div>
        )}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="bg-royal hover:bg-royal-700 text-white font-semibold"
          disabled={submitting || !catalog[plan]}
          onClick={onSubmit}
        >
          {submitting ? 'Preparing checkout…' : <>Continue to payment <ArrowRight className="w-4 h-4 ml-1.5" /></>}
        </Button>
      </div>
    </div>
  );
};

/* ─── Step 2: payment instructions ────────────────────────────────── */
const InstructionsStep: React.FC<{
  intent: { id: string; reference: string; amount_cents: number; expires_at: string; plan: string | null; billing_period: string | null };
  plan: string;
  billing: string;
  price: number;
  fx: null | { usd_display: string; local_display: string; rate: number; local_amount: number };
  currency: string;
  onCopy: (text: string, label: string) => void;
  onBack: () => void;
}> = ({ intent, fx, currency, onCopy, onBack }) => {
  const usd = (intent.amount_cents / 100).toFixed(2);
  const showLocal = currency !== 'USD' && fx;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-gold-600 text-[11px] font-bold uppercase tracking-[0.18em] mb-4">
          <Clock className="w-3 h-3" /> Awaiting payment
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy tracking-tight">
          Send <span className="text-royal">${usd}</span> via Mobile Money
        </h1>
        <p className="mt-3 text-slate-600">
          Use your phone's mobile-money menu. Once we receive it, your {intent.plan} plan activates automatically.
        </p>
      </div>

      <Card className="p-0 shadow-xl border-slate-200 overflow-hidden">
        {/* Step rows */}
        <Step n={1} title="Open your MTN MoMo menu">
          Dial <code className="font-mono text-navy bg-slate-100 px-1.5 py-0.5 rounded">*126#</code> (Cameroon) or open the MoMo app.
        </Step>

        <Step n={2} title="Send money to our corporate number">
          <div className="mt-2 flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-royal" />
              <span className="font-mono font-semibold text-navy">{CORPORATE_MOMO_MTN}</span>
            </div>
            <button
              onClick={() => onCopy(CORPORATE_MOMO_MTN, 'Number')}
              className="text-royal hover:underline text-sm font-medium inline-flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Orange Money: {CORPORATE_MOMO_ORANGE}</div>
        </Step>

        <Step n={3} title={showLocal ? `Enter the amount: ${fx!.local_display}` : `Enter the amount: $${usd}`}>
          <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
            {showLocal ? (
              <>
                Send <b>{fx!.local_display}</b> (≈ ${usd} USD at today's rate of
                1 USD ≈ {fx!.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}).
                Any amount within ±5% of this will be accepted — FX fluctuations don't trip the credit flow.
              </>
            ) : (
              <>
                Send <b>${usd} USD</b>, or the equivalent in your local currency at today's rate.
                Any amount within ±5% of the USD target is fine.
              </>
            )}
          </div>
        </Step>

        <Step n={4} title="Add your reference in the memo" highlight>
          <div className="mt-2 flex items-center justify-between gap-3 p-4 rounded-lg bg-navy text-white">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gold font-bold">Reference (memo)</div>
              <div className="font-mono font-bold text-2xl tracking-wider mt-0.5">{intent.reference}</div>
            </div>
            <button
              onClick={() => onCopy(intent.reference, 'Reference')}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div className="mt-2 text-[12px] text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Your permanent billing reference — reuse it for any future top-up.
          </div>
        </Step>

        <Step n={5} title="We credit you automatically">
          The moment the MoMo webhook lands on our side, we mark this payment as received,
          extend your subscription, and show it on your wallet ledger. No form to fill on this page.
        </Step>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Pick a different plan
        </Button>
        <Link to="/" className="text-sm text-royal hover:underline font-medium">
          Return to dashboard <ArrowRight className="inline w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      <div className="mt-8 text-center text-[12px] text-slate-500">
        Expires {new Date(intent.expires_at).toLocaleString()}. Didn't send yet?
        Come back anytime — the reference stays valid forever, only this specific intent times out.
      </div>
    </div>
  );
};

const Step: React.FC<{
  n: number;
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}> = ({ n, title, highlight, children }) => (
  <div className={`flex gap-4 p-5 md:p-6 border-b border-slate-100 last:border-b-0 ${highlight ? 'bg-gradient-to-r from-gold/5 to-transparent' : ''}`}>
    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
      highlight ? 'bg-gold text-navy' : 'bg-royal/10 text-royal'
    }`}>
      {n}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-navy text-[15px]">{title}</div>
      <div className="text-[14px] text-slate-600 leading-relaxed">{children}</div>
    </div>
  </div>
);

export default Subscribe;

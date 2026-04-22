import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Copy, CheckCircle2, ShieldAlert } from 'lucide-react';

export type AuthMode = 'login' | 'register' | null;

type Props = {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  defaultPlan?: string;
};

export const AuthDialogs: React.FC<Props> = ({ mode, setMode, defaultPlan = 'basic' }) => {
  const { login, register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<{
    schoolName: string; subdomain: string; email: string; phone: string;
    fullName: string; password: string;
    billingModel: 'prepaid' | 'postpaid' | 'license';
    plan: string;
    licenseTier: string;
  }>({
    schoolName: '', subdomain: '', email: '', phone: '',
    fullName: '', password: '',
    billingModel: 'postpaid',
    plan: defaultPlan,
    licenseTier: '1'
  });
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Capture the freshly-issued API key so we can show it in a dedicated
  // "save it now — we'll never show it again" dialog. null = dialog closed.
  const [issuedApiKey, setIssuedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setRegisterForm((f) => ({ ...f, plan: defaultPlan }));
  }, [defaultPlan]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (error) toast({ title: 'Login failed', description: error, variant: 'destructive' });
    else toast({ title: 'Welcome back' });
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error, apiKey } = await register(registerForm);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Registration failed', description: error, variant: 'destructive' });
      return;
    }
    // Close the register form, then pop the API-key dialog. We never see
    // this value again — backend only keeps a hash — so the dialog is
    // explicit, copy-only, and requires confirmation to dismiss.
    setMode(null);
    if (apiKey) setIssuedApiKey(apiKey);
    else toast({ title: 'School created', description: 'Welcome to SchoolPay.' });
  };

  const copyApiKey = () => {
    if (!issuedApiKey) return;
    navigator.clipboard.writeText(issuedApiKey).then(() => {
      setCopied(true);
      toast({ title: 'API key copied' });
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      <Dialog open={mode === 'login'} onOpenChange={(o) => setMode(o ? 'login' : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>Access your school's dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onLogin} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-blue-600 hover:underline" onClick={() => setMode('register')}>
                Register a school
              </button>
              <Link to="/forgot-password" className="text-slate-500 hover:text-slate-900">
                Forgot password?
              </Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === 'register'}
        onOpenChange={(o) => {
          setMode(o ? 'register' : null);
          if (o) setRegisterStep(1);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Register a school
              <span className="ml-auto text-[11px] font-normal text-slate-500">
                Step {registerStep} of 2
              </span>
            </DialogTitle>
            <DialogDescription>
              {registerStep === 1
                ? 'First, your school details. We\'ll pick a billing model next.'
                : 'Choose how you\'d like to pay. You can change this any time from Settings.'}
            </DialogDescription>
          </DialogHeader>

          {registerStep === 1 && (
            <form
              onSubmit={(e) => { e.preventDefault(); setRegisterStep(2); }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>School name</Label>
                  <Input value={registerForm.schoolName} onChange={(e) => setRegisterForm({ ...registerForm, schoolName: e.target.value })} required />
                </div>
                <div>
                  <Label>Subdomain / slug</Label>
                  <Input value={registerForm.subdomain} onChange={(e) => setRegisterForm({ ...registerForm, subdomain: e.target.value })} placeholder="greenwood" pattern="[a-z0-9][a-z0-9-]*" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact email</Label>
                  <Input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Admin full name</Label>
                <Input value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} required />
              </div>
              <div>
                <Label>Password (min 8 chars)</Label>
                <Input type="password" minLength={8} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full bg-royal hover:bg-royal-700 text-white">
                Continue to billing
              </Button>
              <div className="text-center text-sm">
                <button type="button" className="text-royal hover:underline" onClick={() => setMode('login')}>
                  Already have an account? Sign in.
                </button>
              </div>
            </form>
          )}

          {registerStep === 2 && (
            <form onSubmit={onRegister} className="space-y-4">
              {/* Top-level billing model picker */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'prepaid',  label: 'Prepaid',  sub: 'Pay per student' },
                  { id: 'postpaid', label: 'Postpaid', sub: 'Monthly plan' },
                  { id: 'license',  label: 'License',  sub: 'One-off buy' }
                ] as const).map((m) => {
                  const selected = registerForm.billingModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, billingModel: m.id })}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        selected ? 'border-royal bg-royal/5' : 'border-slate-200 bg-white hover:border-royal/40'
                      }`}
                    >
                      <div className={`text-[12px] font-bold uppercase tracking-wider ${selected ? 'text-royal' : 'text-navy'}`}>{m.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-choice for each model */}
              {registerForm.billingModel === 'prepaid' && (
                <div className="rounded-xl p-4 bg-royal/5 border border-royal/20 text-sm">
                  <div className="font-semibold text-navy mb-1">Pay per student, per year</div>
                  <div className="text-slate-600">
                    <b className="text-navy">$4/student</b> for your first 100 students,
                    <b className="text-navy"> $6/student</b> for students 101–150. No monthly commitment.
                    Your wallet is debited once at the start of each academic year.
                  </div>
                </div>
              )}

              {registerForm.billingModel === 'postpaid' && (
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-slate-500">Pick a tier</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'basic',      name: 'Basic',      price: '$19/mo',  tag: 'Up to 150'   },
                      { id: 'pro',        name: 'Pro',        price: '$49/mo',  tag: 'Up to 750'   },
                      { id: 'enterprise', name: 'Enterprise', price: '$149/mo', tag: 'Up to 3,000' }
                    ] as const).map((p) => {
                      const selected = registerForm.plan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, plan: p.id })}
                          className={`p-3 rounded-lg border text-left transition ${
                            selected ? 'border-royal bg-royal/5' : 'border-slate-200 bg-white hover:border-royal/40'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${selected ? 'text-royal' : 'text-navy'}`}>{p.name}</div>
                          <div className="font-display text-lg font-bold mt-0.5">{p.price}</div>
                          <div className="text-[10px] text-slate-500">{p.tag}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {registerForm.billingModel === 'license' && (
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-slate-500">Pick a license tier</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {([
                      { id: '1',    name: '1 school',    price: '$6,000'  },
                      { id: '2',    name: '2 schools',   price: '$9,000'  },
                      { id: '3-5',  name: '3–5 schools', price: '$16,000' },
                      { id: '5-10', name: '5–10 schools',price: '$25,000' }
                    ] as const).map((t) => {
                      const selected = registerForm.licenseTier === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, licenseTier: t.id })}
                          className={`p-3 rounded-lg border text-left transition ${
                            selected ? 'border-royal bg-royal/5' : 'border-slate-200 bg-white hover:border-royal/40'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${selected ? 'text-royal' : 'text-navy'}`}>{t.name}</div>
                          <div className="font-display text-base font-bold mt-0.5">{t.price}</div>
                          <div className="text-[10px] text-slate-500">one-time</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Need 10+ schools? <a href="mailto:sales@schoolpay.example" className="text-royal hover:underline font-semibold">Contact sales</a> instead.
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRegisterStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-[2] bg-royal hover:bg-royal-700 text-white" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create school'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/*
        One-time API key reveal. Shown right after successful registration.
        We only have the plaintext key in memory for this one moment — the
        server stores a SHA-256 hash and has no way to show it again.
        Dismiss requires the admin to click "I've saved it" so they can't
        accidentally miss it.
      */}
      <Dialog open={!!issuedApiKey} onOpenChange={(open) => { if (!open) setIssuedApiKey(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              School created · Save your API key
            </DialogTitle>
            <DialogDescription className="pt-2">
              Use this key for server-to-server integration (REST API, webhooks, widget.js).
              <b className="text-red-600"> This is the only time we'll show it.</b> If you lose
              it, rotate a fresh key from <span className="underline">Settings → API keys</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              Store this somewhere safe (password manager, CI secret, your backend's env file).
              Anyone with this key can verify payments on behalf of your school.
            </div>
          </div>

          <div className="mt-3 relative">
            <div className="p-4 pr-16 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[13px] break-all leading-relaxed">
              {issuedApiKey}
            </div>
            <button
              onClick={copyApiKey}
              className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15"
              aria-label="Copy API key"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <Button
            onClick={() => { setIssuedApiKey(null); toast({ title: 'Welcome to SchoolPay' }); }}
            className="w-full mt-4 bg-navy hover:bg-navy-800 text-white font-semibold"
          >
            I've saved it — continue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

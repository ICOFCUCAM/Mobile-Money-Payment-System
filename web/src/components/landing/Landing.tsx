import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  GraduationCap, CreditCard, ShieldCheck, Zap, Users, BarChart3, Webhook,
  CheckCircle2, ArrowRight, TrendingUp, Layers, Lock, Globe2
} from 'lucide-react';

type Mode = 'login' | 'register';

const features = [
  { icon: CreditCard, title: 'Multi-provider mobile money', body: 'MTN MoMo and Orange Money out of the box, with a pluggable provider interface for Airtel, Wave, M-Pesa, and more.' },
  { icon: ShieldCheck, title: 'Bank-grade security', body: 'Provider credentials encrypted at rest with AES-256-GCM. Bcrypt passwords. HMAC-verified webhooks. Full audit log.' },
  { icon: Users, title: 'Multi-tenant by design', body: "Every school is an isolated tenant: own students, own provider creds, own dashboard, own API key." },
  { icon: Zap, title: 'Refunds & reconciliation', body: 'Reverse a transaction with one click. A reconciliation worker catches up pending payments every few minutes.' },
  { icon: BarChart3, title: 'Reports + CSV export', body: 'Filter by status, provider, student. Export 10 000 rows at a time for accounting.' },
  { icon: Webhook, title: 'Webhook-first', body: "Providers push collections to a signed endpoint scoped to your school slug — we route, verify, and credit." },
];

const plans = [
  { id: 'basic', name: 'Basic', price: 10, features: ['MTN MoMo only', 'Up to 500 students', 'Email support'] },
  { id: 'pro', name: 'Pro', price: 25, popular: true, features: ['MTN + Orange', 'Up to 5 000 students', 'Reports + audit log', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: null as number | null, features: ['All providers', 'Unlimited students', 'Custom integrations', 'SLA + dedicated support'] },
];

const Landing: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    schoolName: '', subdomain: '', email: '', phone: '',
    fullName: '', password: '', plan: 'basic'
  });

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
    if (error) toast({ title: 'Registration failed', description: error, variant: 'destructive' });
    else toast({
      title: 'School created',
      description: apiKey ? `API key: ${apiKey.slice(0, 14)}… — save it from Settings.` : 'Welcome to SchoolPay.'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">SchoolPay</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium">SaaS</Badge>
          </div>
          <div className="hidden md:flex items-center gap-9 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#providers" className="hover:text-slate-900">Providers</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#architecture" className="hover:text-slate-900">Architecture</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setMode('login')}>Sign In</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setMode('register')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium mb-6">
              Multi-Tenant Fintech Infrastructure
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              School Payments,<br />
              <span className="text-blue-600">Unified &<br />Automated.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
              The complete SaaS platform for schools to accept mobile money
              payments from MTN, Orange, and Airtel — with automatic verification,
              student credit, and real-time dashboards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => setMode('register')}>
                Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode('login')}>
                View Demo Dashboard
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup in minutes</span>
            </div>
          </div>

          {/* Dashboard preview card */}
          <Card className="p-6 shadow-2xl border-slate-100 bg-white">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-xs text-slate-500">Total Revenue</div>
                <div className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">1,335,000 XAF</div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <TrendingUp className="w-3 h-3 mr-1" /> +24.5%
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <div className="text-[11px] text-yellow-700 font-medium">MTN MoMo</div>
                <div className="font-bold text-slate-900 mt-0.5">540K</div>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-[11px] text-orange-700 font-medium">Orange</div>
                <div className="font-bold text-slate-900 mt-0.5">660K</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-600 font-medium">Pending</div>
                <div className="font-bold text-slate-900 mt-0.5">80K</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { initial: 'A', grad: 'from-blue-400 to-indigo-500', name: 'Amina Nkomo', id: 'STU001', amount: '45,000 XAF', status: 'verified', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { initial: 'K', grad: 'from-emerald-400 to-teal-500', name: 'Kwame Mensah', id: 'STU002', amount: '150,000 XAF', status: 'verified', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { initial: 'Z', grad: 'from-purple-400 to-pink-500', name: 'Zainab Hassan', id: 'STU003', amount: '30,000 XAF', status: 'pending', statusClass: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${r.grad} flex items-center justify-center text-white font-bold text-sm`}>
                      {r.initial}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 text-sm">{r.amount}</div>
                    <Badge variant="outline" className={`${r.statusClass} text-[10px] mt-1 hover:bg-inherit`}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-slate-950 text-white py-14">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '500+', label: 'Schools onboarded' },
            { num: '2.4M+', label: 'Students managed' },
            { num: '$18M+', label: 'Payments processed' },
            { num: '99.9%', label: 'Uptime SLA' }
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{s.num}</div>
              <div className="text-sm text-slate-400 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything a school bursar needs.</h2>
          <p className="mt-3 text-slate-600">Receipt verification, refunds, reports — already built, already tested.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="p-6 hover:shadow-md transition-shadow border-slate-100">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Every provider your parents use.</h2>
            <p className="mt-3 text-slate-600">Pluggable integrations so new providers drop in without touching app code.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'MTN Mobile Money', grad: 'from-yellow-400 to-yellow-600', desc: '17 African countries. Sandbox + production out of the box.' },
              { name: 'Orange Money', grad: 'from-orange-400 to-orange-600', desc: 'West & Central Africa. WebPay + cash-in APIs.' },
              { name: 'Airtel Money', grad: 'from-red-400 to-red-600', desc: 'East & Southern Africa. Roadmap — integration ships Q2.' }
            ].map((p) => (
              <Card key={p.name} className="p-6 bg-white border-slate-100">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${p.grad} flex items-center justify-center mb-4`}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-600 mt-1.5">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Simple, transparent pricing.</h2>
          <p className="mt-3 text-slate-600">Flat monthly fee per school. No per-transaction markup.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((p) => (
            <Card key={p.id} className={`p-6 relative ${p.popular ? 'ring-2 ring-blue-600 shadow-lg' : 'border-slate-100'}`}>
              {p.popular && (
                <Badge className="absolute -top-3 left-6 bg-blue-600">Most popular</Badge>
              )}
              <h3 className="text-xl font-bold text-slate-900 capitalize">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{p.price == null ? 'Custom' : `$${p.price}`}</span>
                {p.price != null && <span className="text-slate-500">/month</span>}
              </div>
              <ul className="mt-5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-6 ${p.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                variant={p.popular ? 'default' : 'outline'}
                onClick={() => {
                  setRegisterForm((f) => ({ ...f, plan: p.id }));
                  setMode('register');
                }}
              >
                {p.price == null ? 'Contact sales' : 'Get started'}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Architecture you can verify.</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">No black boxes. Multi-tenant from the schema up. Auditable end-to-end.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Layers, title: 'Multi-tenant Postgres', body: 'Every row carries a `school_id`. Middleware enforces tenant scope on every query. Cross-tenant leaks are structurally impossible.' },
              { icon: Lock, title: 'AES-256-GCM at rest', body: 'Provider API keys never touch the client; only their SHA-256 hash and encrypted ciphertext are stored.' },
              { icon: Globe2, title: 'Deployed on Vercel', body: 'Vite frontend on the CDN; Express serverless function handles /api/* and /webhooks/*. Zero-ops from push to prod.' }
            ].map((a) => (
              <div key={a.title} className="p-6 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1.5">{a.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to collect fees over mobile money?</h2>
          <p className="mt-3 text-blue-100">Register your school in under a minute. The first 14 days are on us.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => setMode('register')}>
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setMode('login')}>
              Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} SchoolPay. Multi-tenant mobile-money SaaS.</div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#architecture" className="hover:text-slate-900">Architecture</a>
          </div>
        </div>
      </footer>

      {/* Login dialog */}
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

      {/* Register dialog */}
      <Dialog open={mode === 'register'} onOpenChange={(o) => setMode(o ? 'register' : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register a school</DialogTitle>
            <DialogDescription>Each school is an isolated tenant with its own students, configs and dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onRegister} className="space-y-3">
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
            <div>
              <Label>Plan</Label>
              <Select value={registerForm.plan} onValueChange={(v) => setRegisterForm({ ...registerForm, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic — MTN only ($10/mo)</SelectItem>
                  <SelectItem value="pro">Pro — MTN + Orange ($25/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise — custom quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create school'}
            </Button>
            <div className="text-center text-sm">
              <button type="button" className="text-blue-600 hover:underline" onClick={() => setMode('login')}>
                Already have an account? Sign in.
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;

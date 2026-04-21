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
  GraduationCap, CreditCard, Lock, Zap, BarChart3, Users, ShieldCheck,
  Webhook, CheckCircle2, ArrowRight, Globe
} from 'lucide-react';

type Mode = 'login' | 'register';

const features = [
  {
    icon: CreditCard,
    title: 'Multi-provider mobile money',
    body: 'MTN MoMo and Orange Money out of the box, with a pluggable provider interface for Airtel, Wave, M-Pesa, and more.'
  },
  {
    icon: ShieldCheck,
    title: 'Bank-grade security',
    body: 'Provider credentials encrypted at rest with AES-256-GCM. Bcrypt passwords. HMAC-verified webhooks. Full audit log.'
  },
  {
    icon: Users,
    title: 'Multi-tenant by design',
    body: 'Every school is an isolated tenant: own students, own provider creds, own dashboard, own API key.'
  },
  {
    icon: Zap,
    title: 'Refunds & reconciliation',
    body: 'Reverse a transaction with one click. A reconciliation worker catches up pending payments every few minutes.'
  },
  {
    icon: BarChart3,
    title: 'Reports + CSV export',
    body: 'Filter by status, provider, student. Export 10 000 rows at a time for accounting.'
  },
  {
    icon: Webhook,
    title: 'Webhook-first',
    body: 'Providers push collections to a signed endpoint scoped to your school slug — we route, verify, and credit.'
  }
];

const plans = [
  {
    id: 'basic', name: 'Basic', price: 10, interval: 'month',
    features: ['MTN MoMo only', 'Up to 500 students', 'Email support']
  },
  {
    id: 'pro', name: 'Pro', price: 25, interval: 'month', popular: true,
    features: ['MTN + Orange', 'Up to 5 000 students', 'Reports + audit log', 'Priority support']
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, interval: '',
    features: ['All providers', 'Unlimited students', 'Custom integrations', 'SLA + dedicated support']
  }
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
    const { error } = await register(registerForm);
    setSubmitting(false);
    if (error) toast({ title: 'Registration failed', description: error, variant: 'destructive' });
    else toast({ title: 'School created', description: 'Welcome to SchoolPay.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900">SchoolPay</div>
              <div className="text-xs text-slate-500 -mt-0.5">Mobile-money SaaS for schools</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setMode('login')}>Sign in</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setMode('register')}>
              Register a school
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <Badge variant="outline" className="mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Now accepting MTN MoMo + Orange Money
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Fee collection for schools,<br />
          powered by <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">mobile money</span>.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          A multi-tenant SaaS that lets every school accept tuition over MTN MoMo,
          Orange Money and more — with verification, reconciliation, refunds and
          audit logging baked in.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => setMode('register')}>
            Register your school <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => setMode('login')}>
            Sign in
          </Button>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> AES-256-GCM</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Bcrypt + JWT</span>
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Deployed on Vercel</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> CI-tested</span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Everything a school bursar needs.</h2>
          <p className="mt-2 text-slate-600">Receipt verification, refunds, reports — already built, already tested.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Simple, transparent pricing.</h2>
          <p className="mt-2 text-slate-600">Pay a flat monthly fee per school. No per-transaction markup.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <Card key={p.id} className={`p-6 relative ${p.popular ? 'ring-2 ring-blue-600 shadow-lg' : ''}`}>
              {p.popular && (
                <Badge className="absolute -top-3 left-6 bg-blue-600">Most popular</Badge>
              )}
              <h3 className="text-xl font-bold text-slate-900 capitalize">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {p.price == null ? 'Custom' : `$${p.price}`}
                </span>
                {p.price != null && <span className="text-slate-500">/{p.interval}</span>}
              </div>
              <ul className="mt-5 space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    {f}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} SchoolPay. Multi-tenant mobile-money SaaS.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-700">Docs</a>
            <a href="#" className="hover:text-slate-700">API</a>
            <a href="#" className="hover:text-slate-700">Status</a>
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

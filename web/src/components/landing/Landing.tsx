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
  CheckCircle2, ArrowRight, TrendingUp, Layers, Lock, Globe2, KeyRound
} from 'lucide-react';

type Mode = 'login' | 'register';

/** The eight cards shown under "Everything your school needs". */
const coreFeatures = [
  { icon: Layers,       title: 'Multi-Tenant Architecture', body: 'Each school gets isolated data, custom subdomain, and dedicated configuration.' },
  { icon: CreditCard,   title: 'Multi-Provider Payments',   body: 'Accept MTN MoMo, Orange Money, Airtel Money through one unified API.' },
  { icon: ShieldCheck,  title: 'Bank-Grade Security',        body: 'AES-256 encryption for API keys, role-based access, and full audit trails.' },
  { icon: Zap,          title: 'Instant Verification',       body: 'Sub-second payment verification with automatic duplicate detection.' },
  { icon: Webhook,      title: 'Webhook Automation',         body: 'Auto-route incoming payments to the correct school and student.' },
  { icon: BarChart3,    title: 'Real-Time Analytics',        body: 'Track revenue, balances, and provider health in beautiful dashboards.' },
  { icon: KeyRound,     title: 'Role-Based Access',          body: 'Separate permissions for admins, bursars, and auditors.' },
  { icon: Globe2,       title: 'Pan-African Ready',          body: 'Works across Cameroon, Nigeria, Ghana, Kenya, Senegal and more.' },
];

const providers = [
  { name: 'MTN Mobile Money', users: '280M users', blurb: 'Accept payments from MTN MoMo subscribers across 17 countries.', grad: 'from-yellow-400 to-orange-500' },
  { name: 'Orange Money',     users: '70M users',  blurb: 'Seamless integration with Orange Money across West & Central Africa.', grad: 'from-orange-400 to-orange-600' },
  { name: 'Airtel Money',     users: '27M users',  blurb: 'Airtel Money support for East & Southern Africa markets.', grad: 'from-red-400 to-red-600' },
];

const plans = [
  {
    id: 'basic', name: 'Basic', price: 10,
    features: ['1 Payment Provider', 'Up to 100 students', 'Basic Dashboard', 'Email Support']
  },
  {
    id: 'pro', name: 'Pro', price: 25, popular: true,
    features: ['3 Payment Providers', 'Up to 1,000 students', 'Advanced Analytics', 'Priority Support', 'CSV Import/Export', 'Webhooks']
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 99,
    features: ['Unlimited Providers', 'Unlimited Students', 'White-Label Branding', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee', 'Audit Logs']
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
    const { error, apiKey } = await register(registerForm);
    setSubmitting(false);
    if (error) toast({ title: 'Registration failed', description: error, variant: 'destructive' });
    else toast({
      title: 'School created',
      description: apiKey ? `API key: ${apiKey.slice(0, 14)}… — save it from Settings.` : 'Welcome to SchoolPay.'
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SchoolPay</span>
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
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
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

          {/* Dashboard preview */}
          <Card className="p-6 shadow-2xl border-slate-100">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-xs text-slate-500">Total Revenue</div>
                <div className="text-3xl font-bold mt-1 tracking-tight">1,335,000 XAF</div>
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
          </Card>
        </div>
      </section>

      {/* Stats strip — light, blue numbers */}
      <section className="border-y border-slate-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '500+',  label: 'Schools Onboarded' },
            { num: '2.4M+', label: 'Transactions Processed' },
            { num: '$18M+', label: 'Volume Managed' },
            { num: '99.9%', label: 'Uptime SLA' }
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">{s.num}</div>
              <div className="text-sm text-slate-500 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core features — 8 cards, 4×2 */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">Core Features</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Everything your school needs</h2>
            <p className="mt-3 text-slate-600">From student management to payment reconciliation, built for scale and security.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreFeatures.map((f) => (
              <Card key={f.title} className="p-5 bg-white border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">Integrated Providers</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Accept payments from every major network</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {providers.map((p) => (
              <Card key={p.name} className="p-6 border-slate-100">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.grad} flex items-center justify-center mb-4`}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="text-sm text-slate-500 mt-0.5">{p.users}</div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{p.blurb}</p>
                <div className="mt-5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Ready to integrate
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture (dark) */}
      <section id="architecture" className="bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-blue-950 text-blue-300 border-blue-900 mb-3">Architecture</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Built for multi-tenant scale</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Production-grade architecture with tenant isolation, encrypted credentials, and horizontal scaling.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold">Tenant Isolation</h3>
              </div>
              <pre className="bg-black/40 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
{`// Every query is scoped by school_id
db.query(
  \`SELECT * FROM students
   WHERE school_id = $1\`,
  [req.school.id]
); // ← isolated`}
              </pre>
            </div>
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-semibold">Provider Abstraction</h3>
              </div>
              <pre className="bg-black/40 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
{`class BaseProvider {
  async verifyTransaction(externalId) {...}
}
class MTNProvider    extends BaseProvider {...}
class OrangeProvider extends BaseProvider {...}
// dynamic dispatch per school config`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (dark) */}
      <section id="pricing" className="bg-slate-950 text-white pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-blue-950 text-blue-300 border-blue-900 mb-3">Simple Pricing</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Choose your plan</h2>
            <p className="mt-3 text-slate-400">All plans include 14-day free trial. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((p) => (
              <Card
                key={p.id}
                className={`p-6 bg-slate-900 text-white border-slate-800 relative ${p.popular ? 'ring-2 ring-blue-500 shadow-xl md:scale-[1.03]' : ''}`}
              >
                {p.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">${p.price}</span>
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
                  className={`w-full mt-7 ${p.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-100 text-slate-900 hover:bg-white'}`}
                  onClick={() => {
                    setRegisterForm((f) => ({ ...f, plan: p.id }));
                    setMode('register');
                  }}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to modernize your school payments?</h2>
          <p className="mt-3 text-blue-100">Join 500+ schools across Africa already using SchoolPay.</p>
          <div className="mt-8">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" onClick={() => setMode('register')}>
              Start Your Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer (dark) */}
      <footer className="bg-slate-950 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">SchoolPay</span>
            </div>
            <p className="text-sm leading-relaxed">The leading multi-tenant mobile-money payment platform for schools across Africa.</p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#providers" className="hover:text-white">Integrations</a></li>
              <li><a href="#" className="hover:text-white">API Docs</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Company</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Press</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Resources</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">Support</a></li>
              <li><a href="#" className="hover:text-white">Status</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div>© {new Date().getFullYear()} SchoolPay SaaS. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Cookies</a>
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
                  <SelectItem value="basic">Basic — $10/mo</SelectItem>
                  <SelectItem value="pro">Pro — $25/mo</SelectItem>
                  <SelectItem value="enterprise">Enterprise — $99/mo</SelectItem>
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

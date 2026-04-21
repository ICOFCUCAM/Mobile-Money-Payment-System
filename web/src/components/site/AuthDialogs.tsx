import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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
  const [registerForm, setRegisterForm] = useState({
    schoolName: '', subdomain: '', email: '', phone: '',
    fullName: '', password: '', plan: defaultPlan
  });

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
    if (error) toast({ title: 'Registration failed', description: error, variant: 'destructive' });
    else toast({
      title: 'School created',
      description: apiKey ? `API key: ${apiKey.slice(0, 14)}… — save it from Settings.` : 'Welcome to SchoolPay.'
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
    </>
  );
};

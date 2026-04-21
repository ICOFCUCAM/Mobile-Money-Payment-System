import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [form, setForm] = useState({ email: '', schoolSlug: '' });
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await Api.requestPasswordReset({
        email: form.email,
        ...(form.schoolSlug ? { schoolSlug: form.schoolSlug } : {})
      });
      setSubmitted(true);
      // In dev the backend can return the reset token directly when
      // PASSWORD_RESET_EXPOSE_TOKEN=1 is set. Surface it so a dev can click
      // through without wiring a real mailer.
      if (res && (res as any).token) setDevToken((res as any).token);
    } catch (err: any) {
      toast({ title: 'Request failed', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to landing
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot password?</h1>
        <p className="text-sm text-slate-600 mb-6">
          Enter your email. If an account exists, we'll issue a reset token that's valid for 1 hour.
          The response is identical whether or not an account exists — we don't leak which emails are registered.
        </p>
        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
              If the account exists, a reset link has been issued. Check your email.
            </div>
            {devToken && (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs">
                <div className="font-semibold text-amber-900 mb-1">Dev mode: server returned the reset token directly.</div>
                <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`} className="text-blue-600 hover:underline">
                  Open the reset link →
                </Link>
                <pre className="mt-2 bg-white/50 p-2 rounded overflow-x-auto">{devToken}</pre>
              </div>
            )}
            <Link to="/" className="text-sm text-blue-600 hover:underline">← Back</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>School slug (optional)</Label>
              <Input value={form.schoolSlug} onChange={(e) => setForm({ ...form, schoolSlug: e.target.value })} placeholder="only needed if your email belongs to multiple schools" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              <Mail className="w-4 h-4 mr-2" /> {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { checkPassword } from '@/lib/passwordPolicy';

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = params.get('token') || '';
  const [form, setForm] = useState({ token: initialToken, newPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const pwCheck = checkPassword(form.newPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwCheck.ok) {
      toast({ title: 'Password not strong enough', description: pwCheck.reason, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await Api.resetPassword(form);
      toast({ title: 'Password updated', description: 'Please sign in with your new password.' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Reset failed', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to landing
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset password</h1>
        <p className="text-sm text-slate-600 mb-6">Enter the token you received and choose a new password. Tokens are single-use and expire after an hour.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Reset token</Label>
            <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} required />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" minLength={10} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
            {form.newPassword && !pwCheck.ok && (
              <p className="mt-1 text-xs text-red-600">{pwCheck.reason}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={submitting || !pwCheck.ok}
          >
            <KeyRound className="w-4 h-4 mr-2" /> {submitting ? 'Updating…' : 'Set new password'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;

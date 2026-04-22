import React, { useEffect, useState } from 'react';
import { Api, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, ShieldOff, Copy, CheckCircle2, AlertTriangle, Key, RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * Two-factor authentication settings card.
 *
 * Reads /auth/me to know whether 2FA is already on for this user, and
 * drives the enroll / disable flows. Each flow is a small state machine:
 *
 *   disabled → click Enable → QR appears → scan + enter code → verify →
 *              → show backup codes (one-time) → enabled
 *   enabled  → click Disable → enter current code → verify → disabled
 *
 * Platform admins (schoolpay-billing tenant) see an orange "required"
 * banner until they've enrolled — server policy won't let them disable
 * it but login still works without it, so the nudge is essential.
 */

type State =
  | { phase: 'loading' }
  | { phase: 'disabled' }
  | { phase: 'enrolling'; qr: string; secret: string; code: string; submitting: boolean }
  | { phase: 'backup-codes'; codes: string[] }
  | { phase: 'enabled' }
  | { phase: 'disabling'; code: string; submitting: boolean };

export const TwoFactorCard: React.FC = () => {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [mustEnroll, setMustEnroll] = useState(false);

  const refresh = async () => {
    try {
      const r = await Api.me();
      setMustEnroll(!!r.user.must_enroll_2fa);
      setState({ phase: r.user.twofa_enabled ? 'enabled' : 'disabled' });
    } catch (err) {
      toast({
        title: 'Could not load 2FA status',
        description: err instanceof ApiError ? err.message : String(err),
        variant: 'destructive'
      });
    }
  };
  useEffect(() => { refresh(); }, []);

  const startEnroll = async () => {
    try {
      const r = await Api.setup2fa();
      setState({ phase: 'enrolling', qr: r.qrDataUrl, secret: r.secret, code: '', submitting: false });
    } catch (err) {
      toast({ title: 'Could not start 2FA setup', description: err instanceof ApiError ? err.message : String(err), variant: 'destructive' });
    }
  };

  const confirmEnroll = async () => {
    if (state.phase !== 'enrolling') return;
    setState({ ...state, submitting: true });
    try {
      const r = await Api.confirm2fa({ code: state.code.trim() });
      setState({ phase: 'backup-codes', codes: r.backupCodes });
      toast({ title: '2FA enabled' });
    } catch (err) {
      setState({ ...state, submitting: false });
      toast({ title: 'Verification failed', description: err instanceof ApiError ? err.message : String(err), variant: 'destructive' });
    }
  };

  const startDisable = () => setState({ phase: 'disabling', code: '', submitting: false });

  const confirmDisable = async () => {
    if (state.phase !== 'disabling') return;
    setState({ ...state, submitting: true });
    try {
      await Api.disable2fa({ code: state.code.trim() });
      toast({ title: '2FA disabled' });
      setState({ phase: 'disabled' });
    } catch (err) {
      setState({ ...state, submitting: false });
      toast({ title: 'Could not disable 2FA', description: err instanceof ApiError ? err.message : String(err), variant: 'destructive' });
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast({ title: 'Copied' }));

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            state.phase === 'enabled' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {state.phase === 'enabled' ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Two-factor authentication</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Add a 6-digit code from an authenticator app (1Password, Google Authenticator, Authy…) to every login.
            </p>
          </div>
        </div>
        {state.phase === 'enabled' && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Enabled
          </Badge>
        )}
      </div>

      {mustEnroll && state.phase !== 'enabled' && state.phase !== 'enrolling' && state.phase !== 'backup-codes' && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            Your account is a <b>platform admin</b>. Two-factor authentication is
            required — please enable it now.
          </span>
        </div>
      )}

      {state.phase === 'loading' && (
        <div className="text-sm text-slate-500">Checking status…</div>
      )}

      {state.phase === 'disabled' && (
        <Button onClick={startEnroll} className="bg-blue-600 hover:bg-blue-700">
          <ShieldCheck className="w-4 h-4 mr-2" /> Enable 2FA
        </Button>
      )}

      {state.phase === 'enrolling' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-[auto_1fr] gap-5 items-start">
            <div className="shrink-0">
              <img
                src={state.qr}
                alt="2FA QR code"
                className="w-40 h-40 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900 mb-1">
                1. Scan this QR code with your authenticator app
              </div>
              <div className="text-[12px] text-slate-500 mb-3">
                Or enter this key manually:
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 font-mono text-xs">
                <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <code className="truncate flex-1">{state.secret}</code>
                <button
                  onClick={() => copy(state.secret)}
                  className="text-blue-600 hover:underline text-[11px] font-medium"
                >
                  <Copy className="w-3 h-3 inline mr-0.5" />Copy
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label>2. Enter the 6-digit code your app shows</Label>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={state.code}
              onChange={(e) => setState({ ...state, code: e.target.value.replace(/\D/g, '') })}
              placeholder="123 456"
              className="font-mono tracking-widest text-lg mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setState({ phase: 'disabled' })} disabled={state.submitting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={confirmEnroll}
              disabled={state.submitting || state.code.length !== 6}
            >
              {state.submitting ? 'Verifying…' : 'Verify & enable'}
            </Button>
          </div>
        </div>
      )}

      {state.phase === 'backup-codes' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <b>Save these backup codes now.</b> Each works once if you lose your
              authenticator device. This is the only time we'll show them.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {state.codes.map((c) => (
              <div key={c} className="flex items-center justify-between p-2.5 rounded-md bg-slate-900 text-emerald-300 font-mono text-sm">
                {c}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => copy(state.codes.join('\n'))}>
              <Copy className="w-4 h-4 mr-2" /> Copy all
            </Button>
            <Button className="flex-1 bg-navy hover:bg-navy-800" onClick={() => setState({ phase: 'enabled' })}>
              I've saved them — continue
            </Button>
          </div>
        </div>
      )}

      {state.phase === 'enabled' && (
        <div className="space-y-3">
          <div className="text-[13px] text-slate-600">
            Every login to this account now requires a code from your authenticator app.
            Lost the device? Use one of your backup codes (or an admin can reset your account).
          </div>
          <Button variant="outline" onClick={startDisable} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            <ShieldOff className="w-4 h-4 mr-2" /> Disable 2FA
          </Button>
        </div>
      )}

      {state.phase === 'disabling' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            Disabling 2FA weakens your account. Only do this if you're resetting to a new device.
          </div>
          <div>
            <Label>Enter current 6-digit code to confirm</Label>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={state.code}
              onChange={(e) => setState({ ...state, code: e.target.value })}
              placeholder="123 456"
              className="font-mono tracking-widest text-lg mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setState({ phase: 'enabled' })} disabled={state.submitting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDisable}
              disabled={state.submitting || state.code.length < 6}
            >
              {state.submitting ? 'Disabling…' : 'Disable 2FA'}
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={refresh}
        className="mt-4 text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3" /> Refresh status
      </button>
    </Card>
  );
};

export default TwoFactorCard;

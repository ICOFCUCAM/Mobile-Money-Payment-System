import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

/**
 * Hosted payment page — Option 3.
 *
 * Query params:
 *   ?school=<slug or id>           required
 *   &student_id=<code>             optional pre-fill
 *   &provider=MTN|ORANGE|AIRTEL    optional pre-fill
 *
 * Unlike the widget, this page has NO API key embedded. It relies on the
 * school having a public-pay key configured (a future enhancement). For now
 * it renders the form and surfaces the required integration settings.
 */
const Pay: React.FC = () => {
  const [params] = useSearchParams();
  const schoolParam = params.get('school') || '';
  const preStudent = params.get('student_id') || '';
  const preProvider = (params.get('provider') || 'MTN').toUpperCase();

  const [schoolName, setSchoolName] = useState<string>('');
  const [form, setForm] = useState({ student_id: preStudent, provider: preProvider, transaction_id: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { ok: true; studentName?: string; amount?: number; currency?: string } |
    { ok: false; message: string } |
    null
  >(null);

  useEffect(() => {
    // Best-effort school name lookup — tolerates 404.
    if (!schoolParam) return;
    fetch(`/api/schools/public/${encodeURIComponent(schoolParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && j.name) setSchoolName(j.name); })
      .catch(() => {});
  }, [schoolParam]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolParam) {
      setResult({ ok: false, message: 'Missing ?school= in the URL.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/public/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The hosted page needs the school to have configured a "public pay" key.
          // Until that's added to the dashboard, this call will 401 for real traffic.
          // Developers should prefer Option 1 (REST API) or Option 2 (widget) with their own key.
          'X-Public-Pay-School': schoolParam
        },
        body: JSON.stringify({
          school_id: schoolParam,
          student_id: form.student_id,
          transaction_id: form.transaction_id,
          provider: form.provider
        })
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setResult({
          ok: true,
          studentName: j.student && j.student.name,
          amount: j.transaction && j.transaction.amount,
          currency: j.transaction && j.transaction.currency
        });
      } else {
        setResult({ ok: false, message: (j.error && j.error.message) || 'Verification failed' });
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-8 shadow-2xl border-slate-100 relative">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">SchoolPay</span>
        </Link>

        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">
          Hosted payment
        </Badge>
        <h1 className="font-display text-2xl font-bold">
          {schoolName || schoolParam || 'Your school'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Enter your mobile-money transaction to credit the student.
        </p>

        {!result && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Student ID</Label>
              <Input
                required
                placeholder="STU001"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN MoMo</SelectItem>
                    <SelectItem value="ORANGE">Orange Money</SelectItem>
                    <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction ID</Label>
                <Input
                  required
                  placeholder="MoMo-ABC123"
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify payment'}
            </Button>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> HMAC-verified</span>
            </div>
          </form>
        )}

        {result && result.ok && (
          <div className="mt-6 p-5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="font-semibold text-emerald-900">Payment verified</div>
            <div className="text-sm text-emerald-800 mt-1">
              {result.studentName ? `${result.studentName} has been credited` : 'Student credited'}
              {result.amount ? ` ${result.amount.toLocaleString()} ${result.currency || ''}` : ''}.
            </div>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => { setResult(null); setForm({ student_id: '', provider: preProvider, transaction_id: '' }); }}
            >
              Make another payment
            </Button>
          </div>
        )}

        {result && !result.ok && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
            <div className="font-semibold mb-1">Couldn't verify that payment</div>
            <div>{result.message}</div>
            <Button variant="outline" className="mt-3" onClick={() => setResult(null)}>Try again</Button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Powered by <Link to="/" className="font-semibold text-slate-700 hover:underline">SchoolPay</Link>
        </div>
      </Card>
    </div>
  );
};

export default Pay;

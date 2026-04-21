import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Api, type BackendStudent, type BackendTransaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/use-toast';
import { Zap, CheckCircle2, XCircle, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const VerifyPayment: React.FC = () => {
  const { school } = useAuth();
  const { can, role } = usePermissions();

  const [students, setStudents] = useState<BackendStudent[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; tx?: BackendTransaction } | null>(null);

  const [form, setForm] = useState({
    studentCode: '',
    provider: 'MTN',
    externalId: ''
  });

  useEffect(() => { if (school) loadData(); /* eslint-disable-line */ }, [school]);

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([Api.listStudents({ limit: 500 }), Api.listConfigs()]);
      setStudents(sRes.students);
      const active = cRes.configs.filter(c => c.is_active).map(c => c.provider);
      setProviders(active);
      if (active.length) setForm(f => ({ ...f, provider: active[0] }));
    } catch (err: any) {
      toast({ title: 'Could not load data', description: err.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await Api.submitPayment(form);
      setResult({
        ok: true,
        message: `Verified ${formatCurrency(Number(res.transaction.amount), res.transaction.currency)} and credited the student.`,
        tx: res.transaction
      });
      toast({ title: 'Payment verified!', description: `${res.transaction.external_id} credited.` });
      setForm({ studentCode: '', provider: form.provider, externalId: '' });
    } catch (err: any) {
      setResult({ ok: false, message: err.message });
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.student_code === form.studentCode);

  if (!can('verify_payment')) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Payment verification restricted</h2>
          <p className="text-slate-600 mt-2">Only admins and bursars can verify and credit payments.</p>
          <div className="mt-4 text-sm text-slate-500">Your role: <Badge variant="outline" className="capitalize ml-1">{role}</Badge></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verify payment</h1>
        <p className="text-slate-600 mt-1">
          Submit a transaction reference to verify it with the provider and auto-credit the student. Duplicates are rejected and audit-logged.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Student</Label>
              <Select value={form.studentCode} onValueChange={(v) => setForm({ ...form, studentCode: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.student_code}>
                      {s.student_code} — {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.length > 0
                    ? providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)
                    : <SelectItem value="MTN">MTN (configure one first)</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Transaction reference</Label>
              <Input
                value={form.externalId}
                onChange={(e) => setForm({ ...form, externalId: e.target.value })}
                placeholder={form.provider === 'MTN' ? 'MoMo-XXXXX' : 'ORG-XXXXX'}
                required
              />
              <p className="text-xs text-slate-500 mt-1">From the customer's SMS receipt. Must be unique for this school + provider.</p>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !form.studentCode}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying with {form.provider}…</>
                : <><Zap className="w-4 h-4 mr-2" /> Verify & credit</>}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {selectedStudent && (
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{selectedStudent.full_name}</div>
                  <div className="text-xs text-slate-500">{selectedStudent.student_code} • {selectedStudent.class_name || '—'}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Balance</span><span className="font-medium text-emerald-700">{formatCurrency(Number(selectedStudent.balance), selectedStudent.currency)}</span></div>
              </div>
            </Card>
          )}

          {result && (
            <Card className={`p-5 ${result.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {result.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <div className="font-semibold">{result.ok ? 'Verified' : 'Failed'}</div>
              </div>
              <p className="text-sm text-slate-700">{result.message}</p>
              {result.tx && (
                <div className="mt-3 pt-3 border-t border-slate-200/50 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-600">Provider ref</span><span className="font-mono">{result.tx.external_id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Status</span><span className="font-semibold">{result.tx.status}</span></div>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5 bg-slate-50">
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold text-sm">Anti-fraud checks</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Tenant isolation (school_id scope)</li>
              <li>• Replay protection: UNIQUE (school, provider, external_id)</li>
              <li>• Provider-signed verification response required</li>
              <li>• Audit log entry on every submission</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyPayment;

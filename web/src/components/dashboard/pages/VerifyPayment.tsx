import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/use-toast';
import { Zap, CheckCircle2, XCircle, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const VerifyPayment: React.FC = () => {
  const { school } = useAuth();
  const { can, role } = usePermissions();

  const [students, setStudents] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    student_id: '',
    provider: 'MTN',
    transaction_id: '',
    amount: '',
    phone: ''
  });

  useEffect(() => { if (school) loadData(); }, [school]);

  const loadData = async () => {
    if (!school) return;
    const [sRes, pRes] = await Promise.all([
      supabase.from('students').select('*').eq('school_id', school.id).order('full_name'),
      supabase.from('payment_configs').select('*').eq('school_id', school.id).eq('is_active', true)
    ]);
    setStudents(sRes.data || []);
    setProviders(pRes.data || []);
    if (pRes.data && pRes.data.length > 0) setForm(f => ({ ...f, provider: pRes.data[0].provider }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          school_id: school.id,
          student_id: form.student_id,
          provider: form.provider,
          transaction_id: form.transaction_id,
          amount: Number(form.amount),
          phone: form.phone
        }
      });

      if (error) throw error;
      setResult(data);

      if (data?.success) {
        toast({ title: 'Payment Verified!', description: data.message });
        setForm({ student_id: '', provider: form.provider, transaction_id: '', amount: '', phone: '' });
      } else {
        toast({ title: 'Verification failed', description: data?.error || data?.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === form.student_id);

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
        <h1 className="text-2xl font-bold text-slate-900">Verify Payment</h1>
        <p className="text-slate-600 mt-1">Submit a transaction ID to verify via the correct provider and auto-credit the student.</p>
      </div>


      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Select Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.student_code} — {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.provider} value={p.provider}>{p.provider}</SelectItem>
                  ))}
                  {providers.length === 0 && <SelectItem value="MTN">MTN (not configured)</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Transaction ID</Label>
                <Input
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  placeholder={form.provider === 'MTN' ? 'MTN-XXXXX' : 'ORG-XXXXX'}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">From customer's SMS receipt</p>
              </div>
              <div>
                <Label>Amount (XAF)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label>Payer Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+237..." />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !form.student_id}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying with {form.provider}...</> : <><Zap className="w-4 h-4 mr-2" /> Verify & Credit Payment</>}
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
                  <div className="text-xs text-slate-500">{selectedStudent.student_code} • {selectedStudent.grade}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Fee</span><span className="font-medium">{formatCurrency(Number(selectedStudent.fee_amount))}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Paid</span><span className="font-medium text-emerald-700">{formatCurrency(Number(selectedStudent.balance))}</span></div>
                <div className="flex justify-between pt-2 border-t"><span className="text-slate-600">Due</span><span className="font-bold">{formatCurrency(Math.max(0, Number(selectedStudent.fee_amount) - Number(selectedStudent.balance)))}</span></div>
              </div>
            </Card>
          )}

          {result && (
            <Card className={`p-5 ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <div className="font-semibold">{result.success ? 'Verified' : 'Failed'}</div>
              </div>
              <p className="text-sm text-slate-700">{result.message || result.error}</p>
              {result.fee != null && (
                <div className="mt-3 pt-3 border-t border-slate-200/50 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-600">Provider fee</span><span>{formatCurrency(result.fee)}</span></div>
                  {result.new_balance != null && <div className="flex justify-between"><span className="text-slate-600">New balance</span><span className="font-semibold">{formatCurrency(result.new_balance)}</span></div>}
                </div>
              )}
            </Card>
          )}

          <Card className="p-5 bg-slate-50">
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold text-sm">Anti-Fraud Checks</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Tenant isolation (school_id scope)</li>
              <li>• Duplicate transaction prevention</li>
              <li>• Provider-specific validation</li>
              <li>• Audit log entry</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyPayment;

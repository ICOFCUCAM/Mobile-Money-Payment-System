import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency, formatDate, providerColors, statusColors } from '@/lib/format';

import {
  Users, CreditCard, DollarSign, Clock,
  ArrowUpRight, CheckCircle2, Zap
} from 'lucide-react';

interface Props { setPage: (p: any) => void; }

const Overview: React.FC<Props> = ({ setPage }) => {
  const { school } = useAuth();
  const { can } = usePermissions();

  const [stats, setStats] = useState({
    totalRevenue: 0, pending: 0, failed: 0, studentCount: 0, txnCount: 0,
    mtnTotal: 0, orangeTotal: 0, airtelTotal: 0, verifiedCount: 0
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school) return;
    load();
  }, [school]);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    const [txnRes, studRes] = await Promise.all([
      supabase.from('transactions').select('*, students(full_name, student_code)').eq('school_id', school.id).order('created_at', { ascending: false }),
      supabase.from('students').select('id').eq('school_id', school.id)
    ]);
    const txns = txnRes.data || [];
    const verified = txns.filter((t: any) => t.status === 'verified');
    const s = {
      totalRevenue: verified.reduce((a: number, t: any) => a + Number(t.amount), 0),
      pending: txns.filter((t: any) => t.status === 'pending').reduce((a: number, t: any) => a + Number(t.amount), 0),
      failed: txns.filter((t: any) => t.status === 'failed').length,
      studentCount: studRes.data?.length || 0,
      txnCount: txns.length,
      verifiedCount: verified.length,
      mtnTotal: verified.filter((t: any) => t.provider === 'MTN').reduce((a: number, t: any) => a + Number(t.amount), 0),
      orangeTotal: verified.filter((t: any) => t.provider === 'ORANGE').reduce((a: number, t: any) => a + Number(t.amount), 0),
      airtelTotal: verified.filter((t: any) => t.provider === 'AIRTEL').reduce((a: number, t: any) => a + Number(t.amount), 0),
    };
    setStats(s);
    setRecent(txns.slice(0, 6));
    setLoading(false);
  };

  const metrics = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-emerald-500 to-teal-600', change: '+24.5%' },
    { label: 'Verified Payments', value: stats.verifiedCount.toString(), icon: CheckCircle2, color: 'from-blue-500 to-indigo-600', change: `${stats.txnCount} total` },
    { label: 'Students', value: stats.studentCount.toString(), icon: Users, color: 'from-purple-500 to-pink-600', change: 'Active' },
    { label: 'Pending', value: formatCurrency(stats.pending), icon: Clock, color: 'from-amber-500 to-orange-600', change: 'Awaiting verification' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {school?.name}</h1>
          <p className="text-slate-600 mt-1">Here's what's happening with your school payments today.</p>
        </div>
        {can('verify_payment') && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setPage('verify')}>
            <Zap className="w-4 h-4 mr-2" /> Verify Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                <m.icon className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">{m.change}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">{m.value}</div>
              <div className="text-sm text-slate-500 mt-1">{m.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { name: 'MTN MoMo', amount: stats.mtnTotal, color: 'yellow', grad: 'from-yellow-400 to-yellow-600' },
          { name: 'Orange Money', amount: stats.orangeTotal, color: 'orange', grad: 'from-orange-400 to-orange-600' },
          { name: 'Airtel Money', amount: stats.airtelTotal, color: 'red', grad: 'from-red-400 to-red-600' },
        ].map((p) => (
          <Card key={p.name} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.grad} flex items-center justify-center`}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">Verified volume</div>
                </div>
              </div>
              <Badge className={`bg-${p.color}-100 text-${p.color}-800 hover:bg-${p.color}-100`}>Active</Badge>
            </div>
            <div className="mt-4 text-2xl font-bold text-slate-900">{formatCurrency(p.amount)}</div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <p className="text-sm text-slate-500">Latest payment activity across all providers</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage('transactions')}>
            View all <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Transaction ID</th>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Provider</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8 text-slate-500">Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-slate-500">No transactions yet</td></tr>
              ) : recent.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{t.external_txn_id}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{t.students?.full_name || '—'}</div>
                    <div className="text-xs text-slate-500">{t.students?.student_code}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={providerColors[t.provider]}>{t.provider}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(Number(t.amount))}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={statusColors[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Overview;

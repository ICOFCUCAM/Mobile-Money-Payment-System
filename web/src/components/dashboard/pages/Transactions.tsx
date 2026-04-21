import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, providerColors, statusColors } from '@/lib/format';
import { Search, Download, Filter } from 'lucide-react';

const Transactions: React.FC = () => {
  const { school } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (school) load(); }, [school]);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('transactions')
      .select('*, students(full_name, student_code)')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false });
    setTxns(data || []);
    setLoading(false);
  };

  const filtered = txns.filter(t => {
    if (providerFilter !== 'all' && t.provider !== providerFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.external_txn_id.toLowerCase().includes(search.toLowerCase()) &&
        !(t.students?.full_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const header = 'Transaction ID,Student,Provider,Amount,Phone,Status,Date\n';
    const rows = filtered.map(t => `${t.external_txn_id},${t.students?.full_name || ''},${t.provider},${t.amount},${t.phone || ''},${t.status},${t.created_at}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  const totals = {
    verified: filtered.filter(t => t.status === 'verified').reduce((a, t) => a + Number(t.amount), 0),
    pending: filtered.filter(t => t.status === 'pending').reduce((a, t) => a + Number(t.amount), 0),
    failed: filtered.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600 mt-1">Complete audit log of all payment activity.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Verified Volume</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totals.verified)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totals.pending)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Failed</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{totals.failed}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction ID or student..." className="border-none shadow-none focus-visible:ring-0" />
          </div>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="MTN">MTN</SelectItem>
              <SelectItem value="ORANGE">Orange</SelectItem>
              <SelectItem value="AIRTEL">Airtel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Txn ID</th>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Provider</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No transactions match your filters</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{t.external_txn_id}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{t.students?.full_name || '—'}</div>
                    <div className="text-xs text-slate-500">{t.students?.student_code || ''}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={providerColors[t.provider]}>{t.provider}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(Number(t.amount))}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{t.phone || '—'}</td>
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

export default Transactions;

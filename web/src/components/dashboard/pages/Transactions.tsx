import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Api, type BackendTransaction } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, providerColors, statusColors } from '@/lib/format';
import { Search, Download, Filter, RotateCw, Undo2 } from 'lucide-react';

const Transactions: React.FC = () => {
  const { school } = useAuth();
  const { isAdmin, role } = usePermissions();
  const canReconcile = role === 'admin' || role === 'bursar';

  const [txns, setTxns] = useState<BackendTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => { if (school) load(); /* eslint-disable-line */ }, [school, providerFilter, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await Api.listPayments({
        ...(providerFilter !== 'all' ? { provider: providerFilter } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        limit: 500
      });
      setTxns(res.transactions);
    } catch (err: any) {
      toast({ title: 'Could not load transactions', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Local text filter on top of the server-side provider/status filters so typing
  // stays snappy. For large tenants we'll push this into the API too.
  const filtered = txns.filter(t => {
    if (!search) return true;
    const needle = search.toLowerCase();
    return t.external_id.toLowerCase().includes(needle);
  });

  const exportCSV = async () => {
    setExporting(true);
    try {
      await Api.exportPaymentsCsv({
        ...(providerFilter !== 'all' ? { provider: providerFilter } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {})
      }, `transactions-${school?.subdomain || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast({ title: 'CSV exported' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally { setExporting(false); }
  };

  const reconcile = async () => {
    setReconciling(true);
    try {
      const r = await Api.reconcilePending(50);
      toast({
        title: 'Reconciliation complete',
        description: `Checked ${r.checked}: ${r.success} succeeded, ${r.failed} failed, ${r.stillPending} still pending${r.errored ? `, ${r.errored} errored` : ''}`
      });
      load();
    } catch (err: any) {
      toast({ title: 'Reconciliation failed', description: err.message, variant: 'destructive' });
    } finally { setReconciling(false); }
  };

  const reverse = async (tx: BackendTransaction) => {
    if (!confirm(`Reverse ${tx.external_id} and debit ${formatCurrency(Number(tx.amount), tx.currency)} from the student?`)) return;
    try {
      await Api.reversePayment(tx.id, 'Reversed from dashboard');
      toast({ title: 'Transaction reversed' });
      load();
    } catch (err: any) {
      toast({ title: 'Reversal failed', description: err.message, variant: 'destructive' });
    }
  };

  const totals = {
    verified: filtered.filter(t => t.status === 'success').reduce((a, t) => a + Number(t.amount), 0),
    pending: filtered.filter(t => t.status === 'pending').length,
    failed: filtered.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600 mt-1">Complete audit log of all payment activity.</p>
        </div>
        <div className="flex gap-2">
          {canReconcile && (
            <Button variant="outline" onClick={reconcile} disabled={reconciling}>
              <RotateCw className={`w-4 h-4 mr-2 ${reconciling ? 'animate-spin' : ''}`} />
              {reconciling ? 'Reconciling…' : 'Reconcile pending'}
            </Button>
          )}
          <Button variant="outline" onClick={exportCSV} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Verified Volume</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totals.verified)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totals.pending}</div>
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction ref…" className="border-none shadow-none focus-visible:ring-0" />
          </div>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              <SelectItem value="MTN">MTN</SelectItem>
              <SelectItem value="ORANGE">Orange</SelectItem>
              <SelectItem value="AIRTEL">Airtel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Ref</th>
                <th className="text-left px-5 py-3">Provider</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No transactions match your filters</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{t.external_id}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={providerColors[t.provider]}>{t.provider}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(Number(t.amount), t.currency)}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{t.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={statusColors[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(t.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && t.status === 'success' && (
                      <Button variant="ghost" size="sm" onClick={() => reverse(t)} title="Reverse & debit student">
                        <Undo2 className="w-4 h-4 text-red-500 mr-1" /> Reverse
                      </Button>
                    )}
                  </td>
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

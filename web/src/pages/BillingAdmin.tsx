import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft, GraduationCap, ShieldAlert, Pencil, CheckCircle2, RefreshCw,
  Wallet
} from 'lucide-react';

/**
 * /admin/billing — SchoolPay staff-only page.
 *
 * Shows every tenant on the platform with their subscription, balance, and
 * any custom-price override. Each row has an Override button that opens a
 * dialog: set a flat per-month price (in USD cents → displayed as dollars)
 * or clear the override to revert to catalog pricing.
 *
 * Gated server-side: /api/billing/admin/schools requires both role=admin
 * AND belonging to the schoolpay-billing tenant. Anyone else gets 403.
 */

type AdminSchool = {
  id: string; name: string; slug: string; email: string;
  subscription_plan: string; subscription_status: string;
  subscription_expires_at: string | null;
  wallet_balance_cents: number;
  billing_ref: string | null;
  custom_price_cents: number | null;
  is_active: boolean;
  created_at: string;
  last_topup_at: string | null;
};

const BillingAdmin: React.FC = () => {
  const { user, school, loading } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<AdminSchool[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [editing, setEditing] = useState<AdminSchool | null>(null);

  const load = () => {
    setReloading(true);
    Api.adminListSchools()
      .then((r) => { setRows(r.schools); setErr(null); })
      .catch((e) => setErr(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setReloading(false));
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/'); return; }
    // Soft client-side gate; real enforcement is server-side.
    if (school?.id !== 'schoolpay-billing' || user.role !== 'admin') {
      setErr('Platform-admin only. Your account is not authorised to view this page.');
      return;
    }
    load();
  }, [loading, user, school, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal to-royal-700 flex items-center justify-center shadow-md shadow-royal/40 ring-1 ring-white/10">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-navy">SchoolPay</span>
            </Link>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3 mr-1" /> Platform admin
            </Badge>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Billing · all schools</h1>
            <p className="text-sm text-slate-600 mt-1">
              Set per-school price overrides for negotiated deals, non-profit sponsorships, or regional pricing.
            </p>
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={reloading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${reloading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {err && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50 text-red-900 text-sm">{err}</Card>
        )}

        {rows && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-right">Override</th>
                    <th className="py-3 px-4">Last topup</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">No schools yet.</td></tr>
                  )}
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.slug} · {s.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {s.billing_ref
                          ? <code className="font-mono text-[12px] text-royal bg-royal/5 px-1.5 py-0.5 rounded">{s.billing_ref}</code>
                          : <span className="text-slate-400 text-[11px]">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize text-[11px]">
                          {s.subscription_plan}
                        </Badge>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.subscription_status}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[13px] font-semibold text-navy">
                        ${(s.wallet_balance_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[13px]">
                        {s.custom_price_cents != null
                          ? <span className="text-emerald-600 font-bold">${(s.custom_price_cents / 100).toFixed(2)}/mo</span>
                          : <span className="text-slate-400">catalog</span>}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {s.last_topup_at ? new Date(s.last_topup_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {editing && (
        <OverrideDialog
          school={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

const OverrideDialog: React.FC<{ school: AdminSchool; onClose: () => void; onSaved: () => void }> = ({ school, onClose, onSaved }) => {
  const currentDollars = school.custom_price_cents != null ? String(school.custom_price_cents / 100) : '';
  const [price, setPrice] = useState(currentDollars);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (clear: boolean) => {
    setSaving(true);
    try {
      const cents = clear ? null : Math.round(parseFloat(price) * 100);
      if (!clear && (!Number.isFinite(cents!) || cents! < 0)) throw new Error('Price must be a non-negative number');
      await Api.adminBillingOverride({
        school_id: school.id,
        custom_price_cents: cents,
        reason: reason.trim() || undefined
      });
      toast({ title: clear ? 'Override cleared' : 'Override saved' });
      onSaved();
    } catch (err) {
      toast({
        title: 'Could not save override',
        description: err instanceof ApiError ? err.message : String(err),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-royal" /> Price override
          </DialogTitle>
          <DialogDescription>
            Overrides the catalog monthly subscription price for <b>{school.name}</b>.
            All billing intents created afterwards will use this amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Custom monthly price (USD)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Leave blank and click "Clear override" to revert to catalog pricing.
            </div>
          </div>

          <div>
            <Label>Reason (audit note)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Early adopter 50% off for Q1 2025"
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => save(true)} disabled={saving} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            Clear override
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={() => save(false)} disabled={saving || !price} className="bg-royal hover:bg-royal-700 text-white">
              {saving ? 'Saving…' : (<><CheckCircle2 className="w-4 h-4 mr-1.5" /> Save override</>)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingAdmin;

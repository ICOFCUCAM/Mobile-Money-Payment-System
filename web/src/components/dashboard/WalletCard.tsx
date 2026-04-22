import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api, ApiError } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Copy, RefreshCw,
  Smartphone, Clock, Sparkles
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type WalletData = {
  billing_ref: string;
  balance_cents: number;
  currency: string;
  subscription: { plan: string; status: string; expires_at: string | null };
  custom_price_cents: number | null;
  transactions: Array<{
    id: string;
    kind: string;
    amount_cents: number;
    balance_after: number;
    currency: string;
    billing_intent_id: string | null;
    memo: string | null;
    created_at: string;
  }>;
};

const KIND_LABELS: Record<string, { label: string; tone: 'credit' | 'debit' }> = {
  topup_momo:         { label: 'MoMo top-up',        tone: 'credit' },
  topup_bank:         { label: 'Bank top-up',         tone: 'credit' },
  topup_manual:       { label: 'Manual credit',       tone: 'credit' },
  debit_subscription: { label: 'Subscription charge', tone: 'debit'  },
  debit_prepaid:      { label: 'Student fee',         tone: 'debit'  },
  debit_refund:       { label: 'Refund issued',       tone: 'debit'  }
};

export const WalletCard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Api.getWallet()
      .then((r) => { setWallet(r.wallet); setErr(null); })
      .catch((e) => setErr(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: 'Copied' }));
  };

  if (loading && !wallet) {
    return (
      <Card className="p-6 h-full animate-pulse border-slate-200">
        <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
        <div className="h-9 w-40 bg-slate-100 rounded" />
      </Card>
    );
  }
  if (err || !wallet) {
    return (
      <Card className="p-6 border-slate-200 text-sm text-slate-600">
        Could not load wallet: {err}
      </Card>
    );
  }

  const balance = wallet.balance_cents / 100;

  return (
    <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
      {/* Header: balance + ref */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-navy via-navy to-navy-950 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold font-bold">
              <Wallet className="w-3.5 h-3.5" /> Wallet balance
            </div>
            <div className="mt-1 font-display text-4xl font-bold">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white">
                <Sparkles className="w-2.5 h-2.5 text-gold" />
                Plan: <b className="ml-1 capitalize">{wallet.subscription.plan}</b>
              </span>
              {wallet.subscription.expires_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Renews {new Date(wallet.subscription.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <Button asChild className="bg-gold hover:bg-gold-600 text-navy font-semibold">
            <Link to="/billing/subscribe">
              Top up / Subscribe <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Billing reference chip */}
        <button
          onClick={() => copy(wallet.billing_ref)}
          className="mt-5 group flex items-center justify-between gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left"
        >
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Your permanent MoMo reference
            </div>
            <div className="font-mono text-xl font-bold text-gold tracking-wider mt-0.5">
              {wallet.billing_ref}
            </div>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-white/80 group-hover:text-white">
            <Copy className="w-3.5 h-3.5" /> Copy
          </div>
        </button>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Smartphone className="w-3 h-3" /> Send any amount to <b className="text-white/90 ml-0.5">+237 680 688 123</b> with this memo.
        </div>
      </div>

      {/* Recent ledger */}
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-navy">Recent activity</div>
          <button
            onClick={load}
            className="text-[11px] text-slate-500 hover:text-navy inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {wallet.transactions.length === 0 ? (
          <div className="text-[13px] text-slate-500 py-5 text-center">
            No wallet activity yet. Your first top-up will show here.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {wallet.transactions.slice(0, 5).map((tx) => {
              const meta = KIND_LABELS[tx.kind] || { label: tx.kind, tone: 'credit' as const };
              const isCredit = meta.tone === 'credit';
              const amount = tx.amount_cents / 100;
              return (
                <li key={tx.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-navy truncate">{meta.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {tx.memo || new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className={`shrink-0 font-mono text-[13px] font-semibold ${
                    isCredit ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {isCredit ? '+' : ''}${amount.toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {wallet.transactions.length > 5 && (
          <div className="mt-4 text-center">
            <Link to="/billing/subscribe" className="text-[12px] text-royal font-medium hover:underline">
              View full ledger →
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WalletCard;

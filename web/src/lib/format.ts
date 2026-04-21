export const formatCurrency = (amount: number, currency = 'XAF') => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount) + ' ' + currency;
};

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const providerColors: Record<string, string> = {
  MTN: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ORANGE: 'bg-orange-100 text-orange-800 border-orange-300',
  AIRTEL: 'bg-red-100 text-red-800 border-red-300',
};

// Includes both the template's vocabulary ('verified') and our backend's ('success')
// so existing components keep working during the migration. Commit 2 consolidates
// to the backend's canonical statuses.
export const statusColors: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
  reversed: 'bg-slate-100 text-slate-800 border-slate-300',
  duplicate: 'bg-slate-100 text-slate-800 border-slate-300',
};

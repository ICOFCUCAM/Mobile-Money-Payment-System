/**
 * Typed client for the Express backend at /api/*.
 *
 * Responsibilities:
 *  - Attach the JWT bearer token on every request.
 *  - Normalise errors into a single ApiError class so pages can `toast(err.message)`
 *    without parsing fetch quirks.
 *  - Bounce to the Landing (via `window.location.reload()`) when the server
 *    rejects an expired token so stale state doesn't linger.
 *
 * There is no schema-layer abstraction on purpose — these are thin wrappers over
 * the REST endpoints defined in the Express modules so backend changes are
 * obvious at the callsite.
 */

const TOKEN_KEY = 'schoolpay.token';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { rawText: text }; }

  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || res.statusText;
    const code = data && data.error && data.error.code;
    const err = new ApiError(msg, res.status, code, data?.error?.details);
    if (res.status === 401 && token) {
      // Expired / revoked — clear and let AuthContext's session-load pick it up.
      setToken(null);
    }
    throw err;
  }
  return data as T;
}

async function download(path: string, filename: string) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(`Download failed (${res.status}): ${text.slice(0, 200)}`, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Typed endpoint helpers ----------

export type BackendSchool = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  subscription_plan: string;
  subscription_status: string;
  is_active: boolean;
  api_key_prefix: string;
};

export type BackendUser = {
  id: string;
  school_id: string;
  email: string;
  role: 'admin' | 'bursar' | 'auditor';
  full_name?: string;
};

export type BackendStudent = {
  id: string;
  school_id: string;
  student_code: string;
  full_name: string;
  class_name: string | null;
  phone: string | null;
  balance: number;
  currency: string;
  created_at: string;
};

export type BackendTransaction = {
  id: string;
  school_id: string;
  student_id: string | null;
  provider: 'MTN' | 'ORANGE' | string;
  external_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'reversed';
  phone: string | null;
  verified_at: string | null;
  created_at: string;
};

export type BackendPaymentConfig = {
  id: string;
  provider: string;
  base_url: string | null;
  is_active: boolean;
  has_credentials: boolean;
  updated_at: string;
};

export type Plan = {
  id: 'basic' | 'pro' | 'enterprise';
  name: string;
  price: number | null;
  currency: string;
  interval: string;
  features: {
    providers: string[];
    maxStudents: number | null;
    reports: boolean;
    webhooks: boolean;
    auditLogs: boolean;
    customBranding: boolean;
  };
};

export const Api = {
  // Auth
  login: (body: { email: string; password: string; schoolSlug?: string }) =>
    request<{ token: string; user: BackendUser & { fullName?: string }; school: { id: string; slug: string; name: string; plan: string } }>(
      'POST', '/auth/login', body
    ),
  me: () => request<{ user: BackendUser; school: { id: string; slug: string; name: string; plan: string } }>('GET', '/auth/me'),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ ok: true }>('POST', '/auth/change-password', body),
  requestPasswordReset: (body: { email: string; schoolSlug?: string }) =>
    request<{ ok: true; token?: string }>('POST', '/auth/password-reset/request', body),
  resetPassword: (body: { token: string; newPassword: string }) =>
    request<{ ok: true }>('POST', '/auth/password-reset/confirm', body),
  listUsers: () => request<{ users: (BackendUser & { full_name: string; is_active: boolean; last_login_at: string | null; created_at: string })[] }>('GET', '/auth/users'),
  createUser: (body: { email: string; password: string; role: string; fullName: string }) =>
    request<{ user: BackendUser }>('POST', '/auth/users', body),

  // Schools
  register: (body: {
    name: string; slug: string; email: string; phone?: string;
    adminName: string; password: string; plan?: string;
  }) => request<{ school: BackendSchool; apiKey: string }>('POST', '/schools/register', body),
  getSchool: () => request<{ school: BackendSchool }>('GET', '/schools/me'),
  updateSchool: (body: { name?: string; phone?: string; is_active?: boolean }) =>
    request<{ school: BackendSchool }>('PATCH', '/schools/me', body),
  deleteSchool: () => request<void>('DELETE', '/schools/me'),
  rotateApiKey: () => request<{ apiKey: string }>('POST', '/schools/me/api-key/rotate'),
  listConfigs: () => request<{ configs: BackendPaymentConfig[] }>('GET', '/schools/me/payment-configs'),
  upsertConfig: (body: { provider: string; api_key: string; api_secret: string; base_url?: string; metadata?: Record<string, unknown>; is_active?: boolean }) =>
    request<{ configs: BackendPaymentConfig[] }>('PUT', '/schools/me/payment-configs', body),

  // Students
  listStudents: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ students: BackendStudent[] }>('GET', `/students${suffix}`);
  },
  getStudent: (id: string) => request<{ student: BackendStudent }>('GET', `/students/${encodeURIComponent(id)}`),
  createStudent: (body: { studentCode: string; fullName: string; className?: string; phone?: string }) =>
    request<{ student: BackendStudent }>('POST', '/students', body),
  updateStudent: (id: string, body: Partial<{ full_name: string; class_name: string; phone: string }>) =>
    request<{ student: BackendStudent }>('PATCH', `/students/${encodeURIComponent(id)}`, body),
  deleteStudent: (id: string) => request<void>('DELETE', `/students/${encodeURIComponent(id)}`),

  // Payments
  submitPayment: (body: { studentCode: string; provider: string; externalId: string }) =>
    request<{ transaction: BackendTransaction }>('POST', '/payments', body),
  listPayments: (params: { status?: string; provider?: string; studentId?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, String(v));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ transactions: BackendTransaction[] }>('GET', `/payments${suffix}`);
  },
  paymentSummary: () => request<{ summary: { total: number; success: number; pending: number; failed: number; amount_collected: number; students: number } }>('GET', '/payments/summary'),
  getPayment: (id: string) => request<{ transaction: BackendTransaction }>('GET', `/payments/${encodeURIComponent(id)}`),
  reversePayment: (id: string, reason?: string) =>
    request<{ transaction: BackendTransaction }>('POST', `/payments/${encodeURIComponent(id)}/reverse`, { reason }),
  reconcilePending: (limit = 50) =>
    request<{ checked: number; success: number; failed: number; stillPending: number; errored: number }>(
      'POST', `/payments/reconcile?limit=${limit}`
    ),
  exportPaymentsCsv: (params: { status?: string; provider?: string } = {}, filename?: string) => {
    const qs = new URLSearchParams({ limit: '10000', ...(params.status ? { status: params.status } : {}), ...(params.provider ? { provider: params.provider } : {}) });
    return download(`/payments/export.csv?${qs.toString()}`, filename || `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  },

  // Dashboard
  overview: () => request<{
    school: { id: string; name: string; slug: string; plan: string };
    summary: { total: number; success: number; pending: number; failed: number; amount_collected: number; students: number };
    providerBreakdown: { provider: string; count: number; collected: number }[];
    recentTransactions: BackendTransaction[];
    topStudents: { id: string; student_code: string; full_name: string; balance: number }[];
    studentCount: number;
  }>('GET', '/dashboard/overview'),

  // Subscriptions
  listPlans: () => request<{ plans: Plan[] }>('GET', '/subscriptions/plans'),
  currentSubscription: () => request<{ plan: Plan | null; status: string; expiresAt: string | null; history: any[] }>('GET', '/subscriptions/current'),
  changePlan: (body: { plan: string; paymentReference?: string }) =>
    request<{ plan: Plan; status: string; expiresAt: string | null }>('POST', '/subscriptions/change', body),

  // Health
  status: () => request<{ ok: boolean; db?: string }>('GET', '/_status'),
};

// Legacy compatibility: old dashboard code may still `import { Api } from '@/lib/api'`
// using snake_case — re-export under a more generic name too.
export default Api;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Api, getToken, setToken } from '@/lib/api';

/**
 * Backend fields are renamed on the way in so existing dashboard pages that
 * reference `school.subdomain` / `user.full_name` keep working. The mapping:
 *   backend.slug                 -> school.subdomain
 *   backend.school.plan          -> school.subscription_plan
 *   backend.user.email (local)   -> user.full_name fallback when missing
 */
export interface School {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone: string;
  subscription_plan: string;
  logo_url?: string;
}

export interface SchoolUser {
  id: string;
  school_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'bursar' | 'viewer';
}

interface AuthContextType {
  user: SchoolUser | null;
  school: School | null;
  loading: boolean;
  login: (email: string, password: string, schoolSlug?: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string; apiKey?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
  /** Holds the freshly-minted API key from the last successful registration
   * so the reveal dialog can render in either pre- or post-auth view. */
  justIssuedApiKey: string | null;
  clearJustIssuedApiKey: () => void;
}

interface RegisterData {
  schoolName: string;
  subdomain: string;
  email: string;
  phone: string;
  fullName: string;
  password: string;
  /** Legacy postpaid sub-plan: 'basic' | 'pro' | 'enterprise' */
  plan: string;
  /** New billing model chosen in the 2-step wizard. Defaults to postpaid for backward-compat. */
  billingModel?: 'prepaid' | 'postpaid' | 'license';
  /** License tier when billingModel === 'license' ('1' | '2' | '3-5' | '5-10') */
  licenseTier?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

/** The backend uses the role 'auditor' for read-only users; the existing UI
 * labels that role 'viewer'. Keep a single source of truth here. */
function mapRole(r: string): 'admin' | 'bursar' | 'viewer' {
  if (r === 'admin') return 'admin';
  if (r === 'bursar') return 'bursar';
  return 'viewer';
}

function toSchoolShape(
  s: { id: string; name: string; slug?: string; plan?: string; subscription_plan?: string; email?: string; phone?: string | null }
): School {
  return {
    id: s.id,
    name: s.name,
    subdomain: s.slug || '',
    email: s.email || '',
    phone: s.phone || '',
    subscription_plan: s.subscription_plan || s.plan || 'basic'
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SchoolUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [justIssuedApiKey, setJustIssuedApiKey] = useState<string | null>(null);

  const refresh = async () => {
    const tok = getToken();
    if (!tok) { setUser(null); setSchool(null); return; }
    try {
      const me = await Api.me();
      setUser({
        id: me.user.id,
        school_id: me.user.school_id,
        email: me.user.email,
        full_name: (me.user as any).full_name || me.user.email.split('@')[0],
        role: mapRole(me.user.role)
      });
      setSchool(toSchoolShape(me.school));
    } catch {
      setToken(null);
      setUser(null); setSchool(null);
    }
  };

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, []);

  const login = async (email: string, password: string, schoolSlug?: string) => {
    try {
      const res = await Api.login({ email, password, ...(schoolSlug ? { schoolSlug } : {}) });
      setToken(res.token);
      setUser({
        id: res.user.id,
        school_id: res.user.school_id,
        email: res.user.email,
        full_name: res.user.fullName || res.user.email.split('@')[0],
        role: mapRole(res.user.role)
      });
      setSchool(toSchoolShape(res.school));
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await Api.register({
        name: data.schoolName,
        slug: data.subdomain,
        email: data.email,
        phone: data.phone,
        adminName: data.fullName,
        password: data.password,
        plan: data.plan,
        billingModel: data.billingModel,
        licenseTier: data.licenseTier
      } as any);
      // Auto-login after registration so the user goes straight to the dashboard.
      const loginRes = await Api.login({ email: data.email, password: data.password });
      setToken(loginRes.token);
      setUser({
        id: loginRes.user.id,
        school_id: loginRes.user.school_id,
        email: loginRes.user.email,
        full_name: data.fullName,
        role: mapRole(loginRes.user.role)
      });
      setSchool(toSchoolShape(res.school));
      // Stash the plaintext API key on the provider so the reveal dialog
      // can render AFTER auto-login (the register dialog is inside
      // AuthDialogs which unmounts as soon as setUser fires).
      if (res.apiKey) setJustIssuedApiKey(res.apiKey);
      return { apiKey: res.apiKey };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSchool(null);
  };

  return (
    <AuthContext.Provider value={{
      user, school, loading,
      login, register, logout, refresh,
      justIssuedApiKey,
      clearJustIssuedApiKey: () => setJustIssuedApiKey(null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => void;
}

interface RegisterData {
  schoolName: string;
  subdomain: string;
  email: string;
  phone: string;
  fullName: string;
  password: string;
  plan: string;
}

// NOTE: This file is intentionally retained from the original template in this
// commit so the rest of the UI continues to compile. Commit 2 rewrites it to
// call the Express REST API (`POST /api/auth/login`, `/api/schools/register`,
// etc.) with JWT + bcrypt — the template's plaintext-password comparison
// (`password_hash !== password`) has been disabled below pending that rewrite.
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SchoolUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sps_session');
    if (saved) {
      try {
        const { user: u, school: s } = JSON.parse(saved);
        setUser(u);
        setSchool(s);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (_email: string, _password: string) => {
    return { error: 'Login is being migrated to the Express backend. See commit 2.' };
  };

  const register = async (_data: RegisterData) => {
    return { error: 'Registration is being migrated to the Express backend. See commit 2.' };
  };

  const logout = () => {
    setUser(null);
    setSchool(null);
    localStorage.removeItem('sps_session');
  };

  return (
    <AuthContext.Provider value={{ user, school, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

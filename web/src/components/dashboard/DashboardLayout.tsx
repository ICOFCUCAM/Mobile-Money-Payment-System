import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut,
  GraduationCap, Webhook, Zap, Menu, X, ChevronRight, Shield, Building2, UserCog
} from 'lucide-react';
import Overview from './pages/Overview';
import Students from './pages/Students';
import Transactions from './pages/Transactions';
import Providers from './pages/Providers';
import Subscription from './pages/Subscription';
import VerifyPayment from './pages/VerifyPayment';
import SchoolSettings from './pages/SchoolSettings';
import Team from './pages/Team';
import type { Permission } from '@/hooks/usePermissions';

type Page = 'overview' | 'students' | 'transactions' | 'providers' | 'verify' | 'subscription' | 'settings' | 'team';

const DashboardLayout: React.FC = () => {
  const { user, school, logout } = useAuth();
  const { can, role } = usePermissions();
  const [page, setPage] = useState<Page>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allNav: { id: Page; label: string; icon: any; perm: Permission }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, perm: 'view_dashboard' },
    { id: 'verify', label: 'Verify Payment', icon: Zap, perm: 'verify_payment' },
    { id: 'students', label: 'Students', icon: Users, perm: 'view_students' },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, perm: 'view_transactions' },
    { id: 'providers', label: 'Providers', icon: Webhook, perm: 'manage_providers' },
    { id: 'team', label: 'Team', icon: UserCog, perm: 'manage_team' },
    { id: 'subscription', label: 'Subscription', icon: Shield, perm: 'manage_subscription' },
    { id: 'settings', label: 'Settings', icon: Settings, perm: 'manage_settings' },
  ];

  const nav = allNav.filter(n => can(n.perm));

  React.useEffect(() => {
    const current = allNav.find(n => n.id === page);
    if (current && !can(current.perm)) setPage('overview');
  }, [page, role]);

  const renderPage = () => {
    switch (page) {
      case 'overview': return <Overview setPage={setPage} />;
      case 'students': return <Students />;
      case 'transactions': return <Transactions />;
      case 'providers': return <Providers />;
      case 'verify': return <VerifyPayment />;
      case 'subscription': return <Subscription />;
      case 'settings': return <SchoolSettings />;
      case 'team': return <Team />;
    }
  };

  if (!school || !user) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform flex flex-col`}>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">SchoolPay</div>
                <div className="text-xs text-slate-500">SaaS Platform</div>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-slate-900 truncate">{school.name}</div>
              <div className="text-xs text-slate-500 truncate">{school.subdomain}.schoolpay.app</div>
            </div>
            <Badge variant="outline" className="bg-white text-xs capitalize">{school.subscription_plan}</Badge>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === n.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <n.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{n.label}</span>
              {page === n.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500">Tenant</div>
              <div className="font-semibold text-slate-900 capitalize">{page.replace('-', ' ')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
              {role}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hidden sm:inline-flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Landing from './landing/Landing';
import DashboardLayout from './dashboard/DashboardLayout';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Landing />;
};

export default AppLayout;

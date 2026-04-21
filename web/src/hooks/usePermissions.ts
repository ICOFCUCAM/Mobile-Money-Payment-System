import { useAuth } from '@/contexts/AuthContext';

export type Permission =
  | 'view_dashboard'
  | 'verify_payment'
  | 'view_students'
  | 'manage_students'
  | 'view_transactions'
  | 'manage_providers'
  | 'manage_subscription'
  | 'manage_settings'
  | 'manage_team';

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'view_dashboard', 'verify_payment', 'view_students', 'manage_students',
    'view_transactions', 'manage_providers', 'manage_subscription',
    'manage_settings', 'manage_team'
  ],
  bursar: [
    'view_dashboard', 'verify_payment', 'view_students', 'view_transactions'
  ],
  viewer: [
    'view_dashboard', 'view_students', 'view_transactions'
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || 'viewer';
  const perms = rolePermissions[role] || [];

  const can = (permission: Permission) => perms.includes(permission);
  const cannot = (permission: Permission) => !perms.includes(permission);

  return { role, can, cannot, isAdmin: role === 'admin', isBursar: role === 'bursar', isViewer: role === 'viewer' };
};

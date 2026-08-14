import type { AdminInfo } from '../store';
import { AdminRole } from './roles';

export enum Permission {
  Dashboard = 'dashboard',
  Users = 'users',
  Games = 'games',
  Lottery = 'lottery',
  Orders = 'orders',
  Finance = 'finance',
  Content = 'content',
  Reports = 'reports',
  System = 'system',
  Earn = 'earn',
}

const isSuperAdmin = (role: string): boolean => {
  const key = role.toLowerCase().replace(/-/g, '_');
  return key === AdminRole.SuperAdmin;
};

export const adminHasPermission = (
  admin: AdminInfo | null,
  code: Permission,
): boolean => {
  if (!admin) return false;
  if (isSuperAdmin(admin.role)) return true;
  return admin.permissions.includes(code);
};

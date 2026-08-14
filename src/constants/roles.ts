export enum AdminRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Operator = 'operator',
  Viewer = 'viewer',
}

export interface RoleMeta {
  value: AdminRole;
  label: string;
  color: string;
  rank: number;
  description: string;
}

export const ROLE_META: Record<AdminRole, RoleMeta> = {
  [AdminRole.SuperAdmin]: {
    value: AdminRole.SuperAdmin,
    label: 'Super Admin',
    color: 'red',
    rank: 100,
    description: 'Full platform control including secrets and money paths',
  },
  [AdminRole.Admin]: {
    value: AdminRole.Admin,
    label: 'Admin',
    color: 'blue',
    rank: 80,
    description: 'Day-to-day operations: rounds, orders, content, users',
  },
  [AdminRole.Operator]: {
    value: AdminRole.Operator,
    label: 'Operator',
    color: 'cyan',
    rank: 60,
    description: 'Limited operations: approve recharges, view reports',
  },
  [AdminRole.Viewer]: {
    value: AdminRole.Viewer,
    label: 'Viewer',
    color: 'default',
    rank: 20,
    description: 'Read-only access to dashboards and reports',
  },
};

export const ROLE_OPTIONS = Object.values(ROLE_META).map((m) => ({
  value: m.value,
  label: m.label,
}));

const UNKNOWN_ROLE_LABEL = 'Unknown';
const DEFAULT_ROLE_COLOR = 'default';

export const SUPER_ADMIN_LEVEL = ROLE_META[AdminRole.SuperAdmin].rank;

export const roleLevel = (role: string | null | undefined): number => {
  const meta = getRoleMeta(role);
  return meta ? meta.rank : 0;
};

export const getRoleMeta = (role: string | null | undefined): RoleMeta | null => {
  if (!role) return null;
  const meta = ROLE_META[role as AdminRole];
  return meta ? meta : null;
};

export const getRoleLabel = (role: string | null | undefined): string => {
  const meta = getRoleMeta(role);
  if (meta) return meta.label;
  return role ? role : UNKNOWN_ROLE_LABEL;
};

export const getRoleColor = (role: string | null | undefined): string => {
  const meta = getRoleMeta(role);
  return meta ? meta.color : DEFAULT_ROLE_COLOR;
};

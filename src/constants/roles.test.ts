import { describe, it, expect } from 'vitest';
import {
  AdminRole,
  ROLE_META,
  ROLE_OPTIONS,
  roleLevel,
  getRoleMeta,
  getRoleLabel,
  getRoleColor,
  SUPER_ADMIN_LEVEL,
} from './roles';

describe('role hierarchy (drives access control)', () => {
  it('ranks roles strictly descending from super admin to viewer', () => {
    expect(roleLevel(AdminRole.SuperAdmin)).toBeGreaterThan(
      roleLevel(AdminRole.Admin),
    );
    expect(roleLevel(AdminRole.Admin)).toBeGreaterThan(
      roleLevel(AdminRole.Operator),
    );
    expect(roleLevel(AdminRole.Operator)).toBeGreaterThan(
      roleLevel(AdminRole.Viewer),
    );
  });

  it('exposes super admin as the highest level constant', () => {
    expect(SUPER_ADMIN_LEVEL).toBe(ROLE_META[AdminRole.SuperAdmin].rank);
  });

  it('fails closed: unknown / nullish roles get level 0', () => {
    expect(roleLevel('ghost_role')).toBe(0);
    expect(roleLevel(null)).toBe(0);
    expect(roleLevel(undefined)).toBe(0);
  });
});

describe('getRoleMeta', () => {
  it('resolves a known role to its metadata', () => {
    expect(getRoleMeta(AdminRole.Admin)?.label).toBe('Admin');
  });

  it('returns null for an unknown or empty role', () => {
    expect(getRoleMeta('nope')).toBeNull();
    expect(getRoleMeta(null)).toBeNull();
  });
});

describe('getRoleLabel / getRoleColor', () => {
  it('returns the friendly label for a known role', () => {
    expect(getRoleLabel(AdminRole.Operator)).toBe('Operator');
  });

  it('echoes the raw role when unknown, and Unknown when empty', () => {
    expect(getRoleLabel('custom')).toBe('custom');
    expect(getRoleLabel(null)).toBe('Unknown');
  });

  it('returns a colour for known roles and a default otherwise', () => {
    expect(getRoleColor(AdminRole.SuperAdmin)).toBe('red');
    expect(getRoleColor('mystery')).toBe('default');
  });
});

describe('ROLE_OPTIONS', () => {
  it('lists every role as a value/label option', () => {
    expect(ROLE_OPTIONS).toHaveLength(Object.keys(ROLE_META).length);
    expect(ROLE_OPTIONS).toContainEqual({
      value: AdminRole.SuperAdmin,
      label: 'Super Admin',
    });
  });
});

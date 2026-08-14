import { describe, it, expect } from 'vitest';
import { visibleMenuItems, canSeeEntry } from './menuConfig';
import { Permission } from '../../constants/permissions';
import type { AdminInfo } from '../../store';

const makeAdmin = (role: string, permissions: Permission[]): AdminInfo => ({
  id: 1,
  username: role,
  displayName: role,
  avatar: null,
  role,
  permissions,
});

const topLevelKeys = (admin: AdminInfo | null): string[] =>
  visibleMenuItems(admin).map((i) => i.key);

describe('menu visibility is driven by permission codes', () => {
  it('super_admin sees every top-level group regardless of its permission list', () => {
    const superAdmin = makeAdmin('super_admin', []);
    const keys = topLevelKeys(superAdmin);
    expect(keys).toEqual([
      '/dashboard',
      '/users',
      'lottery',
      'games',
      '/orders',
      'finance',
      'earn',
      'content',
      'reports',
      'system',
    ]);
  });

  it('a limited role (orders + reports only) sees only those groups', () => {
    const limited = makeAdmin('limited', [
      Permission.Orders,
      Permission.Reports,
    ]);
    const keys = topLevelKeys(limited);
    expect(keys).toContain('/orders');
    expect(keys).toContain('reports');
    expect(keys).not.toContain('/dashboard');
    expect(keys).not.toContain('/users');
    expect(keys).not.toContain('lottery');
    expect(keys).not.toContain('games');
    expect(keys).not.toContain('finance');
    expect(keys).not.toContain('earn');
    expect(keys).not.toContain('content');
    expect(keys).not.toContain('system');
  });

  it('hides every group for a permission-less admin', () => {
    const none = makeAdmin('none', []);
    expect(topLevelKeys(none)).toEqual([]);
  });

  it('a parent group is visible when at least one child is permitted', () => {
    const finance = makeAdmin('fin', [Permission.Finance]);
    const financeGroup = visibleMenuItems(finance).find(
      (i) => i.key === 'finance',
    );
    expect(financeGroup).toBeDefined();
    expect(financeGroup?.children?.length).toBeGreaterThan(0);
  });

  it('keeps the always-visible Profile item with no permission requirement', () => {
    const profile = { key: '/system/profile', icon: null, label: 'Profile' };
    expect(canSeeEntry(makeAdmin('none', []), profile)).toBe(true);
  });
});

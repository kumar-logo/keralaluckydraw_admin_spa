import { describe, it, expect, beforeEach } from 'vitest';
import { useAdminStore, type AdminInfo } from './store';

const admin: AdminInfo = {
  id: 7,
  username: 'root',
  displayName: 'Root Admin',
  avatar: null,
  role: 'super_admin',
  permissions: ['dashboard', 'users', 'system'],
};

describe('useAdminStore (auth session)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAdminStore.setState({ admin: null, token: null });
  });

  it('setAuth stores admin + token in state and localStorage', () => {
    useAdminStore.getState().setAuth(admin, 'jwt-123');

    const state = useAdminStore.getState();
    expect(state.admin).toEqual(admin);
    expect(state.token).toBe('jwt-123');
    expect(localStorage.getItem('admin_token')).toBe('jwt-123');
    expect(JSON.parse(localStorage.getItem('admin_info') as string)).toEqual(
      admin,
    );
  });

  it('logout clears state and purges persisted credentials', () => {
    useAdminStore.getState().setAuth(admin, 'jwt-123');
    useAdminStore.getState().logout();

    const state = useAdminStore.getState();
    expect(state.admin).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_info')).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { useAdminStore, type AdminInfo } from '../store';
import { AdminRole } from '../constants/roles';
import { Permission } from '../constants/permissions';
import { renderWithProviders } from '../test/renderWithProviders';

const setAdmin = (admin: AdminInfo | null) => {
  useAdminStore.setState({ admin, token: admin ? 'tkn' : null });
};

const Secret = () => <div>secret-content</div>;

describe('ProtectedRoute (permission guard)', () => {
  beforeEach(() => {
    setAdmin(null);
  });

  it('renders neither the children nor an access screen while unauthenticated', () => {
    renderWithProviders(
      <ProtectedRoute requiredPermission={Permission.Orders}>
        <Secret />
      </ProtectedRoute>,
    );
    expect(screen.queryByText('secret-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders the children when the admin holds the required permission', () => {
    setAdmin({
      id: 2,
      username: 'op',
      displayName: 'Op',
      avatar: null,
      role: 'operator',
      permissions: [Permission.Orders, Permission.Reports],
    });
    renderWithProviders(
      <ProtectedRoute requiredPermission={Permission.Orders}>
        <Secret />
      </ProtectedRoute>,
    );
    expect(screen.getByText('secret-content')).toBeInTheDocument();
  });

  it('grants super_admin access to any route regardless of its permission list', () => {
    setAdmin({
      id: 1,
      username: 'su',
      displayName: 'Su',
      avatar: null,
      role: AdminRole.SuperAdmin,
      permissions: [],
    });
    renderWithProviders(
      <ProtectedRoute requiredPermission={Permission.System}>
        <Secret />
      </ProtectedRoute>,
    );
    expect(screen.getByText('secret-content')).toBeInTheDocument();
  });

  it('blocks an admin lacking the required permission (fail closed)', () => {
    setAdmin({
      id: 2,
      username: 'op',
      displayName: 'Op',
      avatar: null,
      role: 'operator',
      permissions: [Permission.Orders, Permission.Reports],
    });
    renderWithProviders(
      <ProtectedRoute requiredPermission={Permission.Finance}>
        <Secret />
      </ProtectedRoute>,
    );
    expect(screen.queryByText('secret-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('blocks an admin with an empty permission list', () => {
    setAdmin({
      id: 3,
      username: 'view',
      displayName: 'View',
      avatar: null,
      role: 'viewer',
      permissions: [],
    });
    renderWithProviders(
      <ProtectedRoute requiredPermission={Permission.Dashboard}>
        <Secret />
      </ProtectedRoute>,
    );
    expect(screen.queryByText('secret-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});

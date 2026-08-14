import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import UsersPage from './UsersPage';
import { useAdminStore, type AdminInfo } from '../store';
import { AdminRole } from '../constants/roles';
import { Permission } from '../constants/permissions';
import { renderWithProviders } from '../test/renderWithProviders';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

const superAdmin: AdminInfo = {
  id: 1,
  username: 'root',
  displayName: 'Root',
  avatar: null,
  role: AdminRole.SuperAdmin,
  permissions: [Permission.Users],
};

const userRow = {
  id: 1,
  userId: 'U500',
  phone: '9876543210',
  nickname: 'alice',
  avatar: '',
  balance: 1200,
  bonusBalance: 0,
  withdrawableBalance: 0,
  inviteCode: 'ARA1234567',
  invitedBy: '',
  vipLevel: 1,
  status: 1,
  createdAt: '2026-06-27T10:00:00',
};

describe('Users list — Adjust Balance moved to the detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminStore.setState({ admin: superAdmin, token: 'tkn' });
    mockedPost.mockResolvedValue({
      list: [userRow],
      total: 1,
      pageNo: 1,
      pageSize: 10,
    });
  });

  it('renders the user row without any Adjust Balance action, even for a super admin', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('eye')).toBeInTheDocument();
    expect(screen.getByLabelText('key')).toBeInTheDocument();
    expect(screen.getByLabelText('delete')).toBeInTheDocument();

    expect(screen.queryByLabelText('dollar')).not.toBeInTheDocument();
    expect(screen.queryByText('Adjust Balance')).not.toBeInTheDocument();
  });

  it('never posts a balance adjustment from the list page', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });
    const balanceCalls = mockedPost.mock.calls.filter((c) =>
      String(c[0]).includes('/balance'),
    );
    expect(balanceCalls).toHaveLength(0);
  });
});

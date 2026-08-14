import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawPage from './WithdrawPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useConfigStore } from '../store/configStore';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

interface WithdrawRow {
  id: number;
  orderNo: string;
  userId: string;
  username?: string;
  userBalance?: number;
  amount: number;
  fee: number;
  actualAmount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  ifscCode: string;
  upiId: string;
  gpayId: string;
  phonepeId: string;
  status: number;
  remark: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface StatusCount {
  status: number;
  count: number;
  amount: number;
}

const pendingWithdraw: WithdrawRow = {
  id: 9,
  orderNo: 'WD-9009',
  userId: 'U777',
  username: 'bob',
  userBalance: 800,
  amount: 5000,
  fee: 50,
  actualAmount: 4950,
  bankName: 'HDFC',
  bankAccount: '1234567890',
  bankHolder: 'Bob K',
  ifscCode: 'HDFC0001',
  upiId: '',
  gpayId: '',
  phonepeId: '',
  status: 0,
  remark: '',
  processedBy: '',
  createdAt: '2026-06-27T09:00:00',
  updatedAt: '2026-06-27T09:00:00',
};

const countsFor = (rows: WithdrawRow[]): StatusCount[] => {
  const map = new Map<number, StatusCount>();
  for (const r of rows) {
    const entry = map.get(r.status) ?? {
      status: r.status,
      count: 0,
      amount: 0,
    };
    entry.count += 1;
    entry.amount += r.amount;
    map.set(r.status, entry);
  }
  return [...map.values()];
};

const listResponse = (rows: WithdrawRow[]) => ({
  list: rows,
  total: rows.length,
  pageNo: 1,
  pageSize: 10,
  statusCounts: countsFor(rows),
});

describe('WithdrawPage (Withdraw History)', () => {
  beforeEach(() => {
    useConfigStore.setState({
      statusMaps: {
        withdraw: {
          0: { text: 'Pending', color: 'gold' },
          1: { text: 'Approved', color: 'green' },
          2: { text: 'Rejected', color: 'red' },
        },
      },
    });
    mockedPost.mockReset();
  });

  it('loads the withdrawal queue and renders the bank payout details', async () => {
    mockedPost.mockResolvedValueOnce(listResponse([pendingWithdraw]) as never);

    renderWithProviders(<WithdrawPage />);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        'finance/withdraw/list',
        expect.any(Object),
      ),
    );
    expect(await screen.findByText('bob')).toBeInTheDocument();
    expect(screen.getByText('@U777')).toBeInTheDocument();
    expect(screen.getByText('HDFC')).toBeInTheDocument();
  });

  it('shows the pending total reflecting the withdrawal amount in the stat cards', async () => {
    mockedPost.mockResolvedValueOnce(listResponse([pendingWithdraw]) as never);

    renderWithProviders(<WithdrawPage />);
    await screen.findByText('bob');

    // Pending card amount + the row amount both render ₹5,000.00.
    expect(screen.getAllByText('₹5,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending Withdraw')).toBeInTheDocument();
  });

  it('approves a withdrawal, hitting the approve endpoint with the order number', async () => {
    const user = userEvent.setup();
    mockedPost
      .mockResolvedValueOnce(listResponse([pendingWithdraw]) as never)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce(listResponse([]) as never);

    renderWithProviders(<WithdrawPage />);
    await screen.findByText('bob');

    await user.click(screen.getByRole('button', { name: /check-circle Approve/ }));
    const popconfirmOk = await screen.findByRole('button', { name: 'Approve' });
    await user.click(popconfirmOk);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('finance/withdraw/approve', {
        orderNo: 'WD-9009',
      }),
    );
  });

  it('blocks rejection without a remark (no money state change on empty reason)', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce(listResponse([pendingWithdraw]) as never);

    renderWithProviders(<WithdrawPage />);
    await screen.findByText('bob');

    await user.click(screen.getByRole('button', { name: /Reject/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(mockedPost).not.toHaveBeenCalledWith(
      'finance/withdraw/reject',
      expect.anything(),
    );
  });
});

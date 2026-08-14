import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RechargePage from './RechargePage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useConfigStore } from '../store/configStore';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

interface RechargeRow {
  id: number;
  orderNo: string;
  userId: string;
  username?: string;
  phone?: string;
  userBalance?: number;
  amount: number;
  channel: string;
  gatewayMode?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface StatusCount {
  status: number;
  count: number;
  amount: number;
}

const pendingRow: RechargeRow = {
  id: 101,
  orderNo: 'RC-1001',
  userId: 'U500',
  username: 'alice',
  phone: '9876543210',
  userBalance: 1200,
  amount: 2500,
  channel: 'UPI',
  gatewayMode: 'manual',
  status: 0,
  createdAt: '2026-06-27T10:00:00',
  updatedAt: '2026-06-27T10:00:00',
};

const countsFor = (rows: RechargeRow[]): StatusCount[] => {
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

const listResponse = (rows: RechargeRow[]) => ({
  list: rows,
  total: rows.length,
  pageNo: 1,
  pageSize: 10,
  statusCounts: countsFor(rows),
});

describe('RechargePage (Deposit History)', () => {
  beforeEach(() => {
    useConfigStore.setState({
      statusMaps: {
        recharge: {
          0: { text: 'Pending', color: 'orange' },
          1: { text: 'Success', color: 'green' },
          2: { text: 'Failed', color: 'red' },
        },
      },
    });
    mockedPost.mockReset();
  });

  it('loads the pending recharge queue and renders each row', async () => {
    mockedPost.mockResolvedValueOnce(listResponse([pendingRow]) as never);

    renderWithProviders(<RechargePage />);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        'finance/recharge/list',
        expect.objectContaining({ pageNo: 1 }),
      ),
    );
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('@U500')).toBeInTheDocument();
    expect(screen.getAllByText('₹2,500.00').length).toBeGreaterThan(0);
  });

  it('summarises pending total amount from statusCounts in the stat cards', async () => {
    mockedPost.mockResolvedValueOnce(
      listResponse([
        pendingRow,
        { ...pendingRow, id: 102, orderNo: 'RC-1002', amount: 1500 },
      ]) as never,
    );

    renderWithProviders(<RechargePage />);

    await screen.findAllByText('alice');
    // Pending card amount = SUM(amount) of the two pending rows = ₹4,000.00
    expect(screen.getByText('₹4,000.00')).toBeInTheDocument();
    expect(screen.getByText('Pending Deposit')).toBeInTheDocument();
  });

  it('approves a pending recharge, calling the approve endpoint then refetching', async () => {
    const user = userEvent.setup();
    mockedPost
      .mockResolvedValueOnce(listResponse([pendingRow]) as never) // initial load
      .mockResolvedValueOnce({} as never) // approve
      .mockResolvedValueOnce(listResponse([]) as never); // refetch

    renderWithProviders(<RechargePage />);
    await screen.findByText('alice');

    await user.click(screen.getByRole('button', { name: /check-circle Approve/ }));
    // Popconfirm confirmation OK button reads plain 'Approve' (no icon).
    const popconfirmOk = await screen.findByRole('button', { name: 'Approve' });
    await user.click(popconfirmOk);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('finance/recharge/approve', {
        orderNo: 'RC-1001',
      }),
    );
  });

  it('requires a rejection reason — empty remark does not call the reject endpoint', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce(listResponse([pendingRow]) as never);

    renderWithProviders(<RechargePage />);
    await screen.findByText('alice');

    await user.click(screen.getByRole('button', { name: /Reject/i }));

    const dialog = await screen.findByRole('dialog');
    // Submit the reject modal without entering a reason.
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(mockedPost).not.toHaveBeenCalledWith(
      'finance/recharge/reject',
      expect.anything(),
    );
  });

  it('rejects with a reason, calling the reject endpoint with the remark', async () => {
    const user = userEvent.setup();
    mockedPost
      .mockResolvedValueOnce(listResponse([pendingRow]) as never) // load
      .mockResolvedValueOnce({} as never) // reject
      .mockResolvedValueOnce(listResponse([]) as never); // refetch

    renderWithProviders(<RechargePage />);
    await screen.findByText('alice');

    await user.click(screen.getByRole('button', { name: /Reject/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByPlaceholderText(/rejection reason/i),
      'Proof unclear',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('finance/recharge/reject', {
        orderNo: 'RC-1001',
        remark: 'Proof unclear',
      }),
    );
  });
});

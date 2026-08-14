import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThreeDigitDrawPanel from './ThreeDigitDrawPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import api from '../../../services/api';
import type {
  DrawPanelProps,
  SlatReadingResponse,
  GameInfo,
  RoundInfo,
} from './drawTypes';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

const game: GameInfo = {
  id: 50,
  gameName: 'Quick 3D',
  gameType: 'three_digit',
  themeColor: null,
  digitCount: 3,
};

const round: RoundInfo = {
  id: 900,
  roundNo: 'R-900',
  gameType: 'three_digit',
  status: 1,
  drawTime: null,
  result: null,
};

const reading: SlatReadingResponse = {
  gameId: 50,
  roundId: 900,
  roundNo: 'R-900',
  drawn: '456',
  isPreview: true,
  reading: {
    drawn: '456',
    labeled: [
      { index: 0, label: 'A', digit: '4' },
      { index: 1, label: 'B', digit: '5' },
      { index: 2, label: 'C', digit: '6' },
    ],
    readingText: 'A4 B5 C6',
    groups: [],
  },
  perProduct: [],
  perTier: [],
  perUser: [],
  tickets: [],
  totals: { totalSales: 0, totalPayout: 0, totalProfitLoss: 0 },
};

const baseProps = (
  onConfirm: DrawPanelProps['onConfirm'],
): DrawPanelProps => ({
  round,
  game,
  orders: [],
  ticketCount: 0,
  totalStake: 0,
  gameType: 'three_digit',
  ticketLength: 3,
  readOnly: false,
  positionColors: [],
  slatProducts: [],
  onConfirm,
});

describe('ThreeDigitDrawPanel (result-entry + length validation)', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue(reading as never);
  });

  it('keeps Confirm disabled until the full 3-digit result is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThreeDigitDrawPanel {...baseProps(vi.fn())} />);

    const confirm = screen.getByRole('button', { name: /Confirm/i });
    expect(confirm).toBeDisabled();

    const boxes = screen.getAllByRole('textbox');
    await user.type(boxes[0], '4');
    await user.type(boxes[1], '5');
    // Still one digit short — must stay disabled.
    expect(confirm).toBeDisabled();
  });

  it('does not request a slat reading before the result reaches full length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThreeDigitDrawPanel {...baseProps(vi.fn())} />);

    const boxes = screen.getAllByRole('textbox');
    await user.type(boxes[0], '4');
    await user.type(boxes[1], '5');

    // Below length -> no reading fetch.
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('fetches the slat reading and enables Confirm once length is satisfied', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThreeDigitDrawPanel {...baseProps(vi.fn())} />);

    const boxes = screen.getAllByRole('textbox');
    await user.type(boxes[0], '4');
    await user.type(boxes[1], '5');
    await user.type(boxes[2], '6');

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('slat-reading?drawResult=456'),
      ),
    );

    const confirm = screen.getByRole('button', { name: /Confirm/i });
    await waitFor(() => expect(confirm).toBeEnabled());
  });

  it('passes the entered result to onConfirm when settling', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithProviders(<ThreeDigitDrawPanel {...baseProps(onConfirm)} />);

    const boxes = screen.getAllByRole('textbox');
    await user.type(boxes[0], '4');
    await user.type(boxes[1], '5');
    await user.type(boxes[2], '6');

    const confirm = screen.getByRole('button', { name: /Confirm/i });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith('456');
  });
});

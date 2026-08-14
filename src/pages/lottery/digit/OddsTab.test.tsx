import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import OddsTab from './OddsTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import api from '../../../services/api';
import { type DigitGameDetail } from './digitShared';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const mockedGet = vi.mocked(api.get);

const detail = (digitCount: number) =>
  ({ id: 801, gameName: 'MUMBAI QUICK', gameCode: 'P4C',
     gameType: 'four_five_digit', digitCount }) as unknown as DigitGameDetail;

describe('Digit OddsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue([
      { id: 411, betType: 'exact4', odds: 9000, status: 1 },
      { id: 308, betType: 'exact5', odds: 90000, status: 1 },
      { id: 302, betType: 'first', odds: 9, status: 1 },
    ] as never);
  });

  it('explains that exact4 on a 5-digit game matches only the LAST 4 digits', async () => {
    renderWithProviders(<OddsTab detail={detail(5)} />);
    await waitFor(() => expect(screen.getByText('exact4')).toBeInTheDocument());
    expect(
      screen.getByText(/The LAST 4 digits must match/i),
    ).toBeInTheDocument();
  });

  it('shows exact5 as a full-match on a 5-digit game', async () => {
    renderWithProviders(<OddsTab detail={detail(5)} />);
    await waitFor(() => expect(screen.getByText('exact5')).toBeInTheDocument());
    expect(
      screen.getByText(/All 5 digits must match the draw exactly/i),
    ).toBeInTheDocument();
  });

  it('surfaces the true hit chance that justifies the odds', async () => {
    renderWithProviders(<OddsTab detail={detail(5)} />);
    await waitFor(() => expect(screen.getByText('exact4')).toBeInTheDocument());
    expect(screen.getByText('1 in 10,000')).toBeInTheDocument();
    expect(screen.getByText('1 in 100,000')).toBeInTheDocument();
  });

  it('warns about the biggest exposure on the book', async () => {
    renderWithProviders(<OddsTab detail={detail(5)} />);
    await waitFor(() =>
      expect(screen.getByText(/Highest exposure/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/pays 90,000x/i)).toBeInTheDocument();
  });

  it('loads odds from the shared odds endpoint', async () => {
    renderWithProviders(<OddsTab detail={detail(5)} />);
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('odds/801'));
  });
});

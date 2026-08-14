export enum DrawGameType {
  Kerala = 'kerala',
  ThreeDigit = 'three_digit',
  FourFiveDigit = 'four_five_digit',
  Dubai = 'dubai',
}

export const DEFAULT_TICKET_LENGTH: Record<string, number> = {
  [DrawGameType.Kerala]: 6,
  [DrawGameType.ThreeDigit]: 3,
  [DrawGameType.FourFiveDigit]: 5,
  [DrawGameType.Dubai]: 1,
};

export const SLAT_POSITION_ORDER = ['A', 'B', 'C', 'D', 'E'];

export interface PositionColorRow {
  position: number;
  color: string;
  gradient?: string;
}

export const positionColorList = (rows?: PositionColorRow[]): string[] => {
  if (!rows || rows.length === 0) return [];
  const max = rows.reduce((m, r) => Math.max(m, r.position), -1);
  const colors = new Array<string>(max + 1).fill('');
  for (const row of rows) colors[row.position] = row.color;
  return colors;
};

export interface GameConfig {
  ticketLength?: number;
}

export interface GameInfo {
  id: number;
  gameName?: string;
  gameType: string;
  themeColor?: string | null;
  digitCount?: number | null;
  numberMin?: number | null;
  numberMax?: number | null;
  configJson?: GameConfig | null;
}

export interface RoundResult {
  drawResult?: string | number;
  prefix?: string;
}

export interface RoundInfo {
  id: number;
  roundNo: string;
  gameType: string;
  status: number;
  drawTime: string | null;
  result?: RoundResult | null;
  proposedResult?: RoundResult | null;
  totalBet?: number;
  totalPayout?: number;
}

export interface PrizeTier {
  id: number;
  prizeTier: string;
  prizeName: string;
  prizeAmt: number;
}

export interface BetOrder {
  id: number;
  orderNo?: string;
  userId: string | number;
  betType: string;
  betContent?: Record<string, unknown> | null;
  totalAmount: number;
  status: number;
  winAmount: number;
  createdAt: string;
}

export interface DrawDetail {
  game: GameInfo;
  round: RoundInfo;
  ticketCount: number;
  uniquePlayers: number;
  totalStake: number;
  prizeTiers?: PrizeTier[];
  orders: BetOrder[];
}

export interface PreviewWinner {
  orderNo: string;
  userId: string | number;
  betContent?: Record<string, unknown> | null;
  amount: number;
  winAmount: number;
  prizeLevel?: string | number;
}

export interface PreviewData {
  proposedResult?: RoundResult;
  totalWinners: number;
  totalPayout: number;
  totalStake: number;
  profitLoss: number;
  winRate: number;
  winners?: PreviewWinner[];
}

export interface RecommendItem {
  result?: RoundResult;
  strategy: string;
  totalPayout: number;
  totalWinners: number;
  profitLoss: number;
  description?: string;
}

export interface SettleResponse {
  winnersNotified?: number;
}

export interface SlatLabeledPosition {
  index: number;
  label: string;
  digit: string;
}

export interface SlatWinningGroup {
  productId: number;
  title: string;
  matchMode: string;
  tierLabel: string;
  positions: number[];
  winningDigits: string;
  winAmount: number;
}

export interface SlatReadingView {
  drawn: string;
  labeled: SlatLabeledPosition[];
  readingText: string;
  groups: SlatWinningGroup[];
}

export interface SlatProductPnl {
  productId: number;
  title: string;
  salesQty: number;
  salesAmount: number;
  winnersQty: number;
  payout: number;
  profitLoss: number;
}

export interface SlatTierPnl {
  productId: number;
  tierLabel: string;
  winningDigits: string;
  winAmount: number;
  winnersQty: number;
  payout: number;
}

export interface SlatUserPnl {
  userId: string;
  stake: number;
  payout: number;
  net: number;
}

export interface SlatTicketPnl {
  orderNo: string;
  userId: string;
  productId: number;
  productTitle: string;
  betNumber: string;
  position: string;
  stake: number;
  payout: number;
  net: number;
  won: boolean;
}

export interface SlatReadingTotals {
  totalSales: number;
  totalPayout: number;
  totalProfitLoss: number;
}

export interface SlatReadingResponse {
  gameId: number;
  roundId: number;
  roundNo: string;
  drawn: string;
  isPreview: boolean;
  reading: SlatReadingView;
  perProduct: SlatProductPnl[];
  perTier: SlatTierPnl[];
  perUser: SlatUserPnl[];
  tickets: SlatTicketPnl[];
  totals: SlatReadingTotals;
}

export interface DrawPanelProps {
  round: RoundInfo;
  game: GameInfo;
  orders: BetOrder[];
  ticketCount: number;
  totalStake: number;
  gameType: string;
  ticketLength: number;
  readOnly: boolean;
  positionColors?: string[];
  slatProducts?: { tiers: { label: string; positions: number[] }[] }[];
  onConfirm: (drawResult: string, prefix?: string) => void;
}

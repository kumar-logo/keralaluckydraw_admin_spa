import type { CSSProperties } from 'react';
import type { PositionColorRow } from '../draw/drawTypes';

export interface DigitGameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  drawInterval: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  createdAt: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  emoji?: string;
  description?: string;
  autoGenerate?: number;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  digitCount?: number;
  maxPrize?: string;
  payRate?: number;
  quickCycleSec?: number;
  isQuick?: number;
  numberMin?: number;
  numberMax?: number;
  groupName?: string;
  isHot?: number;
  sortOrder?: number;
  stats: {
    totalRounds: number;
    completedRounds: number;
    totalBet: number;
    totalPayout: number;
    netRevenue: number;
    uniquePlayers: number;
  };
}

export interface PrizeTier {
  level: number;
  prizeLabel?: string;
  prizeValue: number;
}

export interface RuleSection {
  title: string;
  content: string;
}

export interface OddsRow {
  id?: number;
  betType: string;
  odds: number;
  status?: number;
}

export interface FeeRow {
  id: number;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
}

export interface ConfigScalar {
  digitCount?: number;
  maxPrize?: string;
  payRate?: number;
  quickCycleSec?: number;
  isQuick?: number;
  numberMin?: number;
  numberMax?: number;
}

export interface Pick4Config {
  pick4Price?: number;
  pick5Price?: number;
}

export interface PunjabConfig {
  canInsurance?: number;
}

export enum SlatMatchMode {
  Group = 'group',
  Ladder = 'ladder',
}

export interface SlatTierDto {
  label: string;
  positions: number[];
  winAmount: number;
  tierRank: number;
}

export interface SlatProductDto {
  id?: number;
  digitCount: number;
  price: number;
  matchMode: SlatMatchMode;
  title: string;
  status: number;
  tiers: SlatTierDto[];
}

export interface GameConfigResponse {
  gameType: string;
  scalar?: ConfigScalar;
  punjab?: PunjabConfig | null;
  pick4?: Pick4Config | null;
  prizeTiers?: { level: number; prize?: string; intPrize?: number }[];
  slatProducts?: SlatProductDto[];
  positionColors?: PositionColorRow[];
  rules?: unknown;
}

export interface ScheduleResponse {
  drawInterval?: number;
  config?: {
    roundDuration?: number;
    stopBetBefore?: number;
    drawDelay?: number;
    autoGenerate?: boolean;
    scheduledDrawTime?: string | null;
    scheduledDrawTimes?: string[] | null;
    startDate?: string | null;
    maxPrize?: string;
  };
}

export enum SlatGameType {
  ThreeDigit = 'three_digit',
  FourFiveDigit = 'four_five_digit',
}

export interface SlatLabeledPosition {
  index: number;
  label: string;
  digit: string;
}

export interface SlatReadingView {
  drawn: string;
  labeled: SlatLabeledPosition[];
  readingText: string;
}

export interface SlatProductPnlRow {
  productId: number;
  title: string;
  salesQty: number;
  salesAmount: number;
  winnersQty: number;
  payout: number;
  profitLoss: number;
}

export interface SlatTierPnlRow {
  productId: number;
  tierLabel: string;
  winningDigits: string;
  winAmount: number;
  winnersQty: number;
  payout: number;
}

export interface SlatUserPnlRow {
  userId: string;
  stake: number;
  payout: number;
  net: number;
}

export interface SlatReadingResponse {
  gameId: number;
  roundId: number;
  roundNo: string;
  drawn: string;
  reading: SlatReadingView;
  perProduct: SlatProductPnlRow[];
  perTier: SlatTierPnlRow[];
  perUser: SlatUserPnlRow[];
  totals: {
    totalSales: number;
    totalPayout: number;
    totalProfitLoss: number;
  };
}

export const ROUND_STATUS_SETTLED = 2;

export const SLAT_TIER_BALL_SIZE = 24;

export const PICK4_TYPES = [SlatGameType.FourFiveDigit as string];
export const SLAT_TYPES: string[] = [
  SlatGameType.ThreeDigit,
  SlatGameType.FourFiveDigit,
];

export const DEFAULT_SLAT_DIGIT_COUNT = 3;

export const DEFAULT_POSITION_PALETTE = [
  '#BE0000',
  '#FF8A00',
  '#007CEF',
  '#00B209',
  '#00C7CE',
];

export const defaultPositionColor = (position: number): string =>
  DEFAULT_POSITION_PALETTE[position] ??
  DEFAULT_POSITION_PALETTE[
    position % DEFAULT_POSITION_PALETTE.length
  ];

export const usesPick4Pricing = (t: string): boolean => PICK4_TYPES.includes(t);
export const usesSlatPricing = (t: string): boolean => SLAT_TYPES.includes(t);
export const usesInsurance = (t: string): boolean => t === 'punjab';

export const parsePositions = (raw: string): number[] =>
  raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number)
    .filter((value) => Number.isInteger(value));

export const formatPositions = (positions: number[]): string => positions.join(', ');

export const slatLabelSpan = (tier: SlatTierDto): number =>
  Math.max(tier.positions.length, tier.label.length);

export const deriveSlatLabels = (
  length: number,
  products: SlatProductDto[],
): string[] => {
  const labels = new Array<string>(length).fill('');
  let longest: SlatTierDto | null = null;
  for (const product of products) {
    for (const tier of product.tiers) {
      if (slatLabelSpan(tier) > (longest ? slatLabelSpan(longest) : 0)) {
        longest = tier;
      }
    }
  }
  if (!longest) return labels;
  const span = slatLabelSpan(longest);
  for (let k = 0; k < span; k++) {
    const index =
      longest.positions[k] !== undefined ? longest.positions[k] : k;
    if (index >= 0 && index < length) labels[index] = longest.label[k] ?? '';
  }
  return labels;
};

export const toHex = (c: unknown): string =>
  typeof c === 'string'
    ? c
    : (c as { toHexString?: () => string })?.toHexString?.() || '';

export const fmtDuration = (sec: number): string => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export const num = (v: unknown): number => Number(v ?? 0);

export const POSITION_FALLBACK_COLOR = '#d9d9d9';

export const summarizeResultObject = (value: unknown): string => {
  if (value === null || value === undefined) return 'pending';
  if (typeof value !== 'object') return String(value);
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) return 'pending';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? '…' : String(v)}`)
    .join(', ');
};

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout ⚠' },
  { value: 'max_profit', label: 'Maximum Profit ⚠' },
  { value: 'lowest_risk', label: 'Lowest Risk ⚠' },
  { value: 'manual', label: 'Manual Approval' },
];

export const FEE_TYPE_LABELS: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export const ENGINE_LABEL_STYLE: CSSProperties = {
  marginBottom: 4,
  fontWeight: 600,
  fontSize: 13,
};

export const ENGINE_HINT_STYLE: CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: 'var(--text-muted)',
};


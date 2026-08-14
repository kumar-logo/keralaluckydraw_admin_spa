import { firstString } from '../../../utils/format';

export interface SpinStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export interface SpinDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  categoryId?: number;
  source?: string;
  provider?: string;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  isHot?: number;
  isLottery?: number;
  isThirdParty?: number;
  groupName?: string;
  lotteryType?: string;
  drawInterval: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  maxPrize?: string;
  digitCount?: number;
  quickCycleSec?: number;
  isQuick?: number;
  sortOrder?: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  lobbyIconUrl?: string;
  imgId?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  emoji?: string;
  description?: string;
  payRate?: number;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  stats: SpinStats;
}

export interface WheelConfig {
  itemCount?: number;
  multipleCount?: number;
  freeSpins?: number;
  coverImgId?: string;
}

export interface WheelSegment {
  key: string;
  id?: number;
  name: string;
  prize: number;
  weight: number;
  odds: number;
  sortOrder: number;
}

export interface FeeRow {
  id: number;
  gameId: number;
  gameType: string;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
}

export interface RoundRow {
  id: number;
  roundNo: string;
  status: number;
  result: unknown;
  totalBet: number;
  totalPayout: number;
  drawTime: string;
  createdAt: string;
}

export interface RuleSection {
  title: string;
  content: string;
}

export interface DailyRow {
  date: string;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  orderCount: number;
  playerCount: number;
}

export interface TopPlayerRow {
  userId: string;
  totalBet: number;
  totalWin: number;
  winRate: number;
}

export interface ConfigScalar {
  digitCount?: number;
  maxPrize?: string;
  payRate?: number;
  quickCycleSec?: number;
  isQuick?: number;
}

export interface RawSegment {
  id?: number;
  name?: string;
  prize?: number | string;
  weight?: number | string;
  odds?: number | string;
  sortOrder?: number;
}

export interface ConfigResponse {
  gameId: number;
  gameType: string;
  scalar?: ConfigScalar;
  wheel?: WheelConfig | null;
  segments?: RawSegment[];
  rules?: unknown;
}

export const toHex = (c: unknown): string => {
  if (typeof c === 'string') return c;
  const obj = c as { toHexString?: () => string } | null;
  return obj?.toHexString?.() || '';
};

export const num = (v: unknown): number => Number(v ?? 0);

export const DEFAULT_SOURCE = 'TK';

export const DEFAULT_DRAW_INTERVAL = 60;

export const DEFAULT_STOP_BET_BEFORE = 10;

export const DEFAULT_DRAW_DELAY = 5;

export const DEFAULT_ITEM_COUNT = 12;

export const DEFAULT_MULTIPLE_COUNT = 30;

export const DEFAULT_RESULT_MODE = 'random';

export const SEGMENT_PALETTE = [
  '#f97316',
  '#6366f1',
  '#10b981',
  '#ef4444',
  '#0ea5e9',
  '#a855f7',
  '#eab308',
  '#ec4899',
  '#14b8a6',
  '#f43f5e',
  '#22c55e',
  '#8b5cf6',
];

export const segmentColor = (index: number): string =>
  SEGMENT_PALETTE[index % SEGMENT_PALETTE.length];

export let segmentKeySeq = 0;

export const nextSegmentKey = (): string => {
  segmentKeySeq += 1;
  return `seg-${segmentKeySeq}-${Date.now()}`;
};

export const normalizeRules = (raw: unknown): RuleSection[] => {
  const src = Array.isArray(raw)
    ? raw
    : (raw as { sections?: unknown[] })?.sections;
  if (Array.isArray(src))
    return src.map((s) => {
      if (typeof s === 'string') return { title: '', content: s };
      const o = s as { title?: string; content?: string; body?: string };
      return {
        title: firstString(o.title),
        content: firstString(o.content, o.body),
      };
    });
  if (typeof raw === 'string' && raw.trim()) return [{ title: '', content: raw }];
  return [];
};

export const INTERVAL_PRESETS = [
  { value: 30, label: '30 Seconds' },
  { value: 60, label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' },
  { value: 300, label: '5 Minutes' },
  { value: 600, label: '10 Minutes' },
  { value: 0, label: 'Manual / On-demand' },
];

export const SOURCE_OPTIONS = [
  { value: 'TK', label: 'TK (In-house)' },
  { value: 'THIRD', label: 'Third Party' },
];

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout (warn)' },
  { value: 'max_profit', label: 'Maximum Profit (warn)' },
  { value: 'lowest_risk', label: 'Lowest Risk (warn)' },
  { value: 'manual', label: 'Manual Approval' },
];

export const STATUS_OPTIONS = [
  { value: 1, label: 'Active' },
  { value: 0, label: 'Disabled' },
];

export const cardStyle = { borderRadius: 12, marginBottom: 16 };

export interface BasicForm {
  gameCode?: string;
  gameName?: string;
  status?: number;
  source?: string;
  provider?: string;
  groupName?: string;
  categoryId?: number;
  sortOrder?: number;
  isHot?: boolean;
  lobbyIconUrl?: string;
  imgId?: string;
}

export interface ConfigFormValues {
  minBet?: number;
  maxBet?: number;
  sellingPrice?: number;
  maxPrize?: string;
  payRate?: number;
  drawInterval?: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: boolean;
  itemCount?: number;
  multipleCount?: number;
  freeSpins?: number;
  isQuick?: boolean;
  quickCycleSec?: number;
}

export const feeTypeLabels: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export interface ResultConfigState {
  resultMode: string;
  houseEdgeTarget?: number;
  holdForApproval?: number;
  avoidBigPrize?: number;
  avoidZeroOrder?: number;
}

export interface UiFormValues {
  emoji?: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  themeColor?: unknown;
  bgColor?: unknown;
  textColor?: unknown;
  borderColor?: unknown;
}

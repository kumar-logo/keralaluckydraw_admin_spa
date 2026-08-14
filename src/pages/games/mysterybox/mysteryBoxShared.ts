import { firstString } from '../../../utils/format';

export interface BoxStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export interface BoxDetail {
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
  drawInterval: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  maxPrize?: string;
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
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  stats: BoxStats;
}

export interface BoxConfig {
  coinType?: number;
  freeCount?: number;
  iconImgId?: string;
  coverImgId?: string;
  iconUrl?: string;
}

export interface BoxItem {
  id?: number;
  itemId: number;
  name: string;
  prize: number;
  rate: number;
  iconUrl: string;
  imgId: string;
  linkUrl: string;
  sortOrder: number;
}

export interface BoxGradient {
  id?: number;
  gradient: string;
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

export interface ConfigResponse {
  gameId: number;
  gameType: string;
  scalar?: {
    maxPrize?: string;
    freeCount?: number;
  };
  box?: BoxConfig | null;
  boxItems?: BoxItem[];
  gradients?: BoxGradient[];
  rules?: unknown;
}

export const toHex = (c: unknown): string => {
  if (typeof c === 'string') return c;
  const obj = c as { toHexString?: () => string } | null;
  return obj?.toHexString?.() || '';
};

export const fmtDuration = (sec?: number): string => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export const num = (v: unknown): number => Number(v ?? 0);

export const str = (v: unknown): string => (v == null ? '' : String(v));

export const DEFAULT_SOURCE = 'TK';

export const DEFAULT_DRAW_INTERVAL = 60;

export const DEFAULT_STOP_BET_BEFORE = 10;

export const DEFAULT_DRAW_DELAY = 5;

export const DEFAULT_COIN_TYPE = 1;

export const DEFAULT_RESULT_MODE = 'random';

export const DEFAULT_GRADIENT = '#eee';

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

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout (warn)' },
  { value: 'max_profit', label: 'Maximum Profit (warn)' },
  { value: 'lowest_risk', label: 'Lowest Risk (warn)' },
  { value: 'manual', label: 'Manual Approval' },
];

export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
];

export const feeTypeLabels: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export type GameType = 'kerala';

export interface GameStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export const EMPTY_GAME_STATS: GameStats = {
  totalRounds: 0,
  completedRounds: 0,
  totalBet: 0,
  totalPayout: 0,
  netRevenue: 0,
  uniquePlayers: 0,
};

export interface GameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: GameType;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  drawInterval: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  maxPrize?: string;
  groupName?: string;
  sortOrder?: number;
  emoji?: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  createdAt?: string;
  stats?: GameStats;
}

export interface KeralaConfig {
  ticketLength?: number;
  canInsurance?: number;
  insuranceRate?: number;
  prefix1st?: string;
  secondCount?: number;
  thirdCount?: number;
  fourthCount?: number;
  fifthCount?: number;
  consolationCount?: number;
}

export interface PrizeTier {
  level: number;
  prizeLabel?: string;
  prizeValue: number;
  tierName?: string;
  matchRule?: string;
}

export const PRIZE_TIER_OPTIONS = [
  { value: 'first', label: '1st — full number' },
  { value: 'second', label: '2nd — full number' },
  { value: 'third', label: '3rd — full number' },
  { value: 'fourth', label: '4th — full number' },
  { value: 'fifth', label: '5th — full number' },
  { value: 'consolation', label: 'Consolation — full number' },
  { value: 'last4', label: 'Last 4 digits' },
  { value: 'last3', label: 'Last 3 digits' },
  { value: 'last2', label: 'Last 2 digits' },
  { value: 'last1', label: 'Last 1 digit' },
];

export interface ConfigResponse {
  scalar?: { maxPrize?: string };
  kerala?: KeralaConfig;
  prizeTiers?: Array<{
    level: number;
    prize?: string;
    prizeLabel?: string;
    intPrize?: number;
    prizeValue?: number;
    tierName?: string;
    matchRule?: string;
  }>;
  prefixes?: string[];
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
  };
}

export interface FeeRow {
  id: number;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
}

export interface RoundRow {
  id: number;
  roundNo: string;
  status: number;
  result?: unknown;
  totalBet?: number;
  totalPayout?: number;
  drawTime?: string;
  manualResult?: number;
}

export interface RuleSection {
  title: string;
  content: string;
}

export type ColorValue = string | { toHexString?: () => string };

export const toHex = (c: ColorValue): string =>
  typeof c === 'string' ? c : c?.toHexString?.() || '';

export const fmtDuration = (sec?: number): string => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export const num = (v: unknown): number => Number(v ?? 0);

export const formLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export const cardStyle: React.CSSProperties = { borderRadius: 12, marginBottom: 16 };

export const INTERVAL_OPTIONS = [
  { value: 30, label: '30 Seconds' },
  { value: 60, label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' },
  { value: 300, label: '5 Minutes' },
  { value: 600, label: '10 Minutes' },
  { value: 900, label: '15 Minutes' },
  { value: 1800, label: '30 Minutes' },
  { value: 3600, label: '1 Hour' },
  { value: 86400, label: '1 Day' },
];

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout ⚠' },
  { value: 'max_profit', label: 'Maximum Profit ⚠' },
  { value: 'lowest_risk', label: 'Lowest Risk ⚠' },
  { value: 'manual', label: 'Manual Approval' },
];

export const normalizeRules = (raw: unknown): RuleSection[] => {
  const src = Array.isArray(raw)
    ? raw
    : (raw as { sections?: unknown[] })?.sections;
  if (Array.isArray(src))
    return src.map((s) => {
      if (typeof s === 'string') return { title: '', content: s };
      const obj = s as Record<string, string>;
      return {
        title: obj.title || '',
        content: obj.content || obj.body || obj.text || '',
      };
    });
  if (typeof raw === 'string' && raw.trim())
    return [{ title: '', content: raw }];
  return [];
};

export const feeTypeLabels: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export const PRIZE_COUNT_FIELDS: Array<{ name: keyof KeralaConfig; label: string }> = [
  { name: 'secondCount', label: '2nd Prize Winners' },
  { name: 'thirdCount', label: '3rd Prize Winners' },
  { name: 'fourthCount', label: '4th Prize Winners' },
  { name: 'fifthCount', label: '5th Prize Winners' },
  { name: 'consolationCount', label: 'Consolation Winners' },
];

export interface PnlSummary {
  totalBet: number;
  totalPayout: number;
  profit: number;
  margin: number;
}

export interface PnlResponse {
  summary?: PnlSummary;
  uniquePlayers?: number;
}

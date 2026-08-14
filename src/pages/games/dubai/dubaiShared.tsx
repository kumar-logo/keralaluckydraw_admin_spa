import { type Color } from 'antd/es/color-picker';
import { firstString } from '../../../utils/format';
import { type StatusEntry } from '../../../store/configStore';

export const EMPTY_STATUS_MAP: Record<number, StatusEntry> = {};

export interface GameStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export interface GameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  status: number;
  isPaused: number;
  isHidden: number;
  isHot?: number;
  emergencyStop: number;
  drawInterval: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  sortOrder?: number;
  createdAt: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  lobbyIconUrl?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  emoji?: string;
  description?: string;
  groupName?: string;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  digitCount?: number;
  numberMin?: number;
  numberMax?: number;
  maxPrize?: string;
  payRate?: number;
  quickCycleSec?: number;
  isQuick?: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  stats: GameStats;
}

export interface ScalarConfig {
  maxPrize?: string;
  payRate?: number;
  quickCycleSec?: number;
  digitCount?: number;
  isQuick?: number;
  numberMin?: number;
  numberMax?: number;
}

export interface GameConfig {
  scalar?: ScalarConfig;
  rules?: RuleSection[] | { sections?: RuleSection[] } | string;
  assets?: { assetType: string; number: number | null; url: string }[];
}

export interface OddsRow {
  id: number;
  gameId: number;
  gameType: string;
  betType: string;
  odds: number;
  status: number;
}

export interface OddsConfigResponse {
  gameId: number;
  odds: OddsRow[];
}

export interface FeeRow {
  id: number;
  gameId: number;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
}

export interface RoundRow {
  id: number;
  roundNo: string;
  status: number;
  drawTime?: string;
  result?: unknown;
  totalBet?: number;
  totalPayout?: number;
  manualResult?: number;
}

export interface RuleSection {
  title: string;
  content: string;
}

export interface ScheduleConfig {
  roundDuration?: number;
  stopBetBefore?: number;
  drawDelay?: number;
  autoGenerate?: boolean;
  scheduledDrawTime?: string | null;
  scheduledDrawTimes?: string[] | null;
  startDate?: string | null;
}

export interface ScheduleResponse {
  config?: ScheduleConfig;
  drawInterval?: number;
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

export interface StatsResponse {
  daily?: DailyRow[];
  topPlayers?: TopPlayerRow[];
}

export interface ResultConfig {
  resultMode: string;
  houseEdgeTarget?: number;
  holdForApproval?: number | boolean;
  avoidBigPrize?: number | boolean;
  avoidZeroOrder?: number | boolean;
}

export interface PageList<T> {
  list?: T[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
}

export const GAME_TYPE = 'dubai';

export const toHex = (c: Color | string | undefined): string =>
  typeof c === 'string' ? c : c?.toHexString?.() || '';

export const fmtDuration = (sec?: number): string => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export const num = (v: unknown): number => Number(v ?? 0);

export const DEFAULT_DRAW_INTERVAL = 60;

export const DEFAULT_STOP_BET_BEFORE = 10;

export const DEFAULT_DRAW_DELAY = 5;

export const DEFAULT_RESULT_MODE = 'random';

export const DEFAULT_NUMBER_MIN = 1;

export const DEFAULT_NUMBER_MAX = 36;

export const normalizeRules = (rj: GameConfig['rules']): RuleSection[] => {
  const src = Array.isArray(rj)
    ? rj
    : rj && typeof rj === 'object'
      ? rj.sections
      : undefined;
  if (Array.isArray(src))
    return src.map((s) =>
      typeof s === 'string'
        ? { title: '', content: s }
        : { title: firstString(s.title), content: firstString(s.content) },
    );
  if (typeof rj === 'string' && rj.trim()) return [{ title: '', content: rj }];
  return [];
};

export const feeTypeLabels: Record<string, string> = {
  win_deduction: 'Win Deduction',
};

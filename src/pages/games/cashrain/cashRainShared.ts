import { firstString } from '../../../utils/format';

export interface CashRainStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export interface CashRainDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  minBet?: number;
  maxBet?: number;
  sellingPrice?: number;
  maxPrize?: string;
  payRate?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  stats: CashRainStats;
}

export interface RuleSection {
  title: string;
  content: string;
}

export interface ConfigResponse {
  gameId: number;
  gameType: string;
  rules?: unknown;
  scalar?: { maxPrize?: string; payRate?: number };
}

export interface RoundRow {
  id: number;
  roundNo: string;
  status: number;
  result?: unknown;
  drawTime?: string;
  totalBet?: number;
  totalPayout?: number;
}

export interface RoundsResponse {
  list: RoundRow[];
  total: number;
  pageNo?: number;
  pageSize?: number;
}

export interface CashRainOrderRow {
  id: number;
  orderNo: string;
  userId: string;
  userNickname?: string;
  userAvatar?: string;
  roundNo: string;
  winAmount: number;
  isBonus: number;
  status: number;
  createdAt?: string;
  settledAt?: string;
}

export interface OrdersResponse {
  list: CashRainOrderRow[];
  total: number;
  pageNo?: number;
  pageSize?: number;
}

export interface DailyStatRow {
  date: string;
  totalBet?: number;
  totalPayout?: number;
  netRevenue?: number;
  orderCount?: number;
  playerCount?: number;
}

export interface StatsResponse {
  daily?: DailyStatRow[];
}

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
  if (typeof raw === 'string' && raw.trim())
    return [{ title: '', content: raw }];
  return [];
};

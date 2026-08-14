import { ResultBall } from '../../../components/ResultBall';

export interface GameStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export interface ColorGameDetail {
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
  sortOrder?: number;
  drawInterval: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  quickCycleSec?: number;
  isQuick?: number;
  digitCount?: number;
  fivedBigSmallThreshold?: number;
  minBet: number;
  maxBet: number;
  sellingPrice?: number;
  maxPrize?: string;
  payRate?: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  lobbyIconUrl?: string;
  imgId?: number;
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
  createdAt?: string;
  stats: GameStats;
}

export interface OddsRow {
  id: number;
  gameId: number;
  gameType: string;
  betType: string;
  odds: number;
  status: number;
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
  gameType: string;
  status: number;
  resultStatus?: number;
  resultMode?: string;
  drawTime?: string;
  stopBetTime?: string;
  result?: unknown;
  proposedResult?: unknown;
  manualResult?: number;
  totalBet?: number;
  totalPayout?: number;
  settledBy?: number;
  proposedBy?: number;
  approvedBy?: number;
  approvedAt?: string;
}

export interface RuleSection {
  title: string;
  content: string;
  sortOrder?: number;
}

export interface ColorMapRow {
  id?: number;
  digit: number;
  color: string;
  sortOrder?: number;
}

export interface ScheduleConfig {
  roundDuration?: number;
  drawInterval?: number;
  stopBetBefore?: number;
  drawDelay?: number;
  autoGenerate?: boolean;
}

export interface StatsResponse {
  summary?: Partial<GameStats> & { profit?: number; margin?: number };
  daily?: Array<{
    date: string;
    totalBet?: number;
    totalPayout?: number;
    netRevenue?: number;
    orderCount?: number;
    playerCount?: number;
  }>;
  topPlayers?: Array<{
    userId: string | number;
    totalBet?: number;
    totalWin?: number;
    winRate?: number;
    orderCount?: number;
  }>;
}

export type AntColor = string | { toHexString?: () => string };

export const DEFAULT_DRAW_INTERVAL = 60;

export const DEFAULT_STOP_BET_BEFORE = 10;

export const DEFAULT_DRAW_DELAY = 5;

export const DEFAULT_RESULT_MODE = 'random';

export const toHex = (c: AntColor): string =>
  typeof c === 'string' ? c : c?.toHexString?.() || '';

export const fmtDuration = (sec?: number): string => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export const BALL_COLORS = ['red', 'green', 'violet'] as const;

export type BallColor = (typeof BALL_COLORS)[number];

export const COLOR_HEX: Record<BallColor, string> = {
  red: '#be0000',
  green: '#109216',
  violet: '#670fbf',
};

export const COLOR_OPTIONS: { value: BallColor; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'violet', label: 'Violet' },
];

export const isBallColor = (c: string): c is BallColor =>
  (BALL_COLORS as readonly string[]).includes(c);

export const ballBackground = (colors: BallColor[]): string => {
  if (colors.length === 0) return '#94a3b8';
  if (colors.length === 1) return COLOR_HEX[colors[0]];
  return `linear-gradient(315deg, ${COLOR_HEX[colors[1]]} 50.5%, ${COLOR_HEX[colors[0]]} 51.88%)`;
};

export const COLOR_BET_TYPES = [
  'red',
  'green',
  'violet',
  'green_violet',
  'red_violet',
  'big',
  'small',
  'number',
  'number_0',
  'number_1',
  'number_2',
  'number_3',
  'number_4',
  'number_5',
  'number_6',
  'number_7',
  'number_8',
  'number_9',
];

export const BET_TYPE_LABELS: Record<string, string> = {
  red: 'Red',
  green: 'Green',
  violet: 'Violet',
  green_violet: 'Green + Violet',
  red_violet: 'Red + Violet',
  big: 'Big (5–9)',
  small: 'Small (0–4)',
  number: 'Exact Number',
  number_0: 'Number 0',
  number_1: 'Number 1',
  number_2: 'Number 2',
  number_3: 'Number 3',
  number_4: 'Number 4',
  number_5: 'Number 5',
  number_6: 'Number 6',
  number_7: 'Number 7',
  number_8: 'Number 8',
  number_9: 'Number 9',
};

export const BET_TYPE_COLORS: Record<string, BallColor[]> = {
  red: ['red'],
  green: ['green'],
  violet: ['violet'],
  green_violet: ['green', 'violet'],
  red_violet: ['red', 'violet'],
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

export const Ball = ({
  digit,
  colors,
  size = 44,
}: {
  digit: number | string;
  colors: BallColor[];
  size?: number;
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '50%',
      background: ballBackground(colors),
      color: '#fff',
      fontSize: size * 0.42,
      fontWeight: 700,
      lineHeight: 1,
      flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    }}
  >
    {digit}
  </span>
);

export interface DigitColorRow {
  digit: number;
  colors: BallColor[];
}

export const WingoDigitPicker = ({
  value,
  onChange,
  numberColors,
  palette,
}: {
  value?: number;
  onChange?: (value: number) => void;
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
    }}
  >
    {Array.from({ length: 10 }, (_, digit) => {
      const selected = value === digit;
      return (
        <button
          key={digit}
          type="button"
          onClick={() => onChange?.(digit)}
          aria-pressed={selected}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 4,
            borderRadius: '50%',
            cursor: 'pointer',
            opacity: value === undefined || selected ? 1 : 0.35,
            outline: selected ? '2px solid var(--ant-color-primary, #1677ff)' : 'none',
            outlineOffset: 2,
            transition: 'opacity 0.15s ease',
          }}
        >
          <ResultBall
            value={digit}
            type="wingo"
            size={44}
            numberColors={numberColors}
            palette={palette}
          />
        </button>
      );
    })}
  </div>
);

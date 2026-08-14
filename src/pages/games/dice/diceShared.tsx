import { formatDateTime } from '../../../utils/format';

export interface DiceStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  totalOrders: number;
  uniquePlayers: number;
  activeRounds: number;
}

export interface DiceGameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  categoryId?: number;
  source?: string;
  provider?: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  lobbyIconUrl?: string;
  imgId?: string;
  drawInterval: number;
  sellingPrice?: number;
  minBet: number;
  maxBet: number;
  isHot?: number;
  isLottery?: number;
  isThirdParty?: number;
  groupName?: string;
  lotteryType?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  emoji?: string;
  description?: string;
  sortOrder?: number;
  status: number;
  isHidden: number;
  isPaused: number;
  emergencyStop: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  maxPrize?: string;
  digitCount?: number;
  quickCycleSec?: number;
  isQuick?: number;
  payRate?: number;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  stats: DiceStats;
}

export interface OddsRow {
  id: number;
  gameId: number;
  betType: string;
  odds: number;
  status: number;
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
  result?: unknown;
  totalBet?: number;
  totalPayout?: number;
  drawTime?: string;
  manualResult?: number;
  resultStatus?: number;
}

export interface RuleSection {
  title: string;
  content: string;
}

export interface DailyStatRow {
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
  winRate?: number;
  orderCount?: number;
}

export interface DiceConfigResponse {
  gameId: number;
  gameType: string;
  scalar: {
    digitCount?: number;
    maxPrize?: string;
    payRate?: number;
    quickCycleSec?: number;
    isQuick?: number;
  };
  colorPalette?: { colorKey: string; hex: string }[];
  rules?: unknown;
}

export const DICE_DEFAULTS = { diceCount: 3, diceFaces: 6, bigSmallThreshold: 10 };

export interface DiceBetTypeRef {
  code: string;
  group: string;
  meaning: string;
  defaultOdds: number;
}

export const DICE_BET_TYPES: DiceBetTypeRef[] = [
  { code: 'sum_big', group: 'Sum', meaning: 'Sum > threshold (non-triple)', defaultOdds: 2 },
  { code: 'sum_small', group: 'Sum', meaning: 'Sum <= threshold (non-triple)', defaultOdds: 2 },
  { code: 'sum_odd', group: 'Sum', meaning: 'Sum is odd (non-triple)', defaultOdds: 2 },
  { code: 'sum_even', group: 'Sum', meaning: 'Sum is even (non-triple)', defaultOdds: 2 },
  { code: 'sum_three', group: 'Sum', meaning: 'Exact sum = 3', defaultOdds: 150 },
  { code: 'sum_four', group: 'Sum', meaning: 'Exact sum = 4', defaultOdds: 50 },
  { code: 'sum_five', group: 'Sum', meaning: 'Exact sum = 5', defaultOdds: 30 },
  { code: 'sum_six', group: 'Sum', meaning: 'Exact sum = 6', defaultOdds: 18 },
  { code: 'sum_seven', group: 'Sum', meaning: 'Exact sum = 7', defaultOdds: 12 },
  { code: 'sum_eight', group: 'Sum', meaning: 'Exact sum = 8', defaultOdds: 8 },
  { code: 'sum_nine', group: 'Sum', meaning: 'Exact sum = 9', defaultOdds: 7 },
  { code: 'sum_ten', group: 'Sum', meaning: 'Exact sum = 10', defaultOdds: 6 },
  { code: 'sum_eleven', group: 'Sum', meaning: 'Exact sum = 11', defaultOdds: 6 },
  { code: 'sum_twelve', group: 'Sum', meaning: 'Exact sum = 12', defaultOdds: 7 },
  { code: 'sum_thirteen', group: 'Sum', meaning: 'Exact sum = 13', defaultOdds: 8 },
  { code: 'sum_fourteen', group: 'Sum', meaning: 'Exact sum = 14', defaultOdds: 12 },
  { code: 'sum_fifteen', group: 'Sum', meaning: 'Exact sum = 15', defaultOdds: 18 },
  { code: 'sum_sixteen', group: 'Sum', meaning: 'Exact sum = 16', defaultOdds: 30 },
  { code: 'sum_seventeen', group: 'Sum', meaning: 'Exact sum = 17', defaultOdds: 50 },
  { code: 'sum_eighteen', group: 'Sum', meaning: 'Exact sum = 18', defaultOdds: 150 },
  { code: 'single_one', group: 'Single', meaning: 'Any die shows 1', defaultOdds: 1.5 },
  { code: 'single_two', group: 'Single', meaning: 'Any die shows 2', defaultOdds: 1.5 },
  { code: 'single_three', group: 'Single', meaning: 'Any die shows 3', defaultOdds: 1.5 },
  { code: 'single_four', group: 'Single', meaning: 'Any die shows 4', defaultOdds: 1.5 },
  { code: 'single_five', group: 'Single', meaning: 'Any die shows 5', defaultOdds: 1.5 },
  { code: 'single_six', group: 'Single', meaning: 'Any die shows 6', defaultOdds: 1.5 },
  { code: 'double_one', group: 'Double', meaning: 'Two or more dice show 1', defaultOdds: 11 },
  { code: 'double_two', group: 'Double', meaning: 'Two or more dice show 2', defaultOdds: 11 },
  { code: 'double_three', group: 'Double', meaning: 'Two or more dice show 3', defaultOdds: 11 },
  { code: 'double_four', group: 'Double', meaning: 'Two or more dice show 4', defaultOdds: 11 },
  { code: 'double_five', group: 'Double', meaning: 'Two or more dice show 5', defaultOdds: 11 },
  { code: 'double_six', group: 'Double', meaning: 'Two or more dice show 6', defaultOdds: 11 },
  { code: 'leopard_any', group: 'Leopard', meaning: 'Any triple', defaultOdds: 30 },
  { code: 'leopard_one', group: 'Leopard', meaning: 'Triple ones', defaultOdds: 180 },
  { code: 'leopard_two', group: 'Leopard', meaning: 'Triple twos', defaultOdds: 180 },
  { code: 'leopard_three', group: 'Leopard', meaning: 'Triple threes', defaultOdds: 180 },
  { code: 'leopard_four', group: 'Leopard', meaning: 'Triple fours', defaultOdds: 180 },
  { code: 'leopard_five', group: 'Leopard', meaning: 'Triple fives', defaultOdds: 180 },
  { code: 'leopard_six', group: 'Leopard', meaning: 'Triple sixes', defaultOdds: 180 },
];

export const DICE_BET_BY_CODE: Record<string, DiceBetTypeRef> = Object.fromEntries(
  DICE_BET_TYPES.map((b) => [b.code, b]),
);

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout (biased)' },
  { value: 'max_profit', label: 'Maximum Profit (biased)' },
  { value: 'lowest_risk', label: 'Lowest Risk (biased)' },
  { value: 'manual', label: 'Manual Approval' },
];

export const DRAW_INTERVAL_OPTIONS = [
  { value: 30, label: '30 Seconds' },
  { value: 60, label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' },
  { value: 300, label: '5 Minutes' },
  { value: 600, label: '10 Minutes' },
];

export const FEE_TYPE_LABELS: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export const toHex = (c: unknown): string => {
  if (typeof c === 'string') return c;
  if (c && typeof (c as { toHexString?: () => string }).toHexString === 'function')
    return (c as { toHexString: () => string }).toHexString();
  return '';
};

export const fmtMoney = (v: unknown) => Number(v ?? 0).toFixed(2);

export const DEFAULT_DRAW_INTERVAL = 60;

export const DEFAULT_STOP_BET_BEFORE = 10;

export const DEFAULT_DRAW_DELAY = 5;

export const DEFAULT_LOTTERY_TYPE = 'auto';

export const DEFAULT_RESULT_MODE = 'random';

export const DEFAULT_BET_GROUP = 'Other';

export const titleOf = (s: unknown): string => {
  const title = (s as { title?: string }).title;
  return title ? title : '';
};

export const fmtDateTime = (v?: string) => formatDateTime(v);

export const DICE_PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export const DiceFacePips = ({
  value,
  size = 44,
  active = false,
}: {
  value: number;
  size?: number;
  active?: boolean;
}) => {
  const pipsForValue = DICE_PIP_MAP[value];
  const pips = Array.isArray(pipsForValue) ? pipsForValue : [];
  const dot = Math.max(4, Math.round(size * 0.16));
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(145deg,#ffffff,#eef1f5)',
        border: active ? '2px solid var(--primary)' : '1px solid #cbd5e1',
        boxShadow: active
          ? '0 0 0 3px rgba(99,102,241,.22), inset 0 1px 2px rgba(255,255,255,.9)'
          : 'inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.15)',
        display: 'inline-grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        placeItems: 'center',
        padding: size * 0.12,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          style={{
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: pips.includes(i) ? '#1f2937' : 'transparent',
          }}
        />
      ))}
    </span>
  );
};

export const DiceFaceSelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {Array.from({ length: DICE_DEFAULTS.diceFaces }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        aria-label={`Die face ${n}`}
        aria-pressed={value === n}
        style={{
          padding: 2,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          lineHeight: 0,
        }}
      >
        <DiceFacePips value={n} size={40} active={value === n} />
      </button>
    ))}
  </div>
);

export interface TabProps {
  detail: DiceGameDetail;
  reload: () => void;
}

export const normalizeRules = (rj: unknown): RuleSection[] => {
  const src = Array.isArray(rj)
    ? rj
    : (rj as { sections?: unknown[] })?.sections;
  if (Array.isArray(src))
    return src.map((s) =>
      typeof s === 'string'
        ? { title: '', content: s }
        : {
            title: titleOf(s),
            content:
              (s as { content?: string; body?: string; text?: string }).content ||
              (s as { body?: string }).body ||
              (s as { text?: string }).text ||
              '',
          },
    );
  if (typeof rj === 'string' && rj.trim()) return [{ title: '', content: rj }];
  return [];
};

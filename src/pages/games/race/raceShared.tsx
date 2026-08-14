import { Tag, Space } from 'antd';
import RaceResult from '../../../components/RaceResult';
import { RaceRunner, PlayerBadge, RankBadge, getRunnerState } from '../../../components/RaceBadges';
import { formatDateTime, firstString } from '../../../utils/format';

export interface RaceStats {
  totalRounds: number;
  completedRounds: number;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  uniquePlayers: number;
}

export const EMPTY_RACE_STATS: RaceStats = {
  totalRounds: 0,
  completedRounds: 0,
  totalBet: 0,
  totalPayout: 0,
  netRevenue: 0,
  uniquePlayers: 0,
};

export interface RaceGameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  isHot?: number;
  isLottery?: number;
  isThirdParty?: number;
  groupName?: string;
  lotteryType?: string;
  categoryId?: number;
  source?: string;
  provider?: string;
  sortOrder?: number;
  drawInterval: number;
  sellingPrice?: number;
  minBet: number;
  maxBet: number;
  stopBetBeforeSec?: number;
  drawDelaySec?: number;
  autoGenerate?: number;
  maxPrize?: string;
  digitCount?: number;
  quickCycleSec?: number;
  isQuick?: number;
  payRate?: number;
  emoji?: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  lobbyIconUrl?: string;
  resultMode?: string;
  resultHouseEdgeTarget?: number;
  resultHoldForApproval?: number;
  resultAvoidBigPrize?: number;
  resultAvoidZeroOrder?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  stats?: RaceStats;
}

export interface RaceConfigScope {
  runnerCount?: number;
  raceFrames?: number;
}

export interface GameConfigResponse {
  gameId: number;
  gameType: string;
  scalar?: {
    digitCount?: number;
    maxPrize?: string;
    payRate?: number;
    quickCycleSec?: number;
    isQuick?: number;
  };
  race?: RaceConfigScope | null;
  raceRunners?: {
    name: string;
    nameShort: string;
    colorHex: string;
    spriteKey: string | null;
  }[];
  rules?: unknown;
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
  gameType?: string;
  status: number;
  drawTime?: string;
  result?: unknown;
  totalBet?: number;
  totalPayout?: number;
  manualResult?: number;
  resultStatus?: number;
  resultMode?: string;
  settledBy?: number | string;
  createdAt?: string;
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
  userId: string | number;
  totalBet: number;
  totalWin: number;
  winRate: number;
}

export interface ColorLike {
  toHexString?: () => string;
}

export const SINGLE_RUNNER_COUNT = 6;

export const RACE_STATE_NAMES = [
  'Kerala',
  'Tamil Nadu',
  'Madhya Pradesh',
  'Maharashtra',
  'Karnataka',
  'Nagaland',
];

export const RACE_STATE_SHORT = ['KL', 'TN', 'MP', 'MH', 'KA', 'NL'];

export const RACE_STATE_VARS = [
  '--race-kerala',
  '--race-tamil',
  '--race-mp',
  '--race-mh',
  '--race-ka',
  '--race-nl',
];

export const RESULT_MODE_OPTIONS = [
  { value: 'random', label: 'Random (fair)' },
  { value: 'weighted', label: 'Weighted' },
  { value: 'min_payout', label: 'Minimum Payout (biased)' },
  { value: 'max_profit', label: 'Maximum Profit (biased)' },
  { value: 'lowest_risk', label: 'Lowest Risk (biased)' },
  { value: 'manual', label: 'Manual' },
];

export const raceStateName = (index: number): string =>
  RACE_STATE_NAMES[index] ?? `Lane ${index + 1}`;

export const raceStateShort = (index: number): string =>
  RACE_STATE_SHORT[index] ?? `L${index + 1}`;

export const raceStateVar = (index: number): string =>
  RACE_STATE_VARS[index % RACE_STATE_VARS.length];

export const clampLaneCount = (count: unknown): number => {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n)) return 6;
  return Math.min(20, Math.max(2, n));
};

export const RaceLanePreview = ({ count }: { count: number }) => {
  const lanes = Array.from({ length: clampLaneCount(count) }, (_, i) => i);
  return (
    <Space size={8} wrap>
      {lanes.map((i) => (
        <Tag
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 8,
            margin: 0,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'inline-block',
              background: `var(${raceStateVar(i)})`,
              border: '1px solid var(--border-light)',
            }}
          />
          <span style={{ fontWeight: 600 }}>{raceStateShort(i)}</span>
          <span style={{ color: 'var(--text-muted)' }}>{raceStateName(i)}</span>
        </Tag>
      ))}
    </Space>
  );
};

export const toHex = (c: string | ColorLike | undefined): string => {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c.toHexString ? c.toHexString() : '';
};

export const fmtTime = (v?: string): string => formatDateTime(v);

export const num = (v: unknown): number => Number(v ?? 0);

export const DEFAULT_SOURCE = 'TK';

export const DEFAULT_RUNNER_COUNT = 6;

export const DEFAULT_RACE_FRAMES = 20;

export const DEFAULT_RESULT_MODE = 'random';

export const roundStatusTag = (status: number) => {
  const map: Record<number, { text: string; color: string }> = {
    0: { text: 'Pending', color: 'default' },
    1: { text: 'Betting Closed', color: 'orange' },
    2: { text: 'Completed', color: 'green' },
    3: { text: 'Settled', color: 'blue' },
  };
  const info = map[status] || { text: `#${status}`, color: 'default' };
  return <Tag color={info.color}>{info.text}</Tag>;
};

export const resultStatusTag = (status?: number) => {
  const map: Record<number, { text: string; color: string }> = {
    0: { text: 'Auto', color: 'default' },
    1: { text: 'Manual', color: 'orange' },
    2: { text: 'Pending Approval', color: 'gold' },
  };
  if (status === undefined || status === null) return <Tag>-</Tag>;
  const info = map[status] || { text: `#${status}`, color: 'default' };
  return <Tag color={info.color}>{info.text}</Tag>;
};

export const parsePositions = (result: unknown): number[] => {
  if (!result) return [];
  if (Array.isArray(result)) return result.map((p) => Number(p));
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) return parsed.map((p) => Number(p));
      if (parsed && Array.isArray(parsed.positions))
        return parsed.positions.map((p: unknown) => Number(p));
    } catch {
      return result
        .split(/[\s,]+/)
        .map((s) => Number(s))
        .filter((n) => !Number.isNaN(n));
    }
  }
  if (typeof result === 'object') {
    const obj = result as { positions?: unknown };
    if (Array.isArray(obj.positions)) return obj.positions.map((p) => Number(p));
  }
  return [];
};

export const normalizeRules = (rj: unknown): RuleSection[] => {
  const src = Array.isArray(rj)
    ? rj
    : (rj as { sections?: unknown })?.sections;
  if (Array.isArray(src)) {
    return src.map((s) =>
      typeof s === 'string'
        ? { title: '', content: s }
        : {
            title: firstString((s as RuleSection).title),
            content:
              (s as RuleSection).content ||
              (s as { body?: string }).body ||
              (s as { text?: string }).text ||
              '',
          },
    );
  }
  if (typeof rj === 'string' && rj.trim()) return [{ title: '', content: rj }];
  return [];
};

export const runnerLabel = (
  runnerNo: number,
  single: boolean,
  raceRunners: RaceRunner[],
): { short: string; name: string } => {
  const state = getRunnerState(runnerNo, single);
  const runner = raceRunners[state];
  return {
    short: runner?.nameShort || raceStateShort(state),
    name: runner?.name || raceStateName(state),
  };
};

export const RaceResultPicker = ({
  value,
  onChange,
  runnerCount,
  single,
  raceRunners,
}: {
  value: number[];
  onChange: (positions: number[]) => void;
  runnerCount: number;
  single: boolean;
  raceRunners: RaceRunner[];
}) => {
  const order = value.filter(
    (n, i) => n >= 1 && n <= runnerCount && value.indexOf(n) === i,
  );
  const rankOf = (runnerNo: number) => order.indexOf(runnerNo);

  const toggle = (runnerNo: number) => {
    const rank = rankOf(runnerNo);
    if (rank >= 0) {
      onChange(order.filter((n) => n !== runnerNo));
    } else {
      onChange([...order, runnerNo]);
    }
  };

  const runners = Array.from({ length: runnerCount }, (_, i) => i + 1);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 8,
        }}
      >
        {runners.map((runnerNo) => {
          const rank = rankOf(runnerNo);
          const picked = rank >= 0;
          const state = getRunnerState(runnerNo, single);
          const accent =
            raceRunners[state]?.colorHex ?? `var(${raceStateVar(state)})`;
          const label = runnerLabel(runnerNo, single, raceRunners);
          return (
            <button
              key={runnerNo}
              type="button"
              onClick={() => toggle(runnerNo)}
              title={label.name}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 6px',
                cursor: 'pointer',
                borderRadius: 10,
                background: picked
                  ? 'var(--bg-elevated, rgba(0,0,0,0.03))'
                  : 'transparent',
                border: picked
                  ? `2px solid ${accent}`
                  : '1px solid var(--border-light)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {picked && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    display: 'inline-flex',
                  }}
                >
                  <RankBadge no={rank} size={18} />
                </span>
              )}
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <PlayerBadge size={28} state={state} raceRunners={raceRunners} />
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: -6,
                    minWidth: 16,
                    padding: '0 3px',
                    textAlign: 'center',
                    color: '#ffffff',
                    fontSize: 10,
                    lineHeight: '14px',
                    fontWeight: 700,
                    borderRadius: 4,
                    background: accent,
                  }}
                >
                  {runnerNo}
                </span>
              </span>
              <span
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {label.short}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 86,
                }}
              >
                {label.name}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          Finishing order
        </div>
        {order.length === 0 ? (
          <span style={{ color: 'var(--text-muted)' }}>
            Tap runners above in finishing order — winner first.
          </span>
        ) : (
          <RaceResult positions={order} single={single} raceRunners={raceRunners} />
        )}
      </div>
    </div>
  );
};

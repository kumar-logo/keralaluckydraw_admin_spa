import { Button, Space, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export interface GameDetail {
  id: number;
  gameName: string;
  gameCode: string;
  gameUid?: string | null;
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
  isLottery?: number;
  isThirdParty?: number;
  groupName?: string;
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
  stats: {
    totalRounds: number;
    completedRounds: number;
    totalBet: number;
    totalPayout: number;
    netRevenue: number;
    uniquePlayers: number;
  };
}

export type ColorValue = string | { toHexString?: () => string } | null | undefined;

export const toHex = (c: ColorValue): string =>
  typeof c === 'string' ? c : c?.toHexString?.() || '';

export const fmtDuration = (sec: number) => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

export interface RoundRecord {
  id: number;
  roundNo: string;
  status: number;
  result?: unknown;
  totalBet?: number;
  totalPayout?: number;
  drawTime?: string;
}

export interface RoundsResponse {
  list?: RoundRecord[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
}

export interface OddsRow {
  id: number;
  gameId?: number;
  gameType?: string;
  betType: string;
  odds: number;
  status: number;
}

export interface FeeRow {
  id: number;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
}

export const feeTypeLabels: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

export const EMPTY_SWATCH_COLOR = '#94a3b8';

export const ColorMapEditor = ({
  value,
  onChange,
}: {
  value: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
}) => {
  const map = value;
  const keys = Object.keys(map).length
    ? Object.keys(map)
    : Array.from({ length: 10 }, (_, i) => String(i));
  const colorsFor = (k: string): string[] => {
    const entry = map[k];
    return entry ? entry : [];
  };
  const setColors = (k: string, colors: string[]) =>
    onChange({ ...map, [k]: colors });
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
      }}
    >
      {keys.map((k) => {
        const colors = colorsFor(k);
        return (
          <div
            key={k}
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#fff',
                  background: colors.length ? colors[0] : EMPTY_SWATCH_COLOR,
                }}
              >
                {k}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Number {k}
              </span>
            </div>
            <Space size={4} wrap>
              {colors.map((c, i) => (
                <ColorPicker
                  key={i}
                  size="small"
                  value={c}
                  onChange={(col) => {
                    const next = [...colors];
                    next[i] = toHex(col);
                    setColors(k, next);
                  }}
                  panelRender={(panel) => (
                    <div>
                      <div style={{ textAlign: 'right', padding: 4 }}>
                        <Button
                          size="small"
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            setColors(
                              k,
                              colors.filter((_, j) => j !== i),
                            )
                          }
                        />
                      </div>
                      {panel}
                    </div>
                  )}
                />
              ))}
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setColors(k, [...colors, '#be0000'])}
              />
            </Space>
          </div>
        );
      })}
    </div>
  );
};

export const ODDS_TYPES = [
  'color',
  'dice',
  'race',
  'cash_rain',
  'dubai',
  'three_digit',
  'four_five_digit',
];

export const usesOdds = (gameType: string) => ODDS_TYPES.includes(gameType);

export type MechField = {
  k: string;
  label: string;
  kind?: 'num' | 'text' | 'bool';
  extra?: string;
  min?: number;
  max?: number;
};

export const MECHANICS: Record<string, MechField[]> = {
  color: [{ k: 'maxPrize', label: 'Max Prize', kind: 'text' }],
  dice: [{ k: 'maxPrize', label: 'Max Prize', kind: 'text' }],
  race: [
    { k: 'runnerCount', label: 'Runners', kind: 'num', min: 2, max: 20 },
    { k: 'maxPrize', label: 'Max Prize', kind: 'text' },
  ],
  cash_rain: [{ k: 'maxPrize', label: 'Max Prize', kind: 'text' }],
  three_digit: [
    { k: 'digitCount', label: 'Digits', kind: 'num', min: 1, max: 6 },
    { k: 'maxPrize', label: 'Max Prize', kind: 'text' },
  ],
  four_five_digit: [
    { k: 'digitCount', label: 'Digits', kind: 'num', min: 4, max: 5 },
    { k: 'pick4Price', label: '4D Price', kind: 'num' },
    { k: 'pick5Price', label: '5D Price', kind: 'num' },
    { k: 'maxPrize', label: 'Max Prize', kind: 'text' },
  ],
  dubai: [
    { k: 'cycleSec', label: 'Draw Cycle (sec)', kind: 'num' },
    { k: 'payRate', label: 'Pay Rate', kind: 'num' },
    { k: 'maxPrize', label: 'Max Prize', kind: 'text' },
  ],
  kerala: [
    { k: 'ticketLength', label: 'Ticket Length', kind: 'num', min: 1, max: 12 },
    { k: 'maxPrize', label: 'Max Prize', kind: 'text' },
    { k: 'canInsurance', label: 'Allow Insurance', kind: 'bool' },
  ],
  mystery_box: [
    { k: 'price', label: 'Box Price', kind: 'num' },
    { k: 'freeCount', label: 'Free Plays', kind: 'num' },
  ],
  lucky_spin: [{ k: 'maxPrize', label: 'Max Prize', kind: 'text' }],
};

export const LOTTERY_TYPES = [
  'kerala',
  'three_digit',
  'four_five_digit',
  'dubai',
];

export type RuleSection = { title: string; content: string };

export const normalizeRules = (rj: unknown): RuleSection[] => {
  const src = Array.isArray(rj)
    ? rj
    : (rj as { sections?: unknown[] })?.sections;
  if (Array.isArray(src))
    return src.map((s) => {
      if (typeof s === 'string') return { title: '', content: s };
      const o = s as {
        title?: string;
        content?: string;
        body?: string;
        text?: string;
      };
      return {
        title: o.title || '',
        content: o.content || o.body || o.text || '',
      };
    });
  if (typeof rj === 'string' && rj.trim()) return [{ title: '', content: rj }];
  return [];
};

export interface DailyStat {
  date: string;
  totalBet?: number;
  totalPayout?: number;
  netRevenue?: number;
  orderCount?: number;
  playerCount?: number;
}

export interface TopPlayer {
  userId: number | string;
  totalBet?: number;
  totalWin?: number;
  winRate?: number;
}

export interface StatsResponse {
  daily?: DailyStat[];
  topPlayers?: TopPlayer[];
}

export interface CashRainWindowRow {
  dayStart: number;
  dayEnd: number;
  startMinute: number;
  endMinute: number;
  maxClaimsPerUser: number;
  status: number;
}

export const minutesToDayjs = (m: number) => dayjs().startOf('day').add(m, 'minute');

export const dayjsToMinutes = (d: dayjs.Dayjs | null) =>
  d ? d.hour() * 60 + d.minute() : 0;

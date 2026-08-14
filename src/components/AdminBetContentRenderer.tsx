import type { CSSProperties } from 'react';
import { ResultBall } from './ResultBall';
import {
  GroupBadge,
  PlayerBadge,
  RankBadge,
  getRunnerState,
  type RaceRunner,
} from './RaceBadges';
import {
  DubaiNumberIcon,
  DUBAI_DEFAULT_THEME_COLOR,
  hasDubaiIcon,
} from './DubaiIcons';

export enum GameTypeKey {
  Color = 'color',
  Dice = 'dice',
  Race = 'race',
  ThreeDigit = 'three_digit',
  FourFiveDigit = 'four_five_digit',
  Dubai = 'dubai',
  Kerala = 'kerala',
  MysteryBox = 'mystery_box',
  LuckySpin = 'lucky_spin',
  CashRain = 'cash_rain',
}

enum RaceOrderType {
  SingleRunner = 1,
  TopThree = 2,
  Group = 3,
}

interface BetContentShape {
  betNum?: string;
  betItem?: string;
  betType?: string | number;
  betCode?: string;
  numbers?: string;
  position?: string;
  runnerCount?: number;
  segment?: { name?: string; prize?: number; odds?: number };
  item?: { name?: string; prize?: number };
}

interface AdminBetContentRendererProps {
  gameType: string;
  betContent: Record<string, unknown> | null;
  size?: number;
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
  slatLabels?: string[];
  positionColors?: string[];
  themeColor?: string;
  raceRunners?: RaceRunner[];
}

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;

const toNumberOrUndefined = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const toPrizeEntry = (
  value: unknown,
): { name?: string; prize?: number; odds?: number } | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const entry = value as Record<string, unknown>;
  return {
    name: typeof entry.name === 'string' ? entry.name : undefined,
    prize: toNumberOrUndefined(entry.prize),
    odds: toNumberOrUndefined(entry.odds),
  };
};

const normalizeBetContent = (
  raw: Record<string, unknown>,
): BetContentShape => ({
  betNum: toStringOrUndefined(raw.betNum),
  betItem: toStringOrUndefined(raw.betItem),
  betType:
    typeof raw.betType === 'number'
      ? raw.betType
      : toStringOrUndefined(raw.betType),
  betCode: toStringOrUndefined(raw.betCode),
  numbers: toStringOrUndefined(raw.numbers),
  position: toStringOrUndefined(raw.position),
  runnerCount: toNumberOrUndefined(raw.runnerCount),
  segment: toPrizeEntry(raw.segment),
  item: toPrizeEntry(raw.item),
});

const DIGIT_POSITION_LABELS = ['A', 'B', 'C', 'D', 'E'];
const MUTED_COLOR = 'var(--text-muted)';
const DEFAULT_RUNNER_COUNT = 12;

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const Empty = () => <span style={{ color: MUTED_COLOR }}>—</span>;

const Token = ({ text }: { text: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 999,
      background: 'var(--bg-card-alt)',
      color: 'var(--text-primary)',
      fontWeight: 600,
      fontSize: 12,
    }}
  >
    {text}
  </span>
);

const humanizeKey = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

const isEmptyValue = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

const scalarToText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map((v) => scalarToText(v)).join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const label = obj.name ?? obj.title;
    if (typeof label === 'string') return label;
    return Object.entries(obj)
      .filter(([, v]) => !isEmptyValue(v))
      .map(([k, v]) => `${humanizeKey(k)}: ${scalarToText(v)}`)
      .join(', ');
  }
  return String(value);
};

const splitDigits = (value: string | undefined): string[] =>
  value ? String(value).split('').filter((d) => d !== '') : [];

const splitRunners = (value: string | undefined): number[] =>
  value
    ? String(value)
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((num) => Number.isFinite(num))
    : [];

const KeyValueFallback = ({
  raw,
}: {
  raw: Record<string, unknown>;
}) => {
  const entries = Object.entries(raw).filter(
    ([key, value]) => key !== 'orderGroup' && !isEmptyValue(value),
  );
  if (entries.length === 0) return <Empty />;
  return (
    <span style={wrapStyle}>
      {entries.map(([key, value]) => (
        <Token key={key} text={`${humanizeKey(key)}: ${scalarToText(value)}`} />
      ))}
    </span>
  );
};

const ColorPicks = ({
  content,
  raw,
  size,
  numberColors,
  palette,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
}) => {
  const pick = content.betNum ?? content.betItem;
  if (pick === undefined) return <KeyValueFallback raw={raw} />;
  const numeric = Number(pick);
  if (Number.isInteger(numeric) && String(numeric) === String(pick)) {
    return (
      <span style={wrapStyle}>
        <ResultBall
          value={numeric}
          type="wingo"
          size={size}
          numberColors={numberColors}
          palette={palette}
        />
      </span>
    );
  }
  return (
    <span style={wrapStyle}>
      <Token text={String(pick)} />
    </span>
  );
};

const DicePicks = ({
  content,
  raw,
  size,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
}) => {
  const pick = content.betNum ?? content.betItem;
  if (pick === undefined) return <KeyValueFallback raw={raw} />;
  const numeric = Number(pick);
  if (Number.isInteger(numeric) && String(numeric) === String(pick)) {
    return (
      <span style={wrapStyle}>
        <ResultBall value={numeric} type="dice" size={size} />
      </span>
    );
  }
  return (
    <span style={wrapStyle}>
      <Token text={String(pick)} />
    </span>
  );
};

const isPositionLabel = (
  label: string | undefined,
  labels: string[],
): boolean =>
  !!label &&
  label.length > 0 &&
  label.split('').every((ch) => labels.includes(ch));

const DigitPicks = ({
  content,
  raw,
  size,
  slatLabels,
  positionColors,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
  slatLabels?: string[];
  positionColors?: string[];
}) => {
  const digits = splitDigits(content.numbers);
  if (digits.length === 0) return <KeyValueFallback raw={raw} />;
  const labels =
    slatLabels && slatLabels.length > 0 ? slatLabels : DIGIT_POSITION_LABELS;

  const positionLabel = isPositionLabel(content.position, labels)
    ? content.position
    : typeof content.betType === 'string' &&
        isPositionLabel(content.betType, labels)
      ? content.betType
      : undefined;

  const labelChars =
    positionLabel && positionLabel.length === digits.length
      ? positionLabel.split('')
      : digits.map((_, index) => {
          const labelAtIndex = labels[index];
          return labelAtIndex ? labelAtIndex : '';
        });

  const indexOfLabelChar = (ch: string, fallbackIdx: number): number => {
    const idx = labels.indexOf(ch);
    return idx >= 0 ? idx : fallbackIdx;
  };

  const showBetType =
    content.betType !== undefined && String(content.betType) !== positionLabel;

  return (
    <span style={wrapStyle}>
      {digits.map((digit, index) => {
        const rawLabelChar = labelChars[index];
        const labelChar = rawLabelChar ? rawLabelChar : '';
        const posIdx = indexOfLabelChar(labelChar, index);
        return (
          <ResultBall
            key={`${digit}-${index}`}
            value={Number(digit)}
            type="digit"
            size={size}
            position={labelChar || labels[posIdx]}
            positionColor={positionColors?.[posIdx]}
          />
        );
      })}
      {showBetType && <Token text={String(content.betType)} />}
    </span>
  );
};

const KeralaPicks = ({
  content,
  raw,
  size,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
}) => {
  const digits = splitDigits(content.numbers);
  if (digits.length === 0) return <KeyValueFallback raw={raw} />;
  return (
    <span style={wrapStyle}>
      {digits.map((digit, index) => (
        <ResultBall
          key={`${digit}-${index}`}
          value={digit}
          type="kerala"
          size={size}
          outline
        />
      ))}
    </span>
  );
};

const DubaiPicks = ({
  content,
  raw,
  size,
  themeColor,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
  themeColor?: string;
}) => {
  const pick = content.betCode ?? content.betNum;
  const dubaiNumber = Number.parseInt(String(pick), 10);
  const dubaiColor = themeColor || DUBAI_DEFAULT_THEME_COLOR;
  if (Number.isFinite(dubaiNumber) && hasDubaiIcon(dubaiNumber)) {
    return (
      <span style={{ ...wrapStyle, color: dubaiColor }}>
        <DubaiNumberIcon number={dubaiNumber} size={size} color={dubaiColor} />
        <span style={labelStyle}>{dubaiNumber}</span>
      </span>
    );
  }
  return <KeyValueFallback raw={raw} />;
};

const RacePicks = ({
  content,
  raw,
  size,
  raceRunners,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
  size: number;
  raceRunners?: RaceRunner[];
}) => {
  const runners = splitRunners(content.betNum ?? content.numbers);
  if (runners.length === 0) return <KeyValueFallback raw={raw} />;
  const orderType = Number(content.betType);
  const single =
    Math.max(...runners) <= (content.runnerCount ?? DEFAULT_RUNNER_COUNT) / 2;

  if (orderType === RaceOrderType.Group) {
    const state = getRunnerState(runners[0], single, content.runnerCount);
    return (
      <span style={wrapStyle}>
        <GroupBadge size={size} state={state} />
      </span>
    );
  }

  if (orderType === RaceOrderType.TopThree) {
    return (
      <span style={wrapStyle}>
        {runners.map((runnerNo, rank) => (
          <span
            key={runnerNo}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
          >
            <RankBadge no={rank} size={size} />
            <PlayerBadge
              size={size}
              state={getRunnerState(runnerNo, single, content.runnerCount)}
              raceRunners={raceRunners}
            />
            <span style={labelStyle}>{runnerNo}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span style={wrapStyle}>
      {runners.map((runnerNo) => (
        <span
          key={runnerNo}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <PlayerBadge
            size={size}
            state={getRunnerState(runnerNo, single, content.runnerCount)}
            raceRunners={raceRunners}
          />
          <span style={labelStyle}>{runnerNo}</span>
        </span>
      ))}
    </span>
  );
};

const PrizeChip = ({ name, prize }: { name: string; prize?: number }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'linear-gradient(135deg,#FDAB1C,#F77A00)',
      color: '#fff',
      borderRadius: 999,
      padding: '3px 12px',
      fontWeight: 700,
      fontSize: 12,
      boxShadow: '0 2px 5px rgba(247,122,0,.35)',
    }}
  >
    <span>🎁</span>
    <span>{name}</span>
    {prize != null && prize > 0 && (
      <span>· ₹{Number(prize).toLocaleString()}</span>
    )}
  </span>
);

const MysteryBoxPicks = ({
  content,
  raw,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
}) => {
  const item = content.item;
  if (!item || !item.name) return <KeyValueFallback raw={raw} />;
  return (
    <span style={wrapStyle}>
      <PrizeChip name={item.name} prize={item.prize} />
    </span>
  );
};

const LuckySpinPicks = ({
  content,
  raw,
}: {
  content: BetContentShape;
  raw: Record<string, unknown>;
}) => {
  const segment = content.segment;
  if (!segment || !segment.name) return <KeyValueFallback raw={raw} />;
  return (
    <span style={wrapStyle}>
      <PrizeChip name={segment.name} prize={segment.prize} />
    </span>
  );
};

export const AdminBetContentRenderer = ({
  gameType,
  betContent,
  size = 26,
  numberColors,
  palette,
  slatLabels,
  positionColors,
  themeColor,
  raceRunners,
}: AdminBetContentRendererProps) => {
  if (!betContent || typeof betContent !== 'object') return <Empty />;

  const content = normalizeBetContent(betContent);

  switch (gameType) {
    case GameTypeKey.Color:
      return (
        <ColorPicks
          content={content}
          raw={betContent}
          size={size}
          numberColors={numberColors}
          palette={palette}
        />
      );
    case GameTypeKey.Dice:
      return <DicePicks content={content} raw={betContent} size={size} />;
    case GameTypeKey.ThreeDigit:
    case GameTypeKey.FourFiveDigit:
      return (
        <DigitPicks
          content={content}
          raw={betContent}
          size={size}
          slatLabels={slatLabels}
          positionColors={positionColors}
        />
      );
    case GameTypeKey.Kerala:
      return <KeralaPicks content={content} raw={betContent} size={size} />;
    case GameTypeKey.Dubai:
      return (
        <DubaiPicks
          content={content}
          raw={betContent}
          size={size}
          themeColor={themeColor}
        />
      );
    case GameTypeKey.Race:
      return (
        <RacePicks
          content={content}
          raw={betContent}
          size={size}
          raceRunners={raceRunners}
        />
      );
    case GameTypeKey.MysteryBox:
      return <MysteryBoxPicks content={content} raw={betContent} />;
    case GameTypeKey.LuckySpin:
      return <LuckySpinPicks content={content} raw={betContent} />;
    default:
      return <KeyValueFallback raw={betContent} />;
  }
};

export default AdminBetContentRenderer;

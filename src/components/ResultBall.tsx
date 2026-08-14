import type { CSSProperties } from 'react';
import { RaceTop3Result, type RaceRunner } from './RaceBadges';
import {
  DubaiNumberIcon,
  DUBAI_DEFAULT_THEME_COLOR,
  hasDubaiIcon,
} from './DubaiIcons';

const WINGO_NEUTRAL = 'var(--game-color-neutral, #cbd5e1)';
const FALLBACK_POSITION_COLOR = '#d9d9d9';

const wingoColorValue = (
  name: string,
  palette?: Record<string, string>,
): string => palette?.[name] ?? `var(--game-color-${name})`;

const wingoBackground = (
  value: number,
  numberColors?: Record<string, string[]>,
  palette?: Record<string, string>,
): string => {
  const namesAtValue = numberColors?.[String(value)];
  const names = Array.isArray(namesAtValue) ? namesAtValue : [];
  if (names.length === 0) return WINGO_NEUTRAL;
  if (names.length === 1) return wingoColorValue(names[0], palette);
  return `linear-gradient(315deg, ${wingoColorValue(names[1], palette)} 50.5%, ${wingoColorValue(names[0], palette)} 51.88%)`;
};

interface ResultBallProps {
  value: number | string;
  type?: 'wingo' | 'kerala' | 'digit' | 'dice' | 'race' | 'default';
  size?: number;
  position?: string;
  positionColor?: string;
  outline?: boolean;
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
}

export const ResultBall = ({
  value,
  type = 'default',
  size = 28,
  position,
  positionColor,
  outline,
  numberColors,
  palette,
}: ResultBallProps) => {
  const s: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: size * 0.45,
    lineHeight: 1,
    flexShrink: 0,
  };

  if (type === 'wingo') {
    const bg = wingoBackground(Number(value), numberColors, palette);
    return (
      <span style={{ ...s, background: bg, color: '#fff' }}>{value}</span>
    );
  }

  if (type === 'kerala') {
    if (outline) {
      return (
        <span
          style={{
            ...s,
            background: '#fff',
            border: '2px solid #1a1a1a',
            color: '#1a1a1a',
          }}
        >
          {value}
        </span>
      );
    }
    return (
      <span style={{ ...s, background: '#1a1a1a', color: '#fff' }}>
        {value}
      </span>
    );
  }

  if (type === 'digit' && position) {
    return (
      <span
        style={{
          ...s,
          background: '#f2f2f2',
          border: `2px solid ${positionColor ? positionColor : FALLBACK_POSITION_COLOR}`,
          color: '#2c2c2c',
          boxShadow: '0 4px 4px #00000040 inset',
        }}
      >
        {value}
      </span>
    );
  }

  if (type === 'dice') {
    return (
      <span
        style={{ ...s, background: '#3b82f6', color: '#fff', borderRadius: 6 }}
      >
        {value}
      </span>
    );
  }

  if (type === 'race') {
    return (
      <span
        style={{
          ...s,
          background: '#f59e0b',
          color: '#fff',
          borderRadius: 6,
          fontSize: size * 0.4,
        }}
      >
        P{value}
      </span>
    );
  }

  return (
    <span
      style={{
        ...s,
        background: '#e2e8f0',
        color: '#475569',
        border: '1px solid #cbd5e1',
      }}
    >
      {value}
    </span>
  );
};

const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const DiceFace = ({ n, size = 26 }: { n: number; size?: number }) => {
  const pipsForFace = PIP_MAP[n];
  const pips = Array.isArray(pipsForFace) ? pipsForFace : [];
  const dot = Math.max(3, Math.round(size * 0.16));
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(145deg,#ffffff,#eef1f5)',
        border: '1px solid #cbd5e1',
        boxShadow:
          'inset 0 1px 2px rgba(255,255,255,.9), 0 1px 2px rgba(0,0,0,.15)',
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
const SumBadge = ({
  label,
  color,
  size = 26,
}: {
  label: string;
  color: string;
  size?: number;
}) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: size * 0.42,
      flexShrink: 0,
    }}
  >
    {label}
  </span>
);

interface ParsedResult {
  prefix?: string | number;
  number?: string | number;
  drawResult?: unknown;
  result?: unknown;
  dice?: unknown[];
  digits?: unknown[];
  prizes?: { first?: unknown };
  top3?: unknown;
  positions?: unknown;
  runners?: unknown;
  prize?: unknown;
  prizeAmount?: unknown;
  winAmount?: unknown;
  amount?: unknown;
}

interface GameResultDisplayProps {
  gameType: string;
  result: unknown;
  size?: number;
  slatLabels?: string[];
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
  positionColors?: string[];
  themeColor?: string;
  raceRunners?: RaceRunner[];
}

export const GameResultDisplay = ({
  gameType,
  result,
  size = 26,
  slatLabels,
  numberColors,
  palette,
  positionColors,
  themeColor,
  raceRunners,
}: GameResultDisplayProps) => {
  const posColors = Array.isArray(positionColors) ? positionColors : [];
  if (!result) return <span style={{ color: '#94a3b8' }}>—</span>;

  let parsed = result as ParsedResult;
  if (typeof result === 'string') {
    try {
      parsed = JSON.parse(result) as ParsedResult;
    } catch {
      return (
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          {String(result).substring(0, 30)}
        </span>
      );
    }
  }

  const gap = 3;
  const wrap: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap,
    flexWrap: 'wrap',
    rowGap: gap,
    maxWidth: '100%',
  };

  const prefixBadge = parsed.prefix ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size,
        height: size,
        padding: '0 6px',
        borderRadius: 8,
        background: '#111827',
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.42,
      }}
    >
      {parsed.prefix}
    </span>
  ) : null;

  if (['color'].includes(gameType)) {
    const num = parsed.number ?? parsed.drawResult ?? parsed.result;
    if (num !== undefined) {
      const digits = String(num).split('');
      return (
        <span style={wrap}>
          {digits.map((d: string, i: number) => (
            <ResultBall
              key={i}
              value={Number(d)}
              type="wingo"
              size={size}
              numberColors={numberColors}
              palette={palette}
            />
          ))}
        </span>
      );
    }
  }

  if (['dice'].includes(gameType)) {
    const diceRaw = parsed.drawResult;
    const digits =
      parsed.dice ||
      parsed.digits ||
      (typeof diceRaw === 'string' ? diceRaw.split(',') : undefined) ||
      [];
    if (Array.isArray(digits) && digits.length > 0) {
      const sum = digits.reduce((a: number, b: unknown) => a + Number(b), 0);
      const isLeopard = digits.every(
        (d: unknown) => Number(d) === Number(digits[0]),
      );
      return (
        <span style={wrap}>
          {digits.map((d: unknown, i: number) => (
            <DiceFace key={i} n={Number(d)} size={size} />
          ))}
          <span
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'linear-gradient(145deg,#fff,#e9edf2)',
              border: '1px solid #cbd5e1',
              color: sum % 2 === 0 ? '#176be3' : '#b91010',
              fontWeight: 800,
              fontSize: size * 0.42,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          >
            {sum}
          </span>
          {!isLeopard && (
            <SumBadge
              label={sum > 10 ? 'B' : 'S'}
              color={sum > 10 ? '#f20000' : '#0069ff'}
              size={size}
            />
          )}
          {!isLeopard && (
            <SumBadge
              label={sum % 2 ? 'O' : 'E'}
              color={sum % 2 ? '#b91010' : '#176be3'}
              size={size}
            />
          )}
        </span>
      );
    }
  }

  if (['kerala'].includes(gameType)) {
    const drawResult =
      parsed.drawResult || parsed.result || parsed.prizes?.first;
    if (drawResult) {
      const digits = String(drawResult).split('');
      return (
        <span style={wrap}>
          {prefixBadge}
          {digits.map((d: string, i: number) => (
            <ResultBall key={i} value={d} type="kerala" size={size} outline />
          ))}
        </span>
      );
    }
  }

  if (['three_digit', 'four_five_digit'].includes(gameType)) {
    const digits =
      parsed.digits ||
      String(parsed.drawResult || parsed.number || '').split('');
    const fallbackPositions = ['A', 'B', 'C', 'D', 'E'];
    const positions =
      slatLabels && slatLabels.length > 0 ? slatLabels : fallbackPositions;
    if (digits.length > 0) {
      return (
        <span style={wrap}>
          {prefixBadge}
          {digits.map((d: unknown, i: number) => (
            <ResultBall
              key={i}
              value={Number(d)}
              type="digit"
              size={size}
              position={positions[i]}
              positionColor={posColors[i]}
            />
          ))}
        </span>
      );
    }
  }

  if (['dubai'].includes(gameType)) {
    const rawNumber = parsed.drawResult ?? parsed.number ?? parsed.result;
    const dubaiNumber = Number.parseInt(String(rawNumber), 10);
    const dubaiColor = themeColor || DUBAI_DEFAULT_THEME_COLOR;
    if (Number.isFinite(dubaiNumber) && hasDubaiIcon(dubaiNumber)) {
      return (
        <span style={{ ...wrap, color: dubaiColor }}>
          <DubaiNumberIcon
            number={dubaiNumber}
            size={size}
            color={dubaiColor}
          />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {dubaiNumber}
          </span>
        </span>
      );
    }
  }

  if (['race'].includes(gameType)) {
    const top3Source: unknown[] =
      typeof parsed.top3 === 'string' && parsed.top3.length > 0
        ? parsed.top3.split(',')
        : Array.isArray(parsed.positions)
          ? parsed.positions.slice(0, 3)
          : Array.isArray(parsed.runners)
            ? parsed.runners.slice(0, 3)
            : typeof parsed.drawResult === 'string'
              ? parsed.drawResult.split(',')
              : [];
    if (top3Source.length > 0) {
      const top3 = top3Source.map((p) => Number(p)).slice(0, 3);
      const single = Math.max(...top3) <= 6;
      return (
        <span style={{ ...wrap, gap: 6 }}>
          <RaceTop3Result top3={top3} single={single} raceRunners={raceRunners} />
        </span>
      );
    }
  }

  if (['mystery_box', 'lucky_spin', 'cash_rain'].includes(gameType)) {
    const prize =
      parsed.prize ?? parsed.prizeAmount ?? parsed.winAmount ?? parsed.amount;
    const label =
      prize != null
        ? `₹${Number(prize).toLocaleString()}`
        : gameType === 'lucky_spin'
          ? 'Spin prize'
          : 'Prize';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'linear-gradient(135deg,#FDAB1C,#F77A00)',
          color: '#fff',
          borderRadius: 999,
          padding: `${Math.round(size * 0.12)}px ${Math.round(size * 0.42)}px`,
          fontWeight: 700,
          fontSize: Math.max(11, size * 0.46),
          boxShadow: '0 2px 5px rgba(247,122,0,.35)',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: size * 0.58 }}>🎁</span>
        {label}
      </span>
    );
  }

  return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
};

export default ResultBall;

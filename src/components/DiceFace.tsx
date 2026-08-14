const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

interface DiceFaceProps {
  value: number;
  size?: number;
}

const DiceFace = ({ value, size = 32 }: DiceFaceProps) => {
  const v = Math.min(6, Math.max(1, Number.isFinite(value) ? value : 1));
  const dots = DOT_POSITIONS[v];
  const color = v <= 3 ? 'var(--k3-small)' : 'var(--k3-big)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="16"
        fill="var(--bg-card, #fff)"
        stroke={color}
        strokeWidth="3"
      />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8" fill={color} />
      ))}
    </svg>
  );
};

interface DiceSumBadgeProps {
  type: 'big' | 'small' | 'odd' | 'even';
  size?: number;
}

export const DiceSumBadge = ({ type, size = 24 }: DiceSumBadgeProps) => {
  const styles: Record<string, { bg: string; color: string }> = {
    big: { bg: 'var(--k3-big-gradient)', color: 'var(--bg-card, #fff)' },
    small: { bg: 'var(--k3-small-gradient)', color: 'var(--bg-card, #fff)' },
    odd: { bg: 'var(--k3-neutral-gradient)', color: 'var(--k3-odd)' },
    even: { bg: 'var(--k3-neutral-gradient)', color: 'var(--k3-even)' },
  };
  const s = styles[type] || styles.big;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: s.bg,
        color: s.color,
        fontSize: size * 0.35,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
        textTransform: 'uppercase',
      }}
    >
      {type[0].toUpperCase()}
    </span>
  );
};

export default DiceFace;

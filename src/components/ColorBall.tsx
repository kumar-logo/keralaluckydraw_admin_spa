const OUTLINE_COLOR_MAP: Record<number, string> = {
  0: 'red-violet',
  1: 'green',
  2: 'red',
  3: 'green',
  4: 'red',
  5: 'green-violet',
  6: 'red',
  7: 'green',
  8: 'red',
  9: 'green',
};

const BG_MAP: Record<string, string> = {
  red: 'var(--game-color-red)',
  green: 'var(--game-color-green)',
  violet: 'var(--game-color-violet)',
  'red-violet':
    'linear-gradient(315deg, var(--game-color-violet) 50.5%, var(--game-color-red) 51.88%)',
  'green-violet':
    'linear-gradient(315deg, var(--game-color-violet) 50.5%, var(--game-color-green) 51.88%)',
};

interface ColorBallProps {
  value?: number | string;
  color?: string;
  size?: number;
  variant?: 'outline' | 'full';
}

const ColorBall = ({
  value,
  color,
  size = 28,
  variant = 'outline',
}: ColorBallProps) => {
  const colorKey =
    color ||
    (typeof value === 'number' ? OUTLINE_COLOR_MAP[value] : undefined) ||
    'red';
  const bg = BG_MAP[colorKey] || colorKey;
  const isGradient = bg.includes('gradient');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: isGradient ? bg : variant === 'outline' ? undefined : bg,
        backgroundColor:
          !isGradient && variant === 'outline'
            ? undefined
            : !isGradient
              ? bg
              : undefined,
        border:
          variant === 'outline' && !isGradient ? `2px solid ${bg}` : undefined,
        color:
          variant === 'outline' && !isGradient ? bg : 'var(--bg-card, #fff)',
        fontSize: size * 0.42,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {value !== undefined ? value : ''}
    </span>
  );
};

export default ColorBall;

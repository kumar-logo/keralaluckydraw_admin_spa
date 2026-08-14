interface KeralaDigitBallProps {
  digit: string | number;
  index: number;
  size?: number;
}

const KeralaDigitBall = ({ digit, index, size = 28 }: KeralaDigitBallProps) => {
  const isFirst = index === 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: isFirst ? 'var(--text-primary)' : 'var(--bg-card)',
        color: isFirst ? 'var(--bg-card)' : 'var(--text-primary)',
        border: isFirst ? 'none' : '1.5px solid var(--text-primary)',
        fontSize: size * 0.45,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {digit}
    </span>
  );
};

interface KeralaCodeProps {
  code: string;
  size?: number;
}

export const KeralaCode = ({ code, size = 26 }: KeralaCodeProps) => {
  if (!code) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  const digits = String(code).split('');
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {digits.map((d, i) => (
        <KeralaDigitBall key={i} digit={d} index={i} size={size} />
      ))}
    </span>
  );
};

export default KeralaDigitBall;

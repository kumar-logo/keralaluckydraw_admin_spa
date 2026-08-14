import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

const DEFAULT_LABEL_BORDER_COLOR = '#2c2c2c';

interface DrawDigitInputProps {
  length: number;
  value?: string;
  onChange?: (value: string) => void;
  labels?: string[];
  colors?: string[];
  disabled?: boolean;
  size?: number;
  prefix?: string;
  onPrefixChange?: (value: string) => void;
  prefixLabel?: string;
}

const DrawDigitInput = ({
  length,
  value = '',
  onChange,
  labels,
  colors,
  disabled,
  size = 54,
  prefix,
  onPrefixChange,
  prefixLabel = 'Series',
}: DrawDigitInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => {
    const char = value[i];
    return char ? char : '';
  });

  const setChar = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = chars.slice();
    next[index] = digit;
    onChange?.(next.join(''));
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKey = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0)
      refs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1)
      refs.current[index + 1]?.focus();
  };

  const boxBase: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: size * 0.44,
    fontWeight: 800,
    outline: 'none',
    transition: 'box-shadow .1s, border-color .1s',
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {onPrefixChange && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: 1,
            }}
          >
            {prefixLabel}
          </span>
          <input
            value={prefix ? prefix : ''}
            maxLength={3}
            disabled={disabled}
            placeholder="A"
            onChange={(e) =>
              onPrefixChange(
                e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase(),
              )
            }
            style={{
              ...boxBase,
              background: '#111827',
              color: '#fff',
              border: '2px solid #111827',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,24,39,.35)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      )}
      {chars.map((char, index) => {
        const label = labels?.[index];
        const accent = colors?.[index];
        const inputStyle: CSSProperties = {
          ...boxBase,
          borderRadius: '50%',
          fontSize: Math.round(size * 0.4),
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'text',
          background: '#f2f2f2',
          color: '#2c2c2c',
          border: accent ? `2px solid ${accent}` : 'none',
          boxShadow: '0 4px 4px #00000040 inset',
        };
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#fff',
                  border: `2px solid ${accent ? accent : DEFAULT_LABEL_BORDER_COLOR}`,
                  color: '#2c2c2c',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
            )}
            <input
              ref={(el) => {
                refs.current[index] = el;
              }}
              value={char}
              inputMode="numeric"
              maxLength={1}
              disabled={disabled}
              onChange={(e) => setChar(index, e.target.value)}
              onKeyDown={(e) => onKey(index, e)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 4px #00000040 inset, 0 0 0 3px ${
                  accent ? `${accent}55` : 'rgba(8,145,178,.35)'
                }`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 4px #00000040 inset';
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default DrawDigitInput;

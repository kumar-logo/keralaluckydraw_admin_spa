import { Tag } from 'antd';
import { betTypeLabel } from '../utils/gameTypes';

interface BetTypeTagProps {
  betType: unknown;
  positionColors?: string[];
  slatLabels?: string[];
}

const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E'];
const FALLBACK_POSITION_COLOR = '#d9d9d9';

const isPositionLabel = (value: string, labels: string[]): boolean =>
  value.length > 0 && value.split('').every((ch) => labels.includes(ch));

const BetTypeTag = ({ betType, positionColors, slatLabels }: BetTypeTagProps) => {
  const label = betTypeLabel(betType);
  if (label === '-') {
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  }

  const labels =
    slatLabels && slatLabels.length > 0 ? slatLabels : DEFAULT_LABELS;
  if (isPositionLabel(label, labels)) {
    return (
      <span style={{ display: 'inline-flex', gap: 4 }}>
        {label.split('').map((ch, i) => {
          const idx = labels.indexOf(ch);
          const color =
            (idx >= 0 ? positionColors?.[idx] : undefined) ||
            FALLBACK_POSITION_COLOR;
          return (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#f2f2f2',
                border: `2px solid ${color}`,
                color: '#2c2c2c',
                fontWeight: 700,
                fontSize: 12,
                boxShadow: '0 4px 4px #00000040 inset',
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  }

  const color = label === 'Insured' ? 'purple' : 'blue';
  return (
    <Tag color={color} style={{ marginInlineEnd: 0 }}>
      {label}
    </Tag>
  );
};

export default BetTypeTag;

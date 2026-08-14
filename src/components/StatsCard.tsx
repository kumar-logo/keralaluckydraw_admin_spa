import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

type ColorName =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'cyan'
  | 'pink'
  | 'indigo';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: ColorName;
  prefix?: string;
  suffix?: string;
  precision?: number;
  className?: string;
}

const colorValues: Record<ColorName, string> = {
  blue: 'var(--color-indigo)',
  green: 'var(--success)',
  orange: 'var(--warning)',
  red: 'var(--danger)',
  purple: 'var(--color-purple)',
  cyan: 'var(--color-cyan)',
  pink: 'var(--color-pink)',
  indigo: 'var(--secondary)',
};

const StatsCard = ({
  title,
  value,
  icon,
  color,
  prefix,
  suffix,
  precision,
  className = '',
}: StatsCardProps) => (
  <Card
    className={`stats-card ${color} ${className}`}
    styles={{ body: { padding: '20px 24px' } }}
  >
    <div className="stats-card-inner">
      <Statistic
        title={
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: -0.5,
        }}
      />
      <div className={`stats-card-icon ${color}`}>{icon}</div>
    </div>
  </Card>
);

export { colorValues };
export default StatsCard;

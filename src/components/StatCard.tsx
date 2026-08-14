import type { ReactNode } from 'react';
import { Col, Row } from 'antd';
import { formatMoney } from '../utils/format';

type StatGradient =
  | 'green'
  | 'orange'
  | 'red'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'indigo';

const GRADIENTS: Record<StatGradient, string> = {
  green: 'linear-gradient(135deg, #16a34a, #22c55e)',
  orange: 'linear-gradient(135deg, #ea580c, #f59e0b)',
  red: 'linear-gradient(135deg, #db2777, #ef4444)',
  blue: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
  cyan: 'linear-gradient(135deg, #0e7490, #0891b2)',
  purple: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  indigo: 'linear-gradient(135deg, #4338ca, #6366f1)',
};

interface StatCardProps {
  label: string;
  value: number | string;
  gradient: StatGradient;
  money?: boolean;
  showSign?: boolean;
  sub?: ReactNode;
  icon?: ReactNode;
}

const StatCard = ({
  label,
  value,
  gradient,
  money,
  showSign,
  sub,
  icon,
}: StatCardProps) => {
  const display = money ? formatMoney(value, { showSign }) : value;
  return (
    <div
      className="stat-card"
      style={{
        background: GRADIENTS[gradient],
        color: '#fff',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          {display}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{label}</div>
        {sub !== undefined && (
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {icon && (
        <div style={{ fontSize: 26, opacity: 0.85, flexShrink: 0 }}>{icon}</div>
      )}
    </div>
  );
};

interface StatCardGridProps {
  cards: (StatCardProps & { key: string | number })[];
}

const StatCardGrid = ({ cards }: StatCardGridProps) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    {cards.map(({ key, ...card }) => (
      <Col xs={24} sm={12} md={6} key={key}>
        <StatCard {...card} />
      </Col>
    ))}
  </Row>
);

export type { StatGradient, StatCardProps };
export { StatCardGrid };
export default StatCard;

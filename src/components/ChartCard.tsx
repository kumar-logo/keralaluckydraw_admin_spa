import { Card } from 'antd';
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  height?: number;
}

const ChartCard = ({ title, extra, children, height }: ChartCardProps) => (
  <Card
    className="chart-card"
    title={title}
    extra={extra}
    styles={{
      body: {
        padding: '16px 20px 20px',
        height: height ? height + 32 : undefined,
      },
    }}
  >
    {children}
  </Card>
);

export default ChartCard;

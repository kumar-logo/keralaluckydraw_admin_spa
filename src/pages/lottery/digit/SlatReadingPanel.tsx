import {
  Card,
  Descriptions,
  Empty,
  Space,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import PageLoader from '../../../components/PageLoader';
import MoneyText from '../../../components/MoneyText';
import { GameResultDisplay, ResultBall } from '../../../components/ResultBall';
import { orDash } from '../../../utils/format';
import {
  SLAT_TIER_BALL_SIZE,
  num,
  POSITION_FALLBACK_COLOR,
  type SlatProductPnlRow,
  type SlatTierPnlRow,
  type SlatUserPnlRow,
  type SlatReadingResponse,
} from './digitShared';

const SlatReadingPanel = ({
  gameType,
  data,
  loading,
  positionColors,
}: {
  gameType: string;
  data: SlatReadingResponse | null;
  loading: boolean;
  positionColors?: string[];
}) => {
  const posColors = positionColors ?? [];
  const labelToIndex: Record<string, number> = {};
  (data?.reading?.labeled ?? []).forEach((l) => {
    if (l.label) labelToIndex[l.label] = l.index;
  });
  const accentFor = (labelChar: string, fallbackIdx: number): string => {
    const idx = labelToIndex[labelChar] ?? fallbackIdx;
    const color = posColors[idx];
    return color ? color : POSITION_FALLBACK_COLOR;
  };
  const TierBalls = ({ label, digits }: { label: string; digits?: string }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {label.split('').map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#f2f2f2',
            border: `2px solid ${accentFor(ch, i)}`,
            color: '#2c2c2c',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 4px #00000040 inset',
          }}
        >
          {digits ? digits[i] ?? '' : ch}
        </span>
      ))}
    </div>
  );
  const tierColumns: ColumnsType<SlatTierPnlRow> = [
    {
      title: 'Group',
      dataIndex: 'tierLabel',
      key: 'tierLabel',
      width: 130,
      render: (v: string) => <TierBalls label={v} />,
    },
    {
      title: 'Winning Digits',
      dataIndex: 'winningDigits',
      key: 'winningDigits',
      width: 150,
      render: (v: string, r: SlatTierPnlRow) =>
        v ? (
          <TierBalls label={r.tierLabel} digits={v} />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Prize',
      dataIndex: 'winAmount',
      key: 'winAmount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Winners',
      dataIndex: 'winnersQty',
      key: 'winnersQty',
      width: 90,
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
  ];

  const productColumns: ColumnsType<SlatProductPnlRow> = [
    {
      title: 'Product',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (v: string) => (
        <span style={{ fontWeight: 600 }}>{orDash(v)}</span>
      ),
    },
    {
      title: 'Sales Qty',
      dataIndex: 'salesQty',
      key: 'salesQty',
      width: 100,
    },
    {
      title: 'Sales',
      dataIndex: 'salesAmount',
      key: 'salesAmount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Winners',
      dataIndex: 'winnersQty',
      key: 'winnersQty',
      width: 90,
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Profit / Loss',
      dataIndex: 'profitLoss',
      key: 'profitLoss',
      width: 140,
      render: (v: number) => (
        <MoneyText value={v} variant="auto" showSign />
      ),
    },
  ];

  const userColumns: ColumnsType<SlatUserPnlRow> = [
    { title: 'User', dataIndex: 'userId', key: 'userId', width: 140 },
    {
      title: 'Stake',
      dataIndex: 'stake',
      key: 'stake',
      width: 120,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 120,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net',
      dataIndex: 'net',
      key: 'net',
      width: 120,
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
  ];

  if (loading) return <PageLoader cards={2} />;
  if (!data) return null;

  if (!data.drawn) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No result drawn yet for this round."
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" style={{ borderRadius: 10 }} title="Result Reading">
        <Space size={8} wrap style={{ marginBottom: 12 }}>
          {data.reading.labeled.map((pos) => (
            <Space key={pos.index} direction="vertical" size={2} align="center">
              <ResultBall
                value={pos.digit}
                type="digit"
                size={SLAT_TIER_BALL_SIZE}
                position={pos.label}
                positionColor={positionColors?.[pos.index]}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {orDash(pos.label)}
              </span>
            </Space>
          ))}
        </Space>
        <Descriptions column={{ xs: 1, sm: 1 }} size="small" bordered>
          <Descriptions.Item label="Drawn">
            <GameResultDisplay
              gameType={gameType}
              result={{ drawResult: data.drawn }}
              size={SLAT_TIER_BALL_SIZE}
              slatLabels={data.reading.labeled.map((pos) => pos.label)}
              positionColors={positionColors}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Reading">
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {data.reading.readingText}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" style={{ borderRadius: 10 }} title="Winning Groups">
        <Table
          rowKey={(r) => `${r.productId}-${r.tierLabel}`}
          columns={tierColumns}
          dataSource={data.perTier}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 560 }}
          locale={{ emptyText: <Empty description="No winning groups" /> }}
        />
      </Card>

      <Card size="small" style={{ borderRadius: 10 }} title="Per-Product P&L">
        <Table
          rowKey="productId"
          columns={productColumns}
          dataSource={data.perProduct}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 720 }}
          locale={{ emptyText: <Empty description="No products" /> }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Totals</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} />
              <Table.Summary.Cell index={2}>
                <strong>{num(data.totals.totalSales).toFixed(2)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4}>
                <strong>{num(data.totals.totalPayout).toFixed(2)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <span
                  className={
                    num(data.totals.totalProfitLoss) >= 0
                      ? 'amount-positive'
                      : 'amount-negative'
                  }
                >
                  {num(data.totals.totalProfitLoss) >= 0 ? '+' : ''}
                  {num(data.totals.totalProfitLoss).toFixed(2)}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Card size="small" style={{ borderRadius: 10 }} title="Per-User P&L (Top by Stake)">
        <Table
          rowKey="userId"
          columns={userColumns}
          dataSource={data.perUser}
          size="small"
          className="modern-table"
          scroll={{ x: 500 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="No bets on this round" /> }}
        />
      </Card>
    </Space>
  );
};

export default SlatReadingPanel;

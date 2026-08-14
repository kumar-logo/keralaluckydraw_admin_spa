import { Card, Col, Divider, Empty, Row, Statistic, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import MoneyText from '../../../components/MoneyText';
import type { PreviewData, PreviewWinner } from './drawTypes';

interface PreviewOutcomeProps {
  preview: PreviewData | null;
  loading: boolean;
  emptyText: string;
}

const winnerColumns: ColumnsType<PreviewWinner> = [
  { title: 'User', dataIndex: 'userId', key: 'userId', width: 110 },
  {
    title: 'Stake',
    dataIndex: 'amount',
    key: 'amount',
    width: 110,
    render: (v: number) => <MoneyText value={v} variant="neutral" />,
  },
  {
    title: 'Win',
    dataIndex: 'winAmount',
    key: 'winAmount',
    width: 120,
    render: (v: number) => <MoneyText value={v} variant="positive" />,
  },
];

const PreviewOutcome = ({ preview, loading, emptyText }: PreviewOutcomeProps) => (
  <Card
    title="Outcome Preview"
    loading={loading}
    style={{
      borderRadius: 12,
      borderColor: preview
        ? preview.profitLoss >= 0
          ? 'var(--success)'
          : 'var(--danger)'
        : undefined,
      borderWidth: preview ? 2 : 1,
      borderStyle: 'solid',
    }}
  >
    {!preview ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
    ) : (
      <>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Statistic title="Winners" value={preview.totalWinners} />
          </Col>
          <Col xs={24} md={12}>
            <Statistic
              title="Win Rate"
              value={preview.winRate}
              suffix="%"
              precision={2}
            />
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Payout
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              <MoneyText value={preview.totalPayout} variant="negative" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Profit/Loss
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              <MoneyText value={preview.profitLoss} variant="auto" showSign />
            </div>
          </Col>
        </Row>
        {preview.winners && preview.winners.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Winning tickets ({preview.winners.length})
            </div>
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              <Table<PreviewWinner>
                size="small"
                pagination={false}
                rowKey="orderNo"
                dataSource={preview.winners}
                columns={winnerColumns}
                scroll={{ x: 'max-content' }}
              />
            </div>
          </>
        )}
      </>
    )}
  </Card>
);

export default PreviewOutcome;

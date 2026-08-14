import { Card, Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import MoneyText from '../../../components/MoneyText';
import { formatMoney, orDash } from '../../../utils/format';
import {
  type SlatProductPnl,
  type SlatReadingResponse,
  type SlatTicketPnl,
  type SlatTierPnl,
  type SlatUserPnl,
} from './drawTypes';

interface SlatResultViewProps {
  data: SlatReadingResponse;
  positionColors?: string[];
}

const cardStyle = { borderRadius: 12, marginTop: 16 } as const;
const FALLBACK_SLAT_COLOR = '#d9d9d9';
const EMPTY_LABEL_PLACEHOLDER = '·';

const plColor = (value: number): string =>
  value >= 0 ? 'var(--success)' : 'var(--danger)';

const ReadingBall = ({
  label,
  digit,
  accent,
}: {
  label: string;
  digit: string;
  accent: string;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1 }}
      >
        {label ? label : EMPTY_LABEL_PLACEHOLDER}
      </span>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#fff',
          border: accent ? `2px solid ${accent}` : 'none',
          boxShadow: '0 4px 4px #00000040 inset',
          color: '#1a1a1a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {digit}
      </span>
    </div>
  );
};

const TotalCard = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Card size="small" style={{ borderRadius: 10 }}>
    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{children}</div>
  </Card>
);

const SlatResultView = ({
  data,
  positionColors: gamePositionColors,
}: SlatResultViewProps) => {
  const { reading, perProduct, perTier, perUser, tickets, totals } = data;
  const winnersCount = tickets.filter((t) => t.won).length;
  const positionColors = Array.isArray(gamePositionColors)
    ? gamePositionColors
    : [];

  const labelToIndex: Record<string, number> = {};
  reading.labeled.forEach((l) => {
    if (l.label) labelToIndex[l.label] = l.index;
  });
  const accentFor = (labelChar: string, fallbackIdx: number): string => {
    const idx = labelToIndex[labelChar] ?? fallbackIdx;
    const color = positionColors[idx];
    return color ? color : FALLBACK_SLAT_COLOR;
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
          {digits ? (digits[i] ? digits[i] : '') : ch}
        </span>
      ))}
    </div>
  );

  const productColumns: ColumnsType<SlatProductPnl> = [
    { title: 'Product', dataIndex: 'title', key: 'title' },
    {
      title: 'Sales Qty',
      dataIndex: 'salesQty',
      key: 'salesQty',
      width: 100,
      align: 'right',
    },
    {
      title: 'Sales',
      dataIndex: 'salesAmount',
      key: 'salesAmount',
      width: 130,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Winners',
      dataIndex: 'winnersQty',
      key: 'winnersQty',
      width: 100,
      align: 'right',
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 130,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <MoneyText value={v} variant="negative" />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'P/L',
      dataIndex: 'profitLoss',
      key: 'profitLoss',
      width: 140,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
  ];

  const tierColumns: ColumnsType<SlatTierPnl> = [
    {
      title: 'Tier',
      key: 'tier',
      width: 130,
      render: (_: unknown, r: SlatTierPnl) => <TierBalls label={r.tierLabel} />,
    },
    {
      title: 'Winning Digits',
      dataIndex: 'winningDigits',
      key: 'winningDigits',
      width: 150,
      render: (v: string, r: SlatTierPnl) =>
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
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Winners',
      dataIndex: 'winnersQty',
      key: 'winnersQty',
      width: 100,
      align: 'right',
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 130,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <MoneyText value={v} variant="negative" />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
  ];

  const sortedTickets = tickets
    .slice()
    .sort((a, b) => Number(b.won) - Number(a.won) || b.net - a.net);

  const ticketColumns: ColumnsType<SlatTicketPnl> = [
    {
      title: 'Order',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{orDash(v)}</span>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Product',
      dataIndex: 'productTitle',
      key: 'productTitle',
      width: 140,
    },
    {
      title: 'Bet No.',
      dataIndex: 'betNumber',
      key: 'betNumber',
      width: 150,
      render: (v: string, r: SlatTicketPnl) =>
        v ? (
          <TierBalls label={r.position || v} digits={v} />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 130,
      render: (v: string) =>
        v ? (
          <TierBalls label={v} />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Stake',
      dataIndex: 'stake',
      key: 'stake',
      width: 110,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'payout',
      key: 'payout',
      width: 120,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <MoneyText value={v} variant="positive" />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Net',
      dataIndex: 'net',
      key: 'net',
      width: 130,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
    {
      title: 'Result',
      dataIndex: 'won',
      key: 'won',
      width: 90,
      render: (won: boolean) =>
        won ? (
          <span className="status-badge active">Won</span>
        ) : (
          <span className="status-badge inactive">Lost</span>
        ),
    },
  ];

  const userColumns: ColumnsType<SlatUserPnl> = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Staked',
      dataIndex: 'stake',
      key: 'stake',
      width: 140,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Won',
      dataIndex: 'payout',
      key: 'payout',
      width: 140,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <MoneyText value={v} variant="positive" />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Net',
      dataIndex: 'net',
      key: 'net',
      width: 150,
      align: 'right',
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
  ];

  return (
    <div>
      <Card size="small" style={{ borderRadius: 12 }} title="Reading">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {reading.labeled.map((cell) => (
            <ReadingBall
              key={cell.index}
              label={cell.label}
              digit={cell.digit}
              accent={positionColors[cell.index] ? positionColors[cell.index] : ''}
            />
          ))}
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 16,
              marginLeft: 8,
              alignSelf: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {reading.readingText}
          </span>
        </div>
      </Card>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={12} md={6}>
          <TotalCard label="Total Sales">
            <MoneyText value={totals.totalSales} variant="neutral" />
          </TotalCard>
        </Col>
        <Col xs={12} md={6}>
          <TotalCard label="Total Payout">
            <MoneyText value={totals.totalPayout} variant="negative" />
          </TotalCard>
        </Col>
        <Col xs={12} md={6}>
          <TotalCard label="Total P/L">
            <span style={{ color: plColor(totals.totalProfitLoss) }}>
              {formatMoney(totals.totalProfitLoss, { showSign: true })}
            </span>
          </TotalCard>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Tickets / Winners
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {tickets.length}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginLeft: 8,
                }}
              >
                {winnersCount} won
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Per-Product P/L" size="small" style={cardStyle}>
        <Table<SlatProductPnl>
          rowKey="productId"
          size="small"
          pagination={false}
          dataSource={perProduct}
          columns={productColumns}
          className="modern-table"
          scroll={{ x: 720 }}
        />
      </Card>

      <Card title="Per-Tier Breakdown" size="small" style={cardStyle}>
        <Table<SlatTierPnl>
          rowKey={(r) => `${r.productId}::${r.tierLabel}`}
          size="small"
          pagination={false}
          dataSource={perTier}
          columns={tierColumns}
          className="modern-table"
          scroll={{ x: 700 }}
        />
      </Card>

      <Card
        title={`Per-Ticket P/L (${tickets.length})`}
        size="small"
        style={cardStyle}
      >
        <Table<SlatTicketPnl>
          rowKey={(r) => `${r.orderNo}-${r.productId}-${r.betNumber}`}
          size="small"
          dataSource={sortedTickets}
          columns={ticketColumns}
          className="modern-table"
          scroll={{ x: 1080 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (t) => `${t} tickets`,
          }}
        />
      </Card>

      <Card title="Per-User P/L" size="small" style={cardStyle}>
        <Table<SlatUserPnl>
          rowKey="userId"
          size="small"
          dataSource={perUser}
          columns={userColumns}
          className="modern-table"
          scroll={{ x: 560 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (t) => `${t} players`,
          }}
        />
      </Card>
    </div>
  );
};

export default SlatResultView;

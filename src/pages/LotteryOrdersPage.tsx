import { useEffect, useRef, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  Empty,
  message,
  Row,
  Col,
  Tooltip,
  Input,
  Modal,
  Descriptions,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  OrderedListOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import GameSelect from '../components/GameSelect';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { StatCardGrid } from '../components/StatCard';
import type { StatCardProps } from '../components/StatCard';
import { GameResultDisplay } from '../components/ResultBall';
import { AdminBetContentRenderer } from '../components/AdminBetContentRenderer';
import BetTypeTag from '../components/BetTypeTag';
import { formatDateTime, formatNumber, orDash, DATE_FORMAT } from '../utils/format';
import { typeName } from '../utils/gameTypes';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { gameVisualProps } from '../utils/gameVisualProps';

const { RangePicker } = DatePicker;

interface LotteryBetContent {
  numbers?: string;
  insured?: boolean;
}

interface OrderRecord {
  id: number;
  orderNo: string;
  userId: string;
  gameId: number;
  gameType: string;
  gameName?: string;
  roundNo: string;
  betType: string;
  betContent: LotteryBetContent | string | null;
  result?: string | Record<string, unknown> | null;
  amount: number;
  totalAmount: number;
  winAmount: number;
  quantity: number;
  status: number;
  createdAt: string;
  settledAt: string;
}

interface LotteryOrderStatusCount {
  status: number;
  count: number;
  bet: number;
  win: number;
}

interface LotteryOrderSummary {
  totalOrders: number;
  totalTickets: number;
  totalBet: number;
  totalWin: number;
  netProfit: number;
  statusCounts: LotteryOrderStatusCount[];
}

interface LotteryOrdersResponse {
  list: OrderRecord[];
  total: number;
  summary: LotteryOrderSummary;
}

enum LotteryOrderStatus {
  Pending = 0,
  Won = 1,
  Lost = 2,
  Settled = 3,
  Cancelled = 4,
  Refunded = 5,
}

const LOTTERY_STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: LotteryOrderStatus.Pending, label: 'Pending' },
  { value: LotteryOrderStatus.Won, label: 'Won' },
  { value: LotteryOrderStatus.Lost, label: 'Lost' },
  { value: LotteryOrderStatus.Settled, label: 'Settled' },
  { value: LotteryOrderStatus.Cancelled, label: 'Cancelled' },
  { value: LotteryOrderStatus.Refunded, label: 'Refunded' },
];

const EMPTY_ORDER_SUMMARY: LotteryOrderSummary = {
  totalOrders: 0,
  totalTickets: 0,
  totalBet: 0,
  totalWin: 0,
  netProfit: 0,
  statusCounts: [],
};

const wonStats = (s: LotteryOrderSummary): LotteryOrderStatusCount =>
  s.statusCounts.find((c) => c.status === LotteryOrderStatus.Won) ?? {
    status: LotteryOrderStatus.Won,
    count: 0,
    bet: 0,
    win: 0,
  };

const pendingCount = (s: LotteryOrderSummary): number =>
  s.statusCounts
    .filter((c) => c.status === LotteryOrderStatus.Pending)
    .reduce((sum, c) => sum + c.count, 0);

const lostCount = (s: LotteryOrderSummary): number =>
  s.statusCounts
    .filter((c) => c.status === LotteryOrderStatus.Lost)
    .reduce((sum, c) => sum + c.count, 0);

const orderStatCards = (
  s: LotteryOrderSummary,
): (StatCardProps & { key: string })[] => [
  {
    key: 'bet',
    label: 'Total Bet Amount',
    gradient: 'blue',
    value: s.totalBet,
    money: true,
    sub: `${formatNumber(s.totalOrders)} orders · ${formatNumber(s.totalTickets)} tickets`,
  },
  {
    key: 'payout',
    label: 'Total Payout',
    gradient: 'green',
    value: s.totalWin,
    money: true,
    sub: `${formatNumber(wonStats(s).count)} winning orders`,
  },
  {
    key: 'pl',
    label: 'Net P/L (House)',
    gradient: 'cyan',
    value: s.netProfit,
    money: true,
    showSign: true,
    sub: 'Bet − Payout',
  },
  {
    key: 'pendingLost',
    label: 'Pending / Lost',
    gradient: 'orange',
    value: `${formatNumber(pendingCount(s))} / ${formatNumber(lostCount(s))}`,
    sub: `${formatNumber(s.totalOrders)} total orders`,
  },
];

const LotteryOrdersPage = () => {
  const { get: getDigitConfig } = useDigitPositionConfig();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<LotteryOrderSummary>(
    EMPTY_ORDER_SUMMARY,
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [roundNo, setRoundNo] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<OrderRecord | null>(null);
  const [gameIds, setGameIds] = useState<number[]>([]);
  const requestSeqRef = useRef(0);
  const queryRef = useRef<{
    page: number;
    search: string;
    roundNo: string;
    status?: number;
    startDate?: string;
    endDate?: string;
    gameIds: number[];
  }>({
    page: 1,
    search: '',
    roundNo: '',
    status: undefined,
    gameIds: [],
  });

  const fetchData = async (
    p = queryRef.current.page,
    q = queryRef.current.search,
    rn = queryRef.current.roundNo,
    st = queryRef.current.status,
    startDate = queryRef.current.startDate,
    endDate = queryRef.current.endDate,
    gids = queryRef.current.gameIds,
  ) => {
    queryRef.current = {
      page: p,
      search: q,
      roundNo: rn,
      status: st,
      startDate,
      endDate,
      gameIds: gids,
    };
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setLoading(true);
    try {
      const res = (await api.post('lottery/orders', {
        pageNo: p,
        pageSize,
        userId: q ? q : undefined,
        roundNo: rn ? rn : undefined,
        status: st,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
        gameIds: gids.length > 0 ? gids : undefined,
      })) as unknown as LotteryOrdersResponse;
      if (requestSeqRef.current !== seq) return;
      setData(res.list);
      setTotal(res.total);
      setSummary(res.summary ?? EMPTY_ORDER_SUMMARY);
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      const msg = err instanceof Error ? err.message : 'Failed to load';
      message.error(msg);
    } finally {
      if (requestSeqRef.current === seq) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = (range: [Dayjs, Dayjs] | null) => {
    setDateRange(range);
    setPage(1);
    const start = range && range[0] ? range[0].format(DATE_FORMAT) : undefined;
    const end = range && range[1] ? range[1].format(DATE_FORMAT) : undefined;
    fetchData(1, search, roundNo, status, start, end, gameIds);
  };

  const handleGameChange = (vals: number[]) => {
    setGameIds(vals);
    setPage(1);
    const start =
      dateRange && dateRange[0] ? dateRange[0].format(DATE_FORMAT) : undefined;
    const end =
      dateRange && dateRange[1] ? dateRange[1].format(DATE_FORMAT) : undefined;
    fetchData(1, search, roundNo, status, start, end, vals);
  };

  const parseBetContent = (
    betContent: LotteryBetContent | string | null,
  ): Record<string, unknown> => {
    if (!betContent) return {};
    if (typeof betContent === 'string') {
      try {
        return JSON.parse(betContent) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    return betContent as Record<string, unknown>;
  };

  const columns: ColumnsType<OrderRecord> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (v: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: 'var(--text-primary)',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (v: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: 'Game',
      key: 'game',
      width: 150,
      render: (_: unknown, r: OrderRecord) => (
        <span
          style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {orDash(r.gameName)}
          </span>
          <Tag style={{ marginInlineEnd: 0, alignSelf: 'flex-start' }}>
            {typeName(r.gameType)}
          </Tag>
        </span>
      ),
    },
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Result',
      key: 'result',
      width: 260,
      render: (_: unknown, r: OrderRecord) => (
        <GameResultDisplay
          gameType={r.gameType}
          result={r.result}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Ticket Number',
      key: 'ticket',
      width: 260,
      render: (_: unknown, r: OrderRecord) => {
        const bc = parseBetContent(r.betContent);
        return Object.keys(bc).length > 0 ? (
          <AdminBetContentRenderer
            gameType={r.gameType}
            betContent={bc}
            size={20}
            {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        );
      },
    },
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 110,
      render: (v: string, r: OrderRecord) => (
        <BetTypeTag
          betType={v}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Tickets',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{v ? v : 1}</span>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Win',
      dataIndex: 'winAmount',
      key: 'winAmount',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="auto" />,
    },
    {
      title: 'Net',
      key: 'net',
      width: 110,
      render: (_: unknown, r: OrderRecord) => (
        <MoneyText value={r.winAmount - r.totalAmount} variant="auto" />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => <StatusBadge kind="order" status={v} />,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: OrderRecord) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setDetailRecord(r);
            setDetailOpen(true);
          }}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Lottery Tickets"
        subtitle={`${total} lottery orders`}
        icon={<OrderedListOutlined />}
        iconBg="var(--gradient-green)"
      />

      <StatCardGrid cards={orderStatCards(summary)} />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search User ID or Order..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
                fetchData(1, v, roundNo, status);
              }}
              onChange={(e) => {
                if (!e.target.value && search) {
                  setSearch('');
                  fetchData(1, '', roundNo, status);
                }
              }}
            />
          </Col>
          <Col flex="180px">
            <Input.Search
              placeholder="Round No..."
              allowClear
              onSearch={(v) => {
                setRoundNo(v);
                setPage(1);
                fetchData(1, search, v, status);
              }}
              onChange={(e) => {
                if (!e.target.value && roundNo) {
                  setRoundNo('');
                  fetchData(1, search, '', status);
                }
              }}
            />
          </Col>
          <Col flex="240px">
            <GameSelect
              scope="lottery"
              value={gameIds}
              onChange={handleGameChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
                fetchData(1, search, roundNo, v);
              }}
              value={status}
              options={LOTTERY_STATUS_OPTIONS}
            />
          </Col>
          <Col flex="280px">
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(range) =>
                handleDateChange(range as [Dayjs, Dayjs] | null)
              }
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        scroll={{ x: 1700 }}
        locale={{ emptyText: <Empty description="No lottery orders" /> }}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: (t) => `Total ${t}`,
          onChange: (p) => {
            setPage(p);
            fetchData(p);
          },
        }}
      />

      <Modal
        title="Ticket Detail"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {detailRecord &&
          (() => {
            const bc = parseBetContent(detailRecord.betContent);
            const hasTicket = Object.keys(bc).length > 0;
            return (
              <div style={{ paddingTop: 8 }}>
                {hasTicket && (
                  <div
                    style={{
                      textAlign: 'center',
                      marginBottom: 16,
                      padding: 16,
                      background: 'var(--bg-card-alt)',
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Ticket Number
                    </div>
                    <AdminBetContentRenderer
                      gameType={detailRecord.gameType}
                      betContent={bc}
                      size={32}
                      {...gameVisualProps(
                        detailRecord.gameType,
                        getDigitConfig(detailRecord.gameId),
                      )}
                    />
                  </div>
                )}
                <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                  <Descriptions.Item label="Order No" span={2}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {detailRecord.orderNo}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="User ID">
                    <span style={{ fontFamily: 'monospace' }}>
                      {detailRecord.userId}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Round">
                    {detailRecord.roundNo}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bet Type">
                    <BetTypeTag
                      betType={detailRecord.betType}
                      {...gameVisualProps(
                        detailRecord.gameType,
                        getDigitConfig(detailRecord.gameId),
                      )}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Game">
                    <span
                      style={{
                        display: 'inline-flex',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {orDash(detailRecord.gameName)}
                      </span>
                      <Tag style={{ marginInlineEnd: 0 }}>
                        {typeName(detailRecord.gameType)}
                      </Tag>
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tickets">
                    {detailRecord.quantity ? detailRecord.quantity : 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sales">
                    <MoneyText
                      value={detailRecord.totalAmount}
                      variant="neutral"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Win">
                    <MoneyText value={detailRecord.winAmount} variant="auto" />
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <StatusBadge kind="order" status={detailRecord.status} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Result" span={2}>
                    {detailRecord.result ? (
                      <GameResultDisplay
                        gameType={detailRecord.gameType}
                        result={detailRecord.result}
                        size={26}
                        {...gameVisualProps(
                          detailRecord.gameType,
                          getDigitConfig(detailRecord.gameId),
                        )}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Not drawn yet
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created" span={2}>
                    {formatDateTime(detailRecord.createdAt)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
};

export default LotteryOrdersPage;

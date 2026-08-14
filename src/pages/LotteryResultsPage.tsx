import { useEffect, useRef, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  Input,
  Card,
  Empty,
  Statistic,
  Space,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  CrownOutlined,
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
import { KeralaCode } from '../components/KeralaDigitBall';
import { GameResultDisplay } from '../components/ResultBall';
import { useConfigStore, type StatusEntry } from '../store/configStore';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import {
  formatDateTime,
  formatNumber,
  orDash,
  DATE_FORMAT,
} from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';

const { RangePicker } = DatePicker;

const EMPTY_STATUS_MAP: Record<number, StatusEntry> = {};

interface DrawRecord {
  id: number;
  roundNo: string;
  gameId: number;
  gameType: string;
  drawTime: string;
  status: number;
  result: unknown;
  totalBet: number;
  totalPayout: number;
  manualResult: number;
  settledBy: string;
  ticketCount?: number;
}

interface PrizeTier {
  id: number;
  prizeTier: string;
  prizeName: string;
  prizeAmt: number;
  numbers: unknown;
}

interface LotteryDrawSummary {
  totalDraws: number;
  totalSales: number;
  totalPayout: number;
  netProfit: number;
}

interface DrawListResponse {
  list: DrawRecord[];
  total: number;
  summary: LotteryDrawSummary;
}

const EMPTY_DRAW_SUMMARY: LotteryDrawSummary = {
  totalDraws: 0,
  totalSales: 0,
  totalPayout: 0,
  netProfit: 0,
};

const drawStatCards = (
  s: LotteryDrawSummary,
): (StatCardProps & { key: string })[] => [
  {
    key: 'draws',
    label: 'Total Draws',
    gradient: 'blue',
    value: formatNumber(s.totalDraws),
    sub: 'Rounds in range',
  },
  {
    key: 'sales',
    label: 'Total Sales',
    gradient: 'cyan',
    value: s.totalSales,
    money: true,
    sub: 'Bets collected',
  },
  {
    key: 'payout',
    label: 'Total Payout',
    gradient: 'red',
    value: s.totalPayout,
    money: true,
    sub: 'Prizes paid out',
  },
  {
    key: 'pl',
    label: 'Net P/L (House)',
    gradient: 'green',
    value: s.netProfit,
    money: true,
    showSign: true,
    sub: 'Sales − Payout',
  },
];

interface DrawDetailResponse {
  round: DrawRecord & { result: unknown; totalPayout: number };
  prizeTiers: PrizeTier[];
  ticketCount: number;
  wonCount: number;
}

const PRIZE_ICONS: Record<string, string> = {
  first: '🥇',
  '1st': '🥇',
  second: '🥈',
  '2nd': '🥈',
  third: '🥉',
  '3rd': '🥉',
  fourth: '4️⃣',
  '4th': '4️⃣',
  fifth: '5️⃣',
  '5th': '5️⃣',
  consolation: '🎁',
  cons: '🎁',
  lucky: '🍀',
};

const parseResultCode = (result: unknown): string => {
  if (!result) return '-';
  let r: Record<string, unknown> = {};
  if (typeof result === 'string') {
    try {
      r = JSON.parse(result) as Record<string, unknown>;
    } catch {
      return result;
    }
  } else if (typeof result === 'object') {
    r = result as Record<string, unknown>;
  }
  const dr = r.drawResult ?? r.code;
  if (dr != null) return String(dr);
  if (Array.isArray(r.wonCode)) return (r.wonCode as unknown[]).join('');
  return '-';
};

const parseNumbers = (numbers: unknown): string[] => {
  if (!numbers) return [];
  if (typeof numbers === 'string') {
    try {
      const v = JSON.parse(numbers);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(numbers) ? (numbers as string[]) : [];
};

const LotteryResultsPage = () => {
  const { lotteryTypes } = useConfigStore();
  const { get: getDigitConfig } = useDigitPositionConfig();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrawRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<LotteryDrawSummary>(
    EMPTY_DRAW_SUMMARY,
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [gameIds, setGameIds] = useState<number[]>([]);
  const [status, setStatus] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<DrawDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const requestSeqRef = useRef(0);
  const queryRef = useRef<{
    page: number;
    search: string;
    gameIds: number[];
    status?: number;
    startDate?: string;
    endDate?: string;
  }>({ page: 1, search: '', gameIds: [] });

  const fetchData = async (
    p = queryRef.current.page,
    s = queryRef.current.search,
    gids = queryRef.current.gameIds,
    st = queryRef.current.status,
    startDate = queryRef.current.startDate,
    endDate = queryRef.current.endDate,
  ) => {
    queryRef.current = {
      page: p,
      search: s,
      gameIds: gids,
      status: st,
      startDate,
      endDate,
    };
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setLoading(true);
    try {
      const res = (await api.post('lottery/draws', {
        pageNo: p,
        pageSize,
        search: s ? s : undefined,
        gameIds: gids.length > 0 ? gids : undefined,
        status: st,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
      })) as unknown as DrawListResponse;
      if (requestSeqRef.current !== seq) return;
      setData(res.list);
      setTotal(res.total);
      setSummary(res.summary ?? EMPTY_DRAW_SUMMARY);
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      message.error(getApiErrorMessage(err, 'Failed to load'));
    } finally {
      if (requestSeqRef.current === seq) setLoading(false);
    }
  };

  const handleDateChange = (range: [Dayjs, Dayjs] | null) => {
    setDateRange(range);
    setPage(1);
    const start = range && range[0] ? range[0].format(DATE_FORMAT) : undefined;
    const end = range && range[1] ? range[1].format(DATE_FORMAT) : undefined;
    fetchData(1, search, gameIds, status, start, end);
  };

  const handleGameChange = (vals: number[]) => {
    setGameIds(vals);
    setPage(1);
    fetchData(1, search, vals, status);
  };

  const { statusMaps } = useConfigStore();
  const roundStatusMap: Record<number, StatusEntry> =
    statusMaps.round ?? EMPTY_STATUS_MAP;

  useEffect(() => {
    fetchData();
  }, []);

  const openDetail = async (record: DrawRecord) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = (await api.get(
        `lottery/draw-detail/${record.roundNo}?gameId=${record.gameId}`,
      )) as unknown as DrawDetailResponse;
      setDetailData(res);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load detail'));
    } finally {
      setDetailLoading(false);
    }
  };

  const hasTicketCount = data.some((d) => typeof d.ticketCount === 'number');

  const columns: ColumnsType<DrawRecord> = [
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 140,
      render: (v: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: 'Game',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 130,
      render: (v: string) => {
        const gt = lotteryTypes.find((t) => t.value === v);
        return (
          <Tag>
            {gt?.emoji} {gt?.label || v.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      sorter: true,
      render: (v: string) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {formatDateTime(v)}
        </span>
      ),
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      width: 260,
      render: (v: unknown, r: DrawRecord) =>
        v ? (
          <GameResultDisplay
            gameType={r.gameType}
            result={v}
            size={24}
            positionColors={getDigitConfig(r.gameId).colors}
            slatLabels={getDigitConfig(r.gameId).labels}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Pending</span>
        ),
    },
    ...(hasTicketCount
      ? [
          {
            title: 'Tickets',
            key: 'ticketCount',
            width: 90,
            render: (_: unknown, r: DrawRecord) =>
              typeof r.ticketCount === 'number' ? (
                <span style={{ fontWeight: 600 }}>{r.ticketCount}</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              ),
          } as ColumnsType<DrawRecord>[number],
        ]
      : []),
    {
      title: 'Sales',
      key: 'sales',
      width: 110,
      render: (_: unknown, r: DrawRecord) => (
        <MoneyText value={r.totalBet} variant="neutral" />
      ),
    },
    {
      title: 'Payout',
      key: 'payout',
      width: 110,
      render: (_: unknown, r: DrawRecord) => (
        <MoneyText value={r.totalPayout} variant="neutral" />
      ),
    },
    {
      title: 'P/L',
      key: 'pl',
      width: 110,
      render: (_: unknown, r: DrawRecord) => {
        const pl = r.totalBet - r.totalPayout;
        return <MoneyText value={pl} variant="auto" showSign />;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: DrawRecord) => (
        <Tooltip title="View Details">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Lottery Results"
        subtitle={`${total} lottery draws`}
        icon={<CrownOutlined />}
        iconBg="var(--gradient-green)"
        extra={
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
          </Tooltip>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="200px">
            <Input
              placeholder="Search round..."
              prefix={<SearchOutlined />}
              allowClear
              onPressEnter={(e) => {
                const v = (e.target as HTMLInputElement).value;
                setSearch(v);
                setPage(1);
                fetchData(1, v);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setSearch('');
                  fetchData(1, '');
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
                fetchData(1, search, gameIds, v);
              }}
              value={status}
              options={Object.entries(roundStatusMap).map(([k, v]) => ({
                value: Number(k),
                label: v.text,
              }))}
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
        </Row>
      </div>

      <StatCardGrid cards={drawStatCards(summary)} />

      <Table<DrawRecord>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        scroll={{ x: 1200 }}
        locale={{ emptyText: <Empty description="No lottery draws found" /> }}
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
        title="Lottery Draw Detail"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
        destroyOnHidden
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : detailData ? (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={8} md={6}>
                <div className="stat-card">
                  <Statistic
                    title="Round"
                    value={orDash(detailData.round?.roundNo)}
                  />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div className="stat-card">
                  <Statistic
                    title="Tickets Sold"
                    value={detailData.ticketCount}
                  />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div className="stat-card">
                  <Statistic
                    title="Winners"
                    value={detailData.wonCount}
                    valueStyle={{ color: 'var(--success)' }}
                  />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    Total Payout
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    <MoneyText
                      value={detailData.round?.totalPayout}
                      variant="neutral"
                    />
                  </div>
                </div>
              </Col>
            </Row>

            {Boolean(detailData.round?.result) && (
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  textAlign: 'center',
                  background: 'var(--bg-card-alt)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Draw Result
                </div>
                {detailData.round.gameType === 'kerala' ? (
                  <KeralaCode
                    code={parseResultCode(detailData.round.result)}
                    size={32}
                  />
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GameResultDisplay
                      gameType={detailData.round.gameType}
                      result={detailData.round.result}
                      size={36}
                      positionColors={getDigitConfig(detailData.round.gameId).colors}
                      slatLabels={getDigitConfig(detailData.round.gameId).labels}
                    />
                  </div>
                )}
              </Card>
            )}

            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Prize Tiers
            </div>
            {detailData.prizeTiers.length > 0 ? (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {detailData.prizeTiers.map((tier, i) => {
                  const codes = parseNumbers(tier.numbers);
                  const icon =
                    PRIZE_ICONS[tier.prizeTier?.toLowerCase()] ||
                    PRIZE_ICONS[tier.prizeName?.toLowerCase()] ||
                    '🎯';
                  return (
                    <Card
                      key={i}
                      size="small"
                      style={{
                        borderRadius: 10,
                        borderLeft: `3px solid ${i === 0 ? 'var(--warning)' : i === 1 ? 'var(--color-silver)' : i === 2 ? 'var(--color-gold)' : 'var(--border-default)'}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: codes.length > 0 ? 8 : 0,
                        }}
                      >
                        <Space>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {tier.prizeName || tier.prizeTier}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {tier.prizeTier}
                            </div>
                          </div>
                        </Space>
                        <span style={{ fontSize: 16 }}>
                          <MoneyText
                            value={tier.prizeAmt}
                            variant="positive"
                          />
                        </span>
                      </div>
                      {codes.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            paddingTop: 8,
                            borderTop: '1px solid var(--border-light)',
                          }}
                        >
                          {codes.map((code: string, ci: number) => (
                            <KeralaCode key={ci} code={code} size={18} />
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty description="No prize tier data available" />
            )}
          </div>
        ) : (
          <Empty description="No detail data" />
        )}
      </Modal>
    </div>
  );
};

export default LotteryResultsPage;

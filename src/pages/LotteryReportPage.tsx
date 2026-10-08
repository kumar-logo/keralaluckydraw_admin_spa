import { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  DatePicker,
  Button,
  Table,
  message,
  Card,
  Select,
  Space,
  Alert,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  SyncOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';
import { downloadFile } from '../services/download';
import { getApiBaseUrl } from '../config/env';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import { themeColor } from '../theme';
import { CURRENCY_SYMBOL, formatMoney, formatNumber } from '../utils/format';

const { RangePicker } = DatePicker;

const ADMIN_API_BASE = `${getApiBaseUrl()}/admin/api/v1`;
const TOKEN_STORAGE_KEY = 'admin_token';
const DATE_FORMAT = 'YYYY-MM-DD';

const buildLotteryCsvUrl = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  gameType?: string,
): string => {
  const params = new URLSearchParams();
  params.set('startDate', startDate.format(DATE_FORMAT));
  params.set('endDate', endDate.format(DATE_FORMAT));
  if (gameType) params.set('gameType', gameType);
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) params.set('token', token);
  return `${ADMIN_API_BASE}/reports/lottery/download?${params.toString()}`;
};

interface LotteryByType {
  gameType: string;
  totalSold: number;
  totalPrize: number;
  profit: number;
  ticketCount: number;
  playerCount: number;
}

interface LotteryData {
  summary: {
    totalSold: number;
    totalPrize: number;
    profit: number;
    totalTickets: number;
  };
  byType: LotteryByType[];
}

interface ReportGame {
  gameId: number;
  gameName: string;
}
interface DrawSlot {
  value: string;
  label: string;
}

interface ReportSlotList {
  isMultiDraw: boolean;
  drawSlots: DrawSlot[];
  digitLengths: DrawSlot[];
}

interface RebuildResponse {
  slices: number;
}

const buildSlotsPath = (
  gameId: number,
  startDate: dayjs.Dayjs | null,
  endDate: dayjs.Dayjs | null,
): string => {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate.format(DATE_FORMAT));
  if (endDate) params.set('endDate', endDate.format(DATE_FORMAT));
  const qs = params.toString();
  return qs
    ? `lottery/report/slots/${gameId}?${qs}`
    : `lottery/report/slots/${gameId}`;
};

const TicketReportSection = () => {
  const [games, setGames] = useState<ReportGame[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [drawSlots, setDrawSlots] = useState<DrawSlot[]>([]);
  const [roundId, setRoundId] = useState<string>('all');
  const [digitLengths, setDigitLengths] = useState<DrawSlot[]>([]);
  const [digitLength, setDigitLength] = useState<string>('all');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [downloading, setDownloading] = useState<string>('');
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    api
      .get('lottery/report/games')
      .then((res) => {
        const list = res as unknown as ReportGame[];
        setGames(Array.isArray(list) ? list : []);
      })
      .catch(() => message.error('Failed to load lotteries'));
  }, []);

  const applySlotList = useCallback((list: ReportSlotList) => {
    setDrawSlots(list.drawSlots);
    setDigitLengths(list.digitLengths);
    setRoundId((current) =>
      current === 'all' || list.drawSlots.some((s) => s.value === current)
        ? current
        : 'all',
    );
  }, []);

  useEffect(() => {
    if (!gameId) {
      setDrawSlots([]);
      setDigitLengths([]);
      return;
    }
    let cancelled = false;
    api
      .get(buildSlotsPath(gameId, startDate, endDate))
      .then((res) => {
        if (!cancelled) applySlotList(res as unknown as ReportSlotList);
      })
      .catch(() => {
        if (cancelled) return;
        setDrawSlots([]);
        setDigitLengths([]);
        setRoundId('all');
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, startDate, endDate, applySlotList]);

  const query = () => {
    const params = new URLSearchParams();
    params.set('gameId', String(gameId));
    if (roundId && roundId !== 'all') params.set('roundId', roundId);
    if (digitLength && digitLength !== 'all')
      params.set('digitLength', digitLength);
    if (startDate) params.set('startDate', startDate.format('YYYY-MM-DD'));
    if (endDate) params.set('endDate', endDate.format('YYYY-MM-DD'));
    return params.toString();
  };

  const download = async (kind: 'profit-loss' | 'number-wise') => {
    if (!gameId) {
      message.warning('Please select a lottery');
      return;
    }
    setDownloading(kind);
    try {
      await downloadFile(
        `/lottery/report/${kind}/download?${query()}`,
        `${kind}.pdf`,
      );
    } catch {
      message.error('Download failed');
    } finally {
      setDownloading('');
    }
  };

  const rebuild = async () => {
    if (!gameId) {
      message.warning('Please select a lottery');
      return;
    }
    setRebuilding(true);
    try {
      const res = (await api.post('lottery/report/rebuild', {
        gameId,
      })) as unknown as RebuildResponse;
      message.success(`Rollup rebuilt: ${res.slices} slices`);
      const list = (await api.get(
        buildSlotsPath(gameId, startDate, endDate),
      )) as unknown as ReportSlotList;
      applySlotList(list);
    } catch {
      message.error('Rebuild failed');
    } finally {
      setRebuilding(false);
    }
  };

  const clear = () => {
    setRoundId('all');
    setDigitLength('all');
    setStartDate(dayjs());
    setEndDate(dayjs());
  };

  const dateMd =
    16 - (drawSlots.length > 0 ? 5 : 0) - (digitLengths.length > 0 ? 5 : 0);

  return (
    <Card
      title="Ticket reports"
      style={{ marginBottom: 24, borderRadius: 12 }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Select Lottery</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select One"
            value={gameId !== null ? gameId : undefined}
            onChange={(v) => {
              setGameId(v);
              clear();
            }}
            options={games.map((g) => ({ value: g.gameId, label: g.gameName }))}
            showSearch
            optionFilterProp="label"
          />
        </Col>
        {drawSlots.length > 0 && (
          <Col xs={24} md={5}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Time Slot</div>
            <Select
              style={{ width: '100%' }}
              value={roundId}
              onChange={setRoundId}
              disabled={!gameId}
              showSearch
              optionFilterProp="label"
              options={[
                { value: 'all', label: 'All Draws' },
                ...drawSlots.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              ]}
            />
          </Col>
        )}
        {digitLengths.length > 0 && (
          <Col xs={24} md={5}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Digit Length</div>
            <Select
              style={{ width: '100%' }}
              value={digitLength}
              onChange={setDigitLength}
              disabled={!gameId}
              options={[
                { value: 'all', label: 'All Digits' },
                ...digitLengths.map((d) => ({
                  value: d.value,
                  label: d.label,
                })),
              ]}
            />
          </Col>
        )}
        <Col xs={24} md={dateMd}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Date Range</div>
          <RangePicker
            style={{ width: '100%' }}
            value={
              [startDate, endDate] as [dayjs.Dayjs | null, dayjs.Dayjs | null]
            }
            onChange={(d) => {
              setStartDate(d && d[0] ? d[0] : null);
              setEndDate(d && d[1] ? d[1] : null);
            }}
          />
        </Col>
      </Row>

      {gameId ? (
        <Space wrap style={{ marginTop: 20 }}>
          <Button
            type="primary"
            danger
            icon={<FilePdfOutlined />}
            loading={downloading === 'profit-loss'}
            onClick={() => download('profit-loss')}
          >
            Download Profit &amp; Loss Report
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={downloading === 'number-wise'}
            onClick={() => download('number-wise')}
          >
            Download Number Wise Sales Report
          </Button>
          <Button
            icon={<SyncOutlined />}
            loading={rebuilding}
            onClick={rebuild}
          >
            Rebuild Rollup
          </Button>
          <Button onClick={clear}>Clear Filters</Button>
        </Space>
      ) : (
        <Alert
          style={{ marginTop: 20 }}
          type="warning"
          showIcon
          message="Please select a lottery to generate reports."
        />
      )}
    </Card>
  );
};

const LotteryReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LotteryData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/lottery', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as LotteryData;
      setData(res);
    } catch {
      message.error('Failed to load lottery report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const downloadCsv = () => {
    window.open(buildLotteryCsvUrl(dateRange[0], dateRange[1]), '_blank');
  };

  if (loading && !data) return <PageLoader cards={4} />;

  return (
    <div className="page-container">
      <PageHeader
        title="Lottery Report"
        subtitle="Lottery sales and prize analytics"
        icon={<TrophyOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RangePicker
              value={dateRange}
              onChange={(d) => {
                if (d) setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]);
              }}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchReport}
              loading={loading}
            >
              Generate
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadCsv}>
              Download CSV
            </Button>
          </div>
        }
      />

      {data && (
        <>
          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              sm={12}
              lg={6}
              className="animate-fade-in-up stagger-1"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Sold"
                value={data.summary.totalSold}
                icon={<DollarOutlined />}
                color="blue"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={6}
              className="animate-fade-in-up stagger-2"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Prize"
                value={data.summary.totalPrize}
                icon={<TrophyOutlined />}
                color="orange"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={6}
              className="animate-fade-in-up stagger-3"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Profit"
                value={data.summary.profit}
                icon={<RiseOutlined />}
                color="green"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={6}
              className="animate-fade-in-up stagger-4"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Tickets"
                value={data.summary.totalTickets}
                icon={<FileTextOutlined />}
                color="purple"
              />
            </Col>
          </Row>

          <TicketReportSection />

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              className="animate-fade-in-up stagger-5"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Sales vs Prize by Game Type" height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byType}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-light)"
                    />
                    <XAxis
                      dataKey="gameType"
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number | string) => formatMoney(v)}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar
                      dataKey="totalSold"
                      name="Total Sold"
                      fill={themeColor.indigo()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="totalPrize"
                      name="Total Prize"
                      fill={themeColor.warning()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="profit"
                      name="Profit"
                      fill={themeColor.success()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <ChartCard title="Breakdown by Game Type">
            <Table<LotteryByType>
              rowKey="gameType"
              columns={[
                {
                  title: 'Game Type',
                  dataIndex: 'gameType',
                  key: 'gameType',
                  width: 120,
                },
                {
                  title: 'Tickets',
                  dataIndex: 'ticketCount',
                  key: 'ticketCount',
                  width: 100,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Players',
                  dataIndex: 'playerCount',
                  key: 'playerCount',
                  width: 100,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Total Sold',
                  dataIndex: 'totalSold',
                  key: 'totalSold',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Total Prize',
                  dataIndex: 'totalPrize',
                  key: 'totalPrize',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Profit',
                  dataIndex: 'profit',
                  key: 'profit',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="auto" />,
                },
              ]}
              dataSource={data.byType}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default LotteryReportPage;

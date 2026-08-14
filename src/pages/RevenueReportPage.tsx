import { useState, useEffect } from 'react';
import { Row, Col, DatePicker, Button, Table, Empty, message } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
  ReloadOutlined,
  LineChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
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
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import { themeColor } from '../theme';
import {
  CURRENCY_SYMBOL,
  formatMoney,
  formatNumber,
  formatPercent,
} from '../utils/format';

const { RangePicker } = DatePicker;

interface RevenueByGame {
  gameType: string;
  gameName: string;
  totalBets: number;
  totalPayouts: number;
  netRevenue: number;
  roundCount: number;
  orderCount: number;
}

interface RevenueData {
  summary: {
    totalBets: number;
    totalPayouts: number;
    netRevenue: number;
    marginPercent: number;
  };
  byGame: RevenueByGame[];
  daily: {
    date: string;
    totalBets: number;
    totalPayouts: number;
    netRevenue: number;
  }[];
}

const csvEscape = (value: string | number): string => {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
  const lines = [header.map(csvEscape).join(',')];
  for (const r of rows) lines.push(r.map(csvEscape).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const computeMargin = (row: RevenueByGame): number => {
  const bets = row.totalBets;
  if (bets <= 0) return 0;
  return (row.netRevenue / bets) * 100;
};

const RevenueReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/revenue', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as RevenueData;
      setData(res);
    } catch {
      message.error('Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !data) return <PageLoader cards={4} />;

  const exportCsv = () => {
    if (!data) return;
    const header = [
      'Game',
      'Rounds',
      'Orders',
      'Sales',
      'Payouts',
      'Revenue',
      'Margin %',
    ];
    const rows = data.byGame.map((g) => [
      g.gameName,
      g.roundCount,
      g.orderCount,
      g.totalBets.toFixed(2),
      g.totalPayouts.toFixed(2),
      g.netRevenue.toFixed(2),
      computeMargin(g).toFixed(2),
    ]);
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');
    downloadCsv(`revenue-by-game_${start}_${end}.csv`, header, rows);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Revenue Report"
        subtitle="Financial performance analytics"
        icon={<LineChartOutlined />}
        iconBg="var(--gradient-green)"
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
            <Button
              icon={<DownloadOutlined />}
              onClick={exportCsv}
              disabled={!data || data.byGame.length === 0}
            >
              Export CSV
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
                title="Total Bets"
                value={data.summary.totalBets}
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
                title="Total Payouts"
                value={data.summary.totalPayouts}
                icon={<FallOutlined />}
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
                title="Net Revenue"
                value={data.summary.netRevenue}
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
                title="Margin %"
                value={data.summary.marginPercent}
                icon={<PercentageOutlined />}
                color="purple"
                suffix="%"
                precision={2}
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              className="animate-fade-in-up stagger-5"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Daily Revenue Trend" height={320}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={data.daily}>
                    <defs>
                      <linearGradient id="revBets" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={themeColor.indigo()}
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor={themeColor.indigo()}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="revNet" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={themeColor.success()}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={themeColor.success()}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-light)"
                    />
                    <XAxis
                      dataKey="date"
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
                    <Area
                      type="monotone"
                      dataKey="totalBets"
                      name="Bets"
                      stroke={themeColor.indigo()}
                      fill="url(#revBets)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalPayouts"
                      name="Payouts"
                      stroke={themeColor.warning()}
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="netRevenue"
                      name="Net Revenue"
                      stroke={themeColor.success()}
                      fill="url(#revNet)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              className="animate-fade-in-up stagger-6"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Revenue by Game" height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byGame} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-light)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="gameName"
                      type="category"
                      tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                      width={100}
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
                      dataKey="totalBets"
                      name="Bets"
                      fill={themeColor.indigo()}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="netRevenue"
                      name="Net Revenue"
                      fill={themeColor.success()}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <ChartCard title="Revenue by Game (detail)">
            <Table<RevenueByGame>
              rowKey="gameType"
              columns={[
                {
                  title: 'Game',
                  dataIndex: 'gameName',
                  key: 'gameName',
                  width: 160,
                },
                {
                  title: 'Rounds',
                  dataIndex: 'roundCount',
                  key: 'roundCount',
                  width: 100,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Orders',
                  dataIndex: 'orderCount',
                  key: 'orderCount',
                  width: 100,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Sales',
                  dataIndex: 'totalBets',
                  key: 'totalBets',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Payouts',
                  dataIndex: 'totalPayouts',
                  key: 'totalPayouts',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Revenue',
                  dataIndex: 'netRevenue',
                  key: 'netRevenue',
                  width: 140,
                  render: (v: number) => <MoneyText value={v} variant="auto" />,
                },
                {
                  title: 'Margin %',
                  key: 'margin',
                  width: 110,
                  render: (_: unknown, row: RevenueByGame) =>
                    formatPercent(computeMargin(row)),
                },
              ]}
              dataSource={data.byGame}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 880 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default RevenueReportPage;

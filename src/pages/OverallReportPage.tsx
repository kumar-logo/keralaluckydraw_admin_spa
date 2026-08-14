import { useState, useEffect } from 'react';
import { Row, Col, DatePicker, Button, Table, message, Empty } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  SwapOutlined,
  WalletOutlined,
  BankOutlined,
  FileTextOutlined,
  UserAddOutlined,
  ReloadOutlined,
  BarChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
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
import { CURRENCY_SYMBOL, formatMoney, formatNumber } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const { RangePicker } = DatePicker;

interface OverallDaily {
  date: string;
  totalBet: number;
  totalPayout: number;
  netRevenue: number;
  activePlayers: number;
  orderCount: number;
  recharge: number;
  withdraw: number;
  newUsers: number;
}

interface OverallData {
  summary: {
    totalBet: number;
    totalPayout: number;
    netRevenue: number;
    totalRecharge: number;
    totalWithdraw: number;
    netFlow: number;
    totalOrders: number;
    totalNewUsers: number;
  };
  daily: OverallDaily[];
}

const sumKey = (rows: OverallDaily[], key: keyof OverallDaily): number =>
  rows.reduce((acc, row) => {
    const value = row[key];
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);

const OverallReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverallData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/overall', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as OverallData;
      setData(res);
    } catch {
      message.error('Failed to load overall report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !data) return <PageLoader cards={8} />;

  const dailyRows = data ? data.daily : [];
  const totals = data
    ? {
        totalBet: sumKey(dailyRows, 'totalBet'),
        totalPayout: sumKey(dailyRows, 'totalPayout'),
        netRevenue: sumKey(dailyRows, 'netRevenue'),
        activePlayers: sumKey(dailyRows, 'activePlayers'),
        orderCount: sumKey(dailyRows, 'orderCount'),
        recharge: sumKey(dailyRows, 'recharge'),
        withdraw: sumKey(dailyRows, 'withdraw'),
        newUsers: sumKey(dailyRows, 'newUsers'),
      }
    : null;

  const exportCsv = () => {
    if (!data) return;
    const header = [
      'Date',
      'Total Bet',
      'Total Payout',
      'Net Revenue',
      'Active Players',
      'Orders',
      'Recharge',
      'Withdraw',
      'New Users',
    ];
    const rows = dailyRows.map((r) => [
      r.date,
      r.totalBet.toFixed(2),
      r.totalPayout.toFixed(2),
      r.netRevenue.toFixed(2),
      r.activePlayers,
      r.orderCount,
      r.recharge.toFixed(2),
      r.withdraw.toFixed(2),
      r.newUsers,
    ]);
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');
    downloadCsv(`overall-report_${start}_${end}.csv`, header, rows);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Overall Report"
        subtitle="Comprehensive platform overview"
        icon={<BarChartOutlined />}
        iconBg="var(--gradient-indigo)"
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
              disabled={!data}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {data && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-1"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Bet"
                value={data.summary.totalBet}
                icon={<DollarOutlined />}
                color="blue"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-2"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Payout"
                value={data.summary.totalPayout}
                icon={<FallOutlined />}
                color="orange"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={12}
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
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-4"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Net Flow"
                value={data.summary.netFlow}
                icon={<SwapOutlined />}
                color="purple"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-5"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Recharge"
                value={data.summary.totalRecharge}
                icon={<WalletOutlined />}
                color="cyan"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-6"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Withdraw"
                value={data.summary.totalWithdraw}
                icon={<BankOutlined />}
                color="red"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-7"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Orders"
                value={data.summary.totalOrders}
                icon={<FileTextOutlined />}
                color="indigo"
              />
            </Col>
            <Col
              xs={12}
              lg={6}
              className="animate-fade-in-up stagger-8"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="New Users"
                value={data.summary.totalNewUsers}
                icon={<UserAddOutlined />}
                color="pink"
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <ChartCard title="Revenue & Flow Trend" height={320}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={data.daily}>
                    <defs>
                      <linearGradient
                        id="ovRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
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
                      dataKey="recharge"
                      name="Recharge"
                      fill={themeColor.cyan()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                      opacity={0.7}
                    />
                    <Bar
                      dataKey="withdraw"
                      name="Withdraw"
                      fill={themeColor.warning()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                      opacity={0.7}
                    />
                    <Line
                      type="monotone"
                      dataKey="netRevenue"
                      name="Net Revenue"
                      stroke={themeColor.success()}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col xs={24} lg={10}>
              <ChartCard title="User Activity" height={320}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={data.daily}>
                    <defs>
                      <linearGradient id="ovUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={themeColor.purple()}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={themeColor.purple()}
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
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Area
                      type="monotone"
                      dataKey="activePlayers"
                      name="Active Players"
                      stroke={themeColor.purple()}
                      fill="url(#ovUsers)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      name="New Users"
                      stroke={themeColor.success()}
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <ChartCard title="Daily Breakdown">
            <Table<OverallDaily>
              rowKey="date"
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
                {
                  title: 'Bets',
                  dataIndex: 'totalBet',
                  key: 'totalBet',
                  width: 130,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Payouts',
                  dataIndex: 'totalPayout',
                  key: 'totalPayout',
                  width: 130,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Revenue',
                  dataIndex: 'netRevenue',
                  key: 'netRevenue',
                  width: 130,
                  render: (v: number) => <MoneyText value={v} variant="auto" />,
                },
                {
                  title: 'Players',
                  dataIndex: 'activePlayers',
                  key: 'activePlayers',
                  width: 90,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Orders',
                  dataIndex: 'orderCount',
                  key: 'orderCount',
                  width: 90,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Recharge',
                  dataIndex: 'recharge',
                  key: 'recharge',
                  width: 130,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Withdraw',
                  dataIndex: 'withdraw',
                  key: 'withdraw',
                  width: 130,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'New Users',
                  dataIndex: 'newUsers',
                  key: 'newUsers',
                  width: 100,
                  render: (v: number) => formatNumber(v),
                },
              ]}
              dataSource={dailyRows}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 1100 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              summary={() =>
                totals ? (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <MoneyText value={totals.totalBet} variant="neutral" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <MoneyText value={totals.totalPayout} variant="neutral" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <MoneyText value={totals.netRevenue} variant="auto" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        {formatNumber(totals.activePlayers)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        {formatNumber(totals.orderCount)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6}>
                        <MoneyText value={totals.recharge} variant="neutral" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7}>
                        <MoneyText value={totals.withdraw} variant="neutral" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8}>
                        {formatNumber(totals.newUsers)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                ) : null
              }
            />
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default OverallReportPage;

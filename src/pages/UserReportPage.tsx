import { useState, useEffect } from 'react';
import { Row, Col, DatePicker, Button, Table, Empty, message } from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  TeamOutlined,
  DollarOutlined,
  ReloadOutlined,
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
} from 'recharts';
import api from '../services/api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import { themeColor } from '../theme';
import { CURRENCY_SYMBOL, formatNumber } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const { RangePicker } = DatePicker;

interface DepositorRow {
  userId: string;
  nickname: string;
  phone: string;
  totalRecharge: number;
  totalBet: number;
}

interface WinnerRow {
  userId: string;
  nickname: string;
  phone: string;
  totalWin: number;
  totalBet: number;
}

interface UserReportData {
  summary: {
    totalUsers: number;
    newUsersToday: number;
    activeUsersToday: number;
    totalRecharge: number;
    totalWithdraw: number;
  };
  topDepositors: DepositorRow[];
  topWinners: WinnerRow[];
  registrationTrend: { date: string; count: number }[];
}

const UserReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserReportData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/users', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as UserReportData;
      setData(res);
    } catch {
      message.error('Failed to load user report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !data) return <PageLoader cards={4} />;

  const depositorColumns = [
    {
      title: 'Rank #',
      key: 'rank',
      width: 80,
      render: (_: unknown, __: DepositorRow, index: number) => index + 1,
    },
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 120 },
    { title: 'Nickname', dataIndex: 'nickname', key: 'nickname', width: 150 },
    {
      title: 'Total Recharge',
      dataIndex: 'totalRecharge',
      key: 'totalRecharge',
      width: 160,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 160,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
  ];

  const winnerColumns = [
    {
      title: 'Rank #',
      key: 'rank',
      width: 80,
      render: (_: unknown, __: WinnerRow, index: number) => index + 1,
    },
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 120 },
    { title: 'Nickname', dataIndex: 'nickname', key: 'nickname', width: 150 },
    {
      title: 'Net',
      key: 'net',
      width: 160,
      render: (_: unknown, row: WinnerRow) => (
        <MoneyText value={row.totalWin - row.totalBet} variant="auto" />
      ),
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 160,
      render: (v: number) => <MoneyText value={v} variant="auto" />,
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 160,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
  ];

  const depositorCount = data ? data.topDepositors.length : 0;
  const winnerCount = data ? data.topWinners.length : 0;

  const exportCsv = () => {
    if (!data) return;
    const header = [
      'Type',
      'Rank',
      'User ID',
      'Nickname',
      'Phone',
      'Total Recharge',
      'Total Bet',
      'Total Win',
    ];
    const rows: (string | number)[][] = [];
    data.topDepositors.forEach((d, i) =>
      rows.push([
        'Depositor',
        i + 1,
        d.userId,
        d.nickname,
        d.phone,
        d.totalRecharge.toFixed(2),
        d.totalBet.toFixed(2),
        '',
      ]),
    );
    data.topWinners.forEach((w, i) =>
      rows.push([
        'Winner',
        i + 1,
        w.userId,
        w.nickname,
        w.phone,
        '',
        w.totalBet.toFixed(2),
        w.totalWin.toFixed(2),
      ]),
    );
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');
    downloadCsv(`user-report_${start}_${end}.csv`, header, rows);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="User Report"
        subtitle="User analytics and engagement metrics"
        icon={<TeamOutlined />}
        iconBg="var(--gradient-blue)"
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
          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              sm={12}
              lg={5}
              className="animate-fade-in-up stagger-1"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Users"
                value={data.summary.totalUsers}
                icon={<TeamOutlined />}
                color="blue"
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={5}
              className="animate-fade-in-up stagger-2"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="New Today"
                value={data.summary.newUsersToday}
                icon={<UserAddOutlined />}
                color="green"
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={5}
              className="animate-fade-in-up stagger-3"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Active Today"
                value={data.summary.activeUsersToday}
                icon={<UserOutlined />}
                color="purple"
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={5}
              className="animate-fade-in-up stagger-4"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Recharge"
                value={data.summary.totalRecharge}
                icon={<DollarOutlined />}
                color="orange"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-5"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Withdraw"
                value={data.summary.totalWithdraw}
                icon={<DollarOutlined />}
                color="red"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              className="animate-fade-in-up stagger-6"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Registration Trend" height={280}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.registrationTrend}>
                    <defs>
                      <linearGradient id="userBar" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={themeColor.indigo()}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor={themeColor.purple()}
                          stopOpacity={0.6}
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
                      formatter={(v: number | string) => formatNumber(v)}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="New Registrations"
                      fill="url(#userBar)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col
              xs={24}
              lg={12}
              className="animate-fade-in-up stagger-7"
              style={{ opacity: 0 }}
            >
              <ChartCard title={`Top ${depositorCount} Depositors`}>
                <Table<DepositorRow>
                  rowKey="userId"
                  columns={depositorColumns}
                  dataSource={data.topDepositors}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="modern-table"
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              </ChartCard>
            </Col>
            <Col
              xs={24}
              lg={12}
              className="animate-fade-in-up stagger-8"
              style={{ opacity: 0 }}
            >
              <ChartCard title={`Top ${winnerCount} Winners`}>
                <Table<WinnerRow>
                  rowKey="userId"
                  columns={winnerColumns}
                  dataSource={data.topWinners}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  className="modern-table"
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              </ChartCard>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default UserReportPage;

import { useEffect, useRef, useState } from 'react';
import { Row, Col, DatePicker, message, Typography } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  BankOutlined,
  RiseOutlined,
  UserAddOutlined,
  DashboardOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { StatCardGrid } from '../components/StatCard';
import type { StatCardProps } from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import { getChartColors, themeColor } from '../theme';
import { formatMoney, formatNumber, DATE_FORMAT } from '../utils/format';

const { RangePicker } = DatePicker;

interface DashboardData {
  startDate: string;
  endDate: string;
  todayRecharge: number;
  todayWithdraw: number;
  todayProfit: number;
  todayReferralCommission: number;
  todayWinBonus: number;
  monthRecharge: number;
  monthWithdraw: number;
  monthProfit: number;
  monthReferralCommission: number;
  monthWinBonus: number;
  totalUsers: number;
  todayJoinUsers: number;
  revenueChart: {
    date: string;
    revenue: number;
    bets: number;
    payouts: number;
  }[];
  gameDistribution: { name: string; value: number }[];
  userGrowth: { date: string; users: number }[];
}

const CHART_COLORS = getChartColors();

const EMPTY_DATA: DashboardData = {
  startDate: '',
  endDate: '',
  todayRecharge: 0,
  todayWithdraw: 0,
  todayProfit: 0,
  todayReferralCommission: 0,
  todayWinBonus: 0,
  monthRecharge: 0,
  monthWithdraw: 0,
  monthProfit: 0,
  monthReferralCommission: 0,
  monthWinBonus: 0,
  totalUsers: 0,
  todayJoinUsers: 0,
  revenueChart: [],
  gameDistribution: [],
  userGrowth: [],
};

const monthDefault = (): [Dayjs, Dayjs] => [
  dayjs().startOf('month'),
  dayjs(),
];

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(monthDefault);
  const requestSeqRef = useRef(0);

  const fetchDashboard = async (start: Dayjs, end: Dayjs) => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setLoading(true);
    try {
      const res = (await api.get('dashboard', {
        params: {
          startDate: start.format(DATE_FORMAT),
          endDate: end.format(DATE_FORMAT),
        },
      })) as unknown as DashboardData;
      if (requestSeqRef.current !== seq) return;
      setData(res);
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      message.error(msg);
    } finally {
      if (requestSeqRef.current === seq) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(range[0], range[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (value: [Dayjs, Dayjs] | null) => {
    const next = value && value[0] && value[1] ? value : monthDefault();
    setRange(next);
    fetchDashboard(next[0], next[1]);
  };

  if (loading) return <PageLoader cards={4} table />;

  const todayCards: (StatCardProps & { key: string })[] = [
    {
      key: 'todayRecharge',
      label: 'Today Recharge',
      value: data.todayRecharge,
      gradient: 'green',
      money: true,
      sub: 'Approved deposits + manual credits',
      icon: <DollarOutlined />,
    },
    {
      key: 'todayWithdraw',
      label: 'Today Withdraw',
      value: data.todayWithdraw,
      gradient: 'red',
      money: true,
      sub: 'Approved payouts today',
      icon: <BankOutlined />,
    },
    {
      key: 'todayProfit',
      label: 'Today Profit',
      value: data.todayProfit,
      gradient: 'cyan',
      money: true,
      showSign: true,
      sub: 'Bets − Payouts (settled)',
      icon: <RiseOutlined />,
    },
    {
      key: 'todayReferralCommission',
      label: 'Today Referral Commission',
      value: data.todayReferralCommission,
      gradient: 'purple',
      money: true,
      sub: 'All users’ referral commission today',
      icon: <TeamOutlined />,
    },
    {
      key: 'todayWinBonus',
      label: 'Today Win Bonus',
      value: data.todayWinBonus,
      gradient: 'orange',
      money: true,
      sub: 'All game winnings paid today',
      icon: <TrophyOutlined />,
    },
  ];

  const monthCards: (StatCardProps & { key: string })[] = [
    {
      key: 'monthRecharge',
      label: 'This Month Recharge',
      value: data.monthRecharge,
      gradient: 'green',
      money: true,
      sub: 'Approved deposits + manual credits',
      icon: <DollarOutlined />,
    },
    {
      key: 'monthWithdraw',
      label: 'This Month Withdraw',
      value: data.monthWithdraw,
      gradient: 'red',
      money: true,
      sub: 'Approved payouts this month',
      icon: <BankOutlined />,
    },
    {
      key: 'monthProfit',
      label: 'This Month Profit',
      value: data.monthProfit,
      gradient: 'cyan',
      money: true,
      showSign: true,
      sub: 'Bets − Payouts (settled)',
      icon: <RiseOutlined />,
    },
    {
      key: 'monthReferralCommission',
      label: 'This Month Referral Commission',
      value: data.monthReferralCommission,
      gradient: 'purple',
      money: true,
      sub: 'All users’ referral commission this month',
      icon: <TeamOutlined />,
    },
    {
      key: 'monthWinBonus',
      label: 'This Month Win Bonus',
      value: data.monthWinBonus,
      gradient: 'orange',
      money: true,
      sub: 'All game winnings paid this month',
      icon: <TrophyOutlined />,
    },
  ];

  const userCards: (StatCardProps & { key: string })[] = [
    {
      key: 'totalUsers',
      label: 'Total User',
      value: formatNumber(data.totalUsers),
      gradient: 'orange',
      sub: 'All registered users',
      icon: <UserOutlined />,
    },
    {
      key: 'todayJoinUsers',
      label: 'Today Join User',
      value: formatNumber(data.todayJoinUsers),
      gradient: 'purple',
      sub: 'Registered today',
      icon: <UserAddOutlined />,
    },
  ];

  const gameData = data.gameDistribution;

  const moneyTooltipFormatter = (value: number | string): string =>
    formatMoney(value);

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your platform performance"
        icon={<DashboardOutlined />}
        iconBg="var(--gradient-green)"
        extra={
          <RangePicker
            allowClear={false}
            value={range}
            format={DATE_FORMAT}
            onChange={(value) =>
              handleRangeChange(value as [Dayjs, Dayjs] | null)
            }
          />
        }
      />

      <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
        Today
      </Typography.Title>
      <StatCardGrid cards={todayCards} />

      <Typography.Title level={5} style={{ margin: '8px 0 12px' }}>
        This Month
      </Typography.Title>
      <StatCardGrid cards={monthCards} />

      <Typography.Title level={5} style={{ margin: '8px 0 12px' }}>
        Users
      </Typography.Title>
      <StatCardGrid cards={userCards} />

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col
          xs={24}
          lg={16}
          className="animate-fade-in-up stagger-5"
          style={{ opacity: 0 }}
        >
          <ChartCard title="Revenue Overview" height={320}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.revenueChart}>
                <defs>
                  <linearGradient id="gradBets" x1="0" y1="0" x2="0" y2="1">
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
                  <linearGradient id="gradPayouts" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={themeColor.warning()}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={themeColor.warning()}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={moneyTooltipFormatter}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Area
                  type="monotone"
                  dataKey="bets"
                  name="Bets"
                  stroke={themeColor.indigo()}
                  fill="url(#gradBets)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="payouts"
                  name="Payouts"
                  stroke={themeColor.warning()}
                  fill="url(#gradPayouts)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={themeColor.success()}
                  fill="url(#gradRevenue)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
        <Col
          xs={24}
          lg={8}
          className="animate-fade-in-up stagger-6"
          style={{ opacity: 0 }}
        >
          <ChartCard title="Game Distribution" height={320}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={gameData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent == null ? '' : `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                >
                  {gameData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={moneyTooltipFormatter}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col
          xs={24}
          className="animate-fade-in-up stagger-7"
          style={{ opacity: 0 }}
        >
          <ChartCard title="User Registration Trend" height={280}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={themeColor.success()}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={themeColor.approve()}
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
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar
                  dataKey="users"
                  name="New Users"
                  fill="url(#gradBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

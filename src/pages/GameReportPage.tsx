import { useState, useEffect } from 'react';
import { Row, Col, DatePicker, Button, Table, Tag, Empty, message } from 'antd';
import {
  TrophyOutlined,
  ReloadOutlined,
  PieChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
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
import api from '../services/api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import { getChartColors, themeColor } from '../theme';
import {
  CURRENCY_SYMBOL,
  formatMoney,
  formatNumber,
  formatPercent,
} from '../utils/format';
import { downloadCsv } from '../utils/csv';

const { RangePicker } = DatePicker;
const COLORS = getChartColors();

interface GameRow {
  gameId: number;
  gameName: string;
  gameType: string;
  totalRounds: number;
  totalOrders: number;
  totalBets: number;
  totalPayouts: number;
  netRevenue: number;
  houseEdge: number;
  avgBetPerRound: number;
  highPayoutRounds: number;
}

interface GameReportData {
  summary: {
    totalGames: number;
    totalRounds: number;
    totalBets: number;
    totalPayouts: number;
    overallMargin: number;
  };
  games: GameRow[];
}

const GameReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GameReportData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/games', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as GameReportData;
      setData(res);
    } catch {
      message.error('Failed to load game report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !data) return <PageLoader cards={4} />;

  const columns = [
    { title: 'Game', dataIndex: 'gameName', key: 'gameName', width: 150 },
    {
      title: 'Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Rounds',
      dataIndex: 'totalRounds',
      key: 'totalRounds',
      width: 90,
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 90,
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Total Bets',
      dataIndex: 'totalBets',
      key: 'totalBets',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Avg Bet / Round',
      dataIndex: 'avgBetPerRound',
      key: 'avgBetPerRound',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net Revenue',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="auto" />,
    },
    {
      title: 'House Edge %',
      dataIndex: 'houseEdge',
      key: 'houseEdge',
      width: 120,
      render: (v: number) => (
        <span className={v >= 0 ? 'profit-positive' : 'profit-negative'}>
          {formatPercent(v)}
        </span>
      ),
    },
    {
      title: 'High Payout Rounds',
      dataIndex: 'highPayoutRounds',
      key: 'highPayoutRounds',
      width: 140,
      render: (v: number) =>
        v > 0 ? <Tag color="volcano">{v}</Tag> : <Tag color="green">0</Tag>,
    },
  ];

  const exportCsv = () => {
    if (!data) return;
    const header = [
      'Game',
      'Type',
      'Rounds',
      'Orders',
      'Total Bets',
      'Avg Bet/Round',
      'Total Payouts',
      'Net Revenue',
      'House Edge %',
      'High Payout Rounds',
    ];
    const rows = data.games.map((g) => [
      g.gameName,
      g.gameType,
      g.totalRounds,
      g.totalOrders,
      g.totalBets.toFixed(2),
      g.avgBetPerRound.toFixed(2),
      g.totalPayouts.toFixed(2),
      g.netRevenue.toFixed(2),
      g.houseEdge.toFixed(2),
      g.highPayoutRounds,
    ]);
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');
    downloadCsv(`game-report_${start}_${end}.csv`, header, rows);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Game Report"
        subtitle="Per-game performance breakdown"
        icon={<PieChartOutlined />}
        iconBg="var(--gradient-purple)"
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
              disabled={!data || data.games.length === 0}
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
                title="Active Games"
                value={data.summary.totalGames}
                icon={<TrophyOutlined />}
                color="green"
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
                title="Total Rounds"
                value={data.summary.totalRounds}
                icon={<TrophyOutlined />}
                color="blue"
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
                title="Total Bets"
                value={data.summary.totalBets}
                icon={<TrophyOutlined />}
                color="indigo"
                prefix={CURRENCY_SYMBOL}
                precision={2}
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
                title="Total Payouts"
                value={data.summary.totalPayouts}
                icon={<TrophyOutlined />}
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
                title="Margin"
                value={data.summary.overallMargin}
                icon={<TrophyOutlined />}
                color="purple"
                suffix="%"
                precision={2}
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              lg={14}
              className="animate-fade-in-up stagger-6"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Revenue by Game" height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.games}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-light)"
                    />
                    <XAxis
                      dataKey="gameName"
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
                      dataKey="totalBets"
                      name="Bets"
                      fill={themeColor.indigo()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="netRevenue"
                      name="Net Revenue"
                      fill={themeColor.success()}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col
              xs={24}
              lg={10}
              className="animate-fade-in-up stagger-7"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Bet Distribution" height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.games.map((g) => ({
                        name: g.gameName,
                        value: g.totalBets,
                      }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent == null
                          ? ''
                          : `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{
                        stroke: 'var(--text-muted)',
                        strokeWidth: 1,
                      }}
                    >
                      {data.games.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number | string) => formatMoney(v)}
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

          <ChartCard title="Detailed Game Stats">
            <Table<GameRow>
              rowKey="gameId"
              columns={columns}
              dataSource={data.games}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 1200 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default GameReportPage;

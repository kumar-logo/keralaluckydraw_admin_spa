import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Row, Col, Space, DatePicker, message } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, DollarOutlined, TrophyOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import ChartCard from '../../../components/ChartCard';
import { fmtMoney, type TopPlayerRow, type DiceGameDetail, type DailyStatRow } from './diceShared';

const { RangePicker } = DatePicker;

const ReportsTab = ({ detail }: { detail: DiceGameDetail }) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<DailyStatRow[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayerRow[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats;

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.post<
        unknown,
        { daily?: DailyStatRow[]; topPlayers?: TopPlayerRow[] }
      >(`games/${detail.id}/stats`, {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });
      setDaily(Array.isArray(res.daily) ? res.daily : []);
      setTopPlayers(Array.isArray(res.topPlayers) ? res.topPlayers : []);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  }, [detail.id, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const dailyColumns: ColumnsType<DailyStatRow> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 120,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: 'Net',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 120,
      render: (v: number) => (
        <span className={v >= 0 ? 'amount-positive' : 'amount-negative'}>
          {fmtMoney(v)}
        </span>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 90,
    },
    {
      title: 'Players',
      dataIndex: 'playerCount',
      key: 'playerCount',
      width: 90,
    },
  ];

  const topColumns: ColumnsType<TopPlayerRow> = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 130 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 120,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 120,
      render: (v: number) => <span className="amount-positive">{fmtMoney(v)}</span>,
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Total Rounds"
            value={stats.totalRounds}
            icon={<PlayCircleOutlined />}
            color="blue"
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Completed"
            value={stats.completedRounds}
            icon={<CheckCircleOutlined />}
            color="green"
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Total Bet"
            value={stats.totalBet}
            icon={<DollarOutlined />}
            color="orange"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Payout"
            value={stats.totalPayout}
            icon={<DollarOutlined />}
            color="red"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Net Revenue"
            value={stats.netRevenue}
            icon={<TrophyOutlined />}
            color="purple"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Players"
            value={stats.uniquePlayers}
            icon={<TeamOutlined />}
            color="cyan"
          />
        </Col>
      </Row>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(d) => {
              if (d && d[0] && d[1]) setDateRange([d[0], d[1]]);
            }}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchStats}
            loading={statsLoading}
          >
            Generate
          </Button>
        </Space>
      </div>

      {daily.length > 0 && (
        <ChartCard title="Daily Performance">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalBet"
                name="Total Bet"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalPayout"
                name="Payout"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Revenue"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <ChartCard title="Daily Breakdown">
            <Table
              columns={dailyColumns}
              dataSource={daily}
              rowKey="date"
              loading={statsLoading}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 700 }}
            />
          </ChartCard>
        </Col>
        <Col xs={24} lg={10}>
          <ChartCard title="Top Players">
            <Table
              columns={topColumns}
              dataSource={topPlayers}
              rowKey="userId"
              loading={statsLoading}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 500 }}
            />
          </ChartCard>
        </Col>
      </Row>
    </>
  );
};

export default ReportsTab;

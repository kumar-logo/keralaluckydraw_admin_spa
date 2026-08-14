import { useCallback, useEffect, useState } from 'react';
import { Button, Col, DatePicker, Row, Space, Table, Tag, message } from 'antd';
import { CheckCircleOutlined, DollarOutlined, PlayCircleOutlined, ReloadOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import ChartCard from '../../../components/ChartCard';
import { themeColor } from '../../../theme';
import { formatNumber } from '../../../utils/format';
import { num, type StatsResponse, type TopPlayerRow, type GameDetail, type DailyRow } from './dubaiShared';

const { RangePicker } = DatePicker;

const ReportsTab = ({
  detail,
  gameId,
}: {
  detail: GameDetail;
  gameId: number;
}) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayerRow[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats;

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = (await api.post(`games/${gameId}/stats`, {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as StatsResponse;
      setDaily(Array.isArray(res.daily) ? res.daily : []);
      setTopPlayers(Array.isArray(res.topPlayers) ? res.topPlayers : []);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  }, [gameId, dateRange]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const dailyColumns: ColumnsType<DailyRow> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 120,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{num(v).toFixed(2)}</span>
      ),
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 120,
      render: (v: number) => num(v).toFixed(2),
    },
    {
      title: 'Net',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 120,
      render: (v: number) => (
        <span className={num(v) >= 0 ? 'amount-positive' : 'amount-negative'}>
          {num(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 90,
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Players',
      dataIndex: 'playerCount',
      key: 'playerCount',
      width: 90,
      render: (v: number) => formatNumber(v),
    },
  ];
  const topColumns: ColumnsType<TopPlayerRow> = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 130 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 120,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{num(v).toFixed(2)}</span>
      ),
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 120,
      render: (v: number) => (
        <span className="amount-positive">{num(v).toFixed(2)}</span>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 100,
      render: (v: number) => (
        <Tag color={num(v) > 50 ? 'green' : 'default'}>
          {num(v).toFixed(2)}%
        </Tag>
      ),
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
            title="Completed Rounds"
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
            title="Total Payout"
            value={stats.totalPayout}
            icon={<DollarOutlined />}
            color="red"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Net Revenue (P&L)"
            value={stats.netRevenue}
            icon={<ThunderboltOutlined />}
            color="purple"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Unique Players"
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
        <ChartCard title="Daily Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="dubBet" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={themeColor.indigo()}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={themeColor.indigo()}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="dubPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={themeColor.danger()}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={themeColor.danger()}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="dubRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={themeColor.success()}
                    stopOpacity={0.3}
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
                stroke="var(--border-default)"
              />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RTooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalBet"
                name="Total Bet"
                stroke={themeColor.indigo()}
                fill="url(#dubBet)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalPayout"
                name="Payout"
                stroke={themeColor.danger()}
                fill="url(#dubPayout)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Net Revenue"
                stroke={themeColor.success()}
                fill="url(#dubRevenue)"
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
          <ChartCard title="Top Players Report">
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

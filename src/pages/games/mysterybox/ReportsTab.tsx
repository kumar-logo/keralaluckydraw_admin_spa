import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Space, Statistic, Table, Tag, message } from 'antd';
import { BarChartOutlined, DollarOutlined, PlayCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import ChartCard from '../../../components/ChartCard';
import MoneyText from '../../../components/MoneyText';
import { num, type BoxDetail, type TopPlayerRow, type DailyRow } from './mysteryBoxShared';

const { RangePicker } = DatePicker;

const ReportsTab = ({
  detail,
  gameId,
}: {
  detail: BoxDetail;
  gameId: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayerRow[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.post(`games/${gameId}/stats`, {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as { daily?: DailyRow[]; topPlayers?: TopPlayerRow[] };
      setDaily(Array.isArray(res.daily) ? res.daily : []);
      setTopPlayers(Array.isArray(res.topPlayers) ? res.topPlayers : []);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load stats'));
    } finally {
      setLoading(false);
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
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="auto" />,
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
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 100,
      render: (v: number) => (
        <Tag color={num(v) > 50 ? 'green' : 'default'}>{num(v).toFixed(2)}%</Tag>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
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
            icon={<BarChartOutlined />}
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
            icon={<ThunderboltOutlined />}
            color="purple"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Players"
            value={stats.uniquePlayers}
            icon={<BarChartOutlined />}
            color="cyan"
          />
        </Col>
      </Row>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(d) => {
              if (d) setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]);
            }}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchStats}
            loading={loading}
          >
            Generate
          </Button>
        </Space>
      </div>

      {daily.length > 0 && (
        <ChartCard title="Daily Performance">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
              />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RTooltip />
              <Area
                type="monotone"
                dataKey="totalBet"
                name="Total Bet"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Net Revenue"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card>
            <Statistic
              title="Net Revenue (lifetime)"
              value={stats.netRevenue}
              precision={2}
              prefix="₹"
              valueStyle={{
                color: stats.netRevenue >= 0 ? '#10b981' : '#ef4444',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <ChartCard title="Daily Breakdown">
            <Table
              columns={dailyColumns}
              dataSource={daily}
              rowKey="date"
              loading={loading}
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
              loading={loading}
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

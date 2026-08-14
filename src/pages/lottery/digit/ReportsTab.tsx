import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from 'recharts';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { toList } from '../../../services/listResponse';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import ChartCard from '../../../components/ChartCard';
import { themeColor } from '../../../theme';
import { formatDateTime } from '../../../utils/format';
import {
  num,
  type DigitGameDetail,
} from './digitShared';

const { RangePicker } = DatePicker;

const ReportsTab = ({ detail }: { detail: DigitGameDetail }) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<Record<string, unknown>[]>([]);
  const [topPlayers, setTopPlayers] = useState<Record<string, unknown>[]>([]);
  const [decisions, setDecisions] = useState<Record<string, unknown>[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats;

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = (await api.post(`games/${detail.id}/stats`, {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as { daily?: unknown[]; topPlayers?: unknown[] };
      setDaily(
        Array.isArray(res.daily)
          ? (res.daily as Record<string, unknown>[])
          : [],
      );
      setTopPlayers(
        Array.isArray(res.topPlayers)
          ? (res.topPlayers as Record<string, unknown>[])
          : [],
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  }, [detail.id, dateRange]);

  const fetchDecisions = useCallback(async () => {
    setDecisionsLoading(true);
    try {
      const res = (await api.post('result-decisions', {
        gameId: detail.id,
        pageNo: 1,
        pageSize: 50,
      })) as { list?: unknown[] };
      setDecisions(toList(res) as Record<string, unknown>[]);
    } catch {
    } finally {
      setDecisionsLoading(false);
    }
  }, [detail.id]);

  useEffect(() => {
    fetchStats();
    fetchDecisions();
  }, [fetchStats, fetchDecisions]);

  const dailyColumns: ColumnsType<Record<string, unknown>> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 110,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{num(v).toFixed(2)}</span>
      ),
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 110,
      render: (v: number) => num(v).toFixed(2),
    },
    {
      title: 'Net Revenue',
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
    },
    {
      title: 'Players',
      dataIndex: 'playerCount',
      key: 'playerCount',
      width: 90,
    },
  ];

  const topColumns: ColumnsType<Record<string, unknown>> = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 130 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 110,
      render: (v: number) => num(v).toFixed(2),
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 110,
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

  const decisionColumns: ColumnsType<Record<string, unknown>> = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: 110,
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    { title: 'Decided By', dataIndex: 'decidedBy', key: 'decidedBy', width: 120 },
    {
      title: 'Candidates Evaluated',
      dataIndex: 'candidatesEvaluated',
      key: 'candidatesEvaluated',
      width: 160,
    },
    {
      title: 'Profit / Loss',
      dataIndex: 'profitLoss',
      key: 'profitLoss',
      width: 120,
      render: (v: number) => (
        <span className={num(v) >= 0 ? 'amount-positive' : 'amount-negative'}>
          {num(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
  ];

  const netRevenue = stats.totalBet - stats.totalPayout;

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
            title="Total Bet Volume"
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
            value={netRevenue}
            icon={<ThunderboltOutlined />}
            color="purple"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Unique Players"
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
              />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalBet"
                name="Total Bet"
                stroke={themeColor.indigo()}
                fill={themeColor.indigo()}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalPayout"
                name="Payout"
                stroke={themeColor.danger()}
                fill={themeColor.danger()}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Net Revenue"
                stroke={themeColor.success()}
                fill={themeColor.success()}
                fillOpacity={0.1}
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
              scroll={{ x: 640 }}
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
              scroll={{ x: 460 }}
            />
          </ChartCard>
        </Col>
      </Row>

      <Card
        title={
          <>
            <ProfileOutlined /> Decision Log (Biased Modes)
          </>
        }
        style={{ borderRadius: 12, marginTop: 16 }}
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchDecisions}
          >
            Refresh
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={decisionColumns}
          dataSource={decisions}
          loading={decisionsLoading}
          pagination={{ pageSize: 10 }}
          size="small"
          className="modern-table"
          scroll={{ x: 820 }}
          locale={{
            emptyText: (
              <Empty description="No biased-result decisions recorded" />
            ),
          }}
        />
      </Card>
    </>
  );
};

export default ReportsTab;

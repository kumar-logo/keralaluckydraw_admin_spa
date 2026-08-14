import { useEffect, useState } from 'react';
import { Descriptions, Table, Tag, Button, DatePicker, Space, Row, Col, message } from 'antd';
import { ReloadOutlined, TeamOutlined, DollarOutlined, PlayCircleOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import StatsCard from '../../components/StatsCard';
import ChartCard from '../../components/ChartCard';
import MoneyText from '../../components/MoneyText';
import { typeName } from '../../utils/gameTypes';
import { themeColor } from '../../theme';
import { formatDateTimeShort, formatPercent, formatNumber } from '../../utils/format';
import { fmtDuration, type StatsResponse, type TopPlayer, type DailyStat, type GameDetail } from './gameShared';

const { RangePicker } = DatePicker;

const OverviewTab = ({
  detail,
  gameId,
}: {
  detail: GameDetail;
  gameId: number;
}) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats;

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = (await api.post(`games/${gameId}/stats`, {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as StatsResponse;
      setDaily(Array.isArray(res.daily) ? res.daily : []);
      setTopPlayers(Array.isArray(res.topPlayers) ? res.topPlayers : []);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  };
  useEffect(() => {
    fetchStats();
  }, []);

  const dailyColumns: ColumnsType<DailyStat> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 130,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 130,
      render: (v) => <MoneyText value={v} variant="auto" />,
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 90,
      render: (v?: number) => formatNumber(v),
    },
    {
      title: 'Players',
      dataIndex: 'playerCount',
      key: 'playerCount',
      width: 90,
      render: (v?: number) => formatNumber(v),
    },
  ];
  const topColumns: ColumnsType<TopPlayer> = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 130 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 130,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Total Win',
      dataIndex: 'totalWin',
      key: 'totalWin',
      width: 130,
      render: (v) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 110,
      render: (v?: number) => (
        <Tag color={(v ?? 0) > 50 ? 'green' : 'default'}>
          {formatPercent(v)}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Game Type">
          <Tag>{typeName(detail.gameType)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Code">{detail.gameCode}</Descriptions.Item>
        <Descriptions.Item label="Status">
          {detail.status === 1 ? (
            <span className="status-badge active">Active</span>
          ) : (
            <span className="status-badge inactive">Disabled</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Paused">
          {detail.isPaused === 1 ? (
            <Tag color="orange">Yes</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Hidden">
          {detail.isHidden === 1 ? <Tag>Yes</Tag> : <Tag color="green">No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Draw Interval">
          {fmtDuration(detail.drawInterval)}
        </Descriptions.Item>
        <Descriptions.Item label="Min Bet">
          <MoneyText value={detail.minBet} variant="neutral" />
        </Descriptions.Item>
        <Descriptions.Item label="Max Bet">
          <MoneyText value={detail.maxBet} variant="neutral" />
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTimeShort(detail.createdAt)}
        </Descriptions.Item>
      </Descriptions>

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
            icon={<ThunderboltOutlined />}
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
              <defs>
                <linearGradient id="gdBet" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="gdPayout" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="gdRevenue" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#gdBet)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalPayout"
                name="Payout"
                stroke={themeColor.danger()}
                fill="url(#gdPayout)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Revenue"
                stroke={themeColor.success()}
                fill="url(#gdRevenue)"
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

export default OverviewTab;

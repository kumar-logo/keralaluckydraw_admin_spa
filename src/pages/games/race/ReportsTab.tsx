import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Row, Col, Table, Tag, Empty, DatePicker, Statistic, message } from 'antd';
import { ReloadOutlined, TrophyOutlined, DollarOutlined, AimOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import MoneyText from '../../../components/MoneyText';
import { num, EMPTY_RACE_STATS, type RaceGameDetail, type TopPlayerRow, type DailyRow } from './raceShared';

const ReportsTab = ({
  detail,
  gameId,
}: {
  detail: RaceGameDetail;
  gameId: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayerRow[]>([]);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const stats = detail.stats ?? EMPTY_RACE_STATS;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.post(`games/${gameId}/stats`, {
        startDate: range[0].format('YYYY-MM-DD'),
        endDate: range[1].format('YYYY-MM-DD'),
      })) as { daily?: DailyRow[]; topPlayers?: TopPlayerRow[] };
      setDaily(Array.isArray(res.daily) ? res.daily : []);
      setTopPlayers(Array.isArray(res.topPlayers) ? res.topPlayers : []);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load stats'));
    } finally {
      setLoading(false);
    }
  }, [gameId, range]);
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
      title: 'Total Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net Revenue',
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
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Total Rounds"
            value={stats.totalRounds}
            icon={<AimOutlined />}
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
            title="Net Revenue"
            value={stats.netRevenue}
            icon={<TrophyOutlined />}
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

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <DatePicker.RangePicker
          value={range}
          onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
        />
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchStats}
          loading={loading}
        >
          Generate
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="P&L Report (Daily)"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={dailyColumns}
              dataSource={daily}
              rowKey="date"
              loading={loading}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 660 }}
              locale={{ emptyText: <Empty description="No data" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Top Players (by bet volume)"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={topColumns}
              dataSource={topPlayers}
              rowKey="userId"
              loading={loading}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 470 }}
              locale={{ emptyText: <Empty description="No data" /> }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic title="Total Rounds" value={stats.totalRounds} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Completed Rounds"
              value={stats.completedRounds}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Net Revenue"
              value={stats.netRevenue}
              precision={2}
              prefix="₹"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Unique Players"
              value={stats.uniquePlayers}
            />
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default ReportsTab;

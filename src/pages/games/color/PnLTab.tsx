import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Space, Table, Tag, message } from 'antd';
import { BarChartOutlined, DollarOutlined, PlayCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import MoneyText from '../../../components/MoneyText';
import { formatNumber } from '../../../utils/format';
import { type ColorGameDetail, type StatsResponse } from './colorShared';

const PnLTab = ({
  detail,
  gameId,
}: {
  detail: ColorGameDetail;
  gameId: number;
}) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<NonNullable<StatsResponse['daily']>>([]);
  const [topPlayers, setTopPlayers] = useState<
    NonNullable<StatsResponse['topPlayers']>
  >([]);
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
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  }, [gameId, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const dailyColumns: ColumnsType<NonNullable<StatsResponse['daily']>[number]> =
    [
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

  const topColumns: ColumnsType<
    NonNullable<StatsResponse['topPlayers']>[number]
  > = [
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
      render: (v?: number) => (
        <Tag color={(v ?? 0) > 50 ? 'green' : 'default'}>
          {Number(v ?? 0).toFixed(2)}%
        </Tag>
      ),
    },
  ];

  const netRevenue =
    stats.totalBet - stats.totalPayout;

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
            icon={<ThunderboltOutlined />}
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
            value={stats?.netRevenue ?? netRevenue}
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
          <DatePicker.RangePicker
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Daily Breakdown" style={{ borderRadius: 12 }}>
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
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top Players" style={{ borderRadius: 12 }}>
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
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PnLTab;

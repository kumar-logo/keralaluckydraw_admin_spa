import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, DatePicker, Empty, Row, Space, Table, message } from 'antd';
import { CheckCircleOutlined, DollarOutlined, PlayCircleOutlined, ReloadOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatsCard from '../../../components/StatsCard';
import MoneyText from '../../../components/MoneyText';
import { formatNumber } from '../../../utils/format';
import { type DailyStatRow, type StatsResponse, type CashRainDetail } from './cashRainShared';

const ReportsTab = ({ detail }: { detail: CashRainDetail }) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [daily, setDaily] = useState<DailyStatRow[]>([]);
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
      })) as StatsResponse;
      setDaily(Array.isArray(res.daily) ? res.daily : []);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load stats'));
    } finally {
      setStatsLoading(false);
    }
  }, [detail.id, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const columns: ColumnsType<DailyStatRow> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 140,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 140,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Net',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 140,
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

      <Card title="Daily Breakdown" style={{ borderRadius: 12 }}>
        <Table<DailyStatRow>
          columns={columns}
          dataSource={daily}
          rowKey="date"
          loading={statsLoading}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 700 }}
          locale={{ emptyText: <Empty description="No data" /> }}
        />
      </Card>
    </>
  );
};

export default ReportsTab;

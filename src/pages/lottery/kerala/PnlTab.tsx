import { useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Space, Statistic, message } from 'antd';
import { CrownOutlined, DollarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../../services/api';
import StatsCard from '../../../components/StatsCard';
import { cardStyle, EMPTY_GAME_STATS, type GameDetail, type PnlResponse } from './keralaShared';

const PnlTab = ({ detail }: { detail: GameDetail }) => {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PnlResponse | null>(null);
  const stats = detail.stats ?? EMPTY_GAME_STATS;

  const generate = async () => {
    setLoading(true);
    try {
      const res = (await api.post(`lottery/${detail.id}/stats`, {
        startDate: range[0].format('YYYY-MM-DD'),
        endDate: range[1].format('YYYY-MM-DD'),
      })) as PnlResponse;
      setData(res);
    } catch {
      message.error('Failed to load P&L');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Total Rounds"
            value={stats.totalRounds}
            icon={<ThunderboltOutlined />}
            color="blue"
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Completed Rounds"
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
            value={stats.netRevenue}
            icon={<DollarOutlined />}
            color="purple"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard
            title="Unique Players"
            value={stats.uniquePlayers}
            icon={<CrownOutlined />}
            color="cyan"
          />
        </Col>
      </Row>

      <Card style={cardStyle}>
        <Space style={{ marginBottom: 16 }} wrap>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
          />
          <Button type="primary" onClick={generate} loading={loading}>
            Generate
          </Button>
        </Space>
        {data?.summary && (
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Bet"
                  value={data.summary.totalBet}
                  precision={2}
                  prefix="₹"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Payout"
                  value={data.summary.totalPayout}
                  precision={2}
                  prefix="₹"
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Profit"
                  value={data.summary.profit}
                  precision={2}
                  prefix="₹"
                  valueStyle={{
                    color: data.summary.profit >= 0 ? '#10b981' : '#ef4444',
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Margin"
                  value={data.summary.margin}
                  suffix="%"
                  valueStyle={{
                    color: data.summary.margin >= 0 ? '#10b981' : '#ef4444',
                  }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
};

export default PnlTab;

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row, Space, Tabs, message } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, CheckCircleOutlined, CloudOutlined, DollarOutlined, EyeInvisibleOutlined, EyeOutlined, OrderedListOutlined, PauseCircleOutlined, PlayCircleOutlined, ProfileOutlined, ReloadOutlined, SettingOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatsCard from '../../components/StatsCard';
import { type CashRainDetail } from './cashrain/cashRainShared';
import BasicTab from './cashrain/BasicTab';
import ConfigTab from './cashrain/ConfigTab';
import ResultTab from './cashrain/ResultTab';
import OrdersTab from './cashrain/OrdersTab';
import RulesTab from './cashrain/RulesTab';
import ReportsTab from './cashrain/ReportsTab';

const CashRainDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CashRainDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/detail`)) as CashRainDetail;
      setDetail(res);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load game'));
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const control = useCallback(
    async (action: string) => {
      try {
        await api.post(`games/${gameId}/${action}`);
        message.success(`${action} done`);
        fetchDetail();
      } catch (e) {
        message.error(getApiErrorMessage(e, 'Failed'));
      }
    },
    [gameId, fetchDetail],
  );

  if (loading || !detail) return <PageLoader cards={4} />;

  const stats = detail.stats;

  const tabs = [
    {
      key: 'basic',
      label: (
        <span>
          <ProfileOutlined /> Basic
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
          <BasicTab detail={detail} control={control} />
        </>
      ),
    },
    {
      key: 'config',
      label: (
        <span>
          <SettingOutlined /> Config
        </span>
      ),
      children: <ConfigTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'orders',
      label: (
        <span>
          <OrderedListOutlined /> Orders
        </span>
      ),
      children: <OrdersTab detail={detail} />,
    },
    {
      key: 'result',
      label: (
        <span>
          <ThunderboltOutlined /> Rounds
        </span>
      ),
      children: <ResultTab detail={detail} />,
    },
    {
      key: 'rules',
      label: (
        <span>
          <ProfileOutlined /> Rules
        </span>
      ),
      children: <RulesTab gameId={gameId} />,
    },
    {
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined /> Reports
        </span>
      ),
      children: <ReportsTab detail={detail} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`Cash Rain (Bonus) · ${detail.gameCode}`}
        icon={<CloudOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            {detail.isPaused === 1 ? (
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => control('resume')}
              >
                Resume
              </Button>
            ) : (
              <Button
                icon={<PauseCircleOutlined />}
                onClick={() => control('pause')}
              >
                Pause
              </Button>
            )}
            {detail.isHidden === 1 ? (
              <Button icon={<EyeOutlined />} onClick={() => control('show')}>
                Show
              </Button>
            ) : (
              <Button
                icon={<EyeInvisibleOutlined />}
                onClick={() => control('hide')}
              >
                Hide
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
              Refresh
            </Button>
          </Space>
        }
      />
      <Tabs activeKey={tab} onChange={setTab} items={tabs} destroyOnHidden />
    </div>
  );
};

export default CashRainDetailPage;

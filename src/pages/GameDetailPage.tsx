import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, message, Tabs } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, DollarOutlined, PlayCircleOutlined, ThunderboltOutlined, SettingOutlined, HistoryOutlined, PercentageOutlined, ClockCircleOutlined, EyeOutlined, PauseCircleOutlined, EyeInvisibleOutlined, ProfileOutlined } from '@ant-design/icons';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { typeName } from '../utils/gameTypes';
import { usesOdds, type GameDetail } from './game/gameShared';
import RoundsTab from './game/RoundsTab';
import OddsTab from './game/OddsTab';
import ScheduleTab from './game/ScheduleTab';
import FeesTab from './game/FeesTab';
import ConfigTab from './game/ConfigTab';
import RulesTab from './game/RulesTab';
import ResultEngineTab from './game/ResultEngineTab';
import OverviewTab from './game/OverviewTab';
import CashRainWindowsTab from './game/CashRainWindowsTab';

const GameDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [tab, setTab] = useState('overview');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/detail`)) as GameDetail;
      setDetail(res);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load game'));
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const control = async (action: string) => {
    try {
      await api.post(`games/${gameId}/${action}`);
      message.success(`${action} done`);
      fetchDetail();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed'));
    }
  };

  if (loading || !detail) return <PageLoader cards={6} />;

  const tabs = [
    {
      key: 'overview',
      label: (
        <span>
          <BarChartOutlined /> Overview
        </span>
      ),
      children: <OverviewTab detail={detail} gameId={gameId} />,
    },
    {
      key: 'rounds',
      label: (
        <span>
          <HistoryOutlined /> Rounds
        </span>
      ),
      children: <RoundsTab gameId={gameId} gameType={detail.gameType} />,
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
      key: 'rules',
      label: (
        <span>
          <ProfileOutlined /> Rules
        </span>
      ),
      children: <RulesTab detail={detail} />,
    },
    ...(usesOdds(detail.gameType)
      ? [
          {
            key: 'odds',
            label: (
              <span>
                <PercentageOutlined /> Odds
              </span>
            ),
            children: <OddsTab gameId={gameId} gameType={detail.gameType} />,
          },
        ]
      : []),
    {
      key: 'schedule',
      label: (
        <span>
          <ClockCircleOutlined /> Schedule
        </span>
      ),
      children: <ScheduleTab gameId={gameId} reload={fetchDetail} />,
    },
    ...(detail.gameType === 'cash_rain'
      ? [
          {
            key: 'windows',
            label: (
              <span>
                <ClockCircleOutlined /> Active Windows
              </span>
            ),
            children: <CashRainWindowsTab gameId={gameId} />,
          },
        ]
      : []),
    {
      key: 'fees',
      label: (
        <span>
          <DollarOutlined /> Fees
        </span>
      ),
      children: <FeesTab gameId={gameId} />,
    },
    {
      key: 'engine',
      label: (
        <span>
          <ThunderboltOutlined /> Result Engine
        </span>
      ),
      children: <ResultEngineTab detail={detail} reload={fetchDetail} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`${typeName(detail.gameType)} · ${detail.gameCode}`}
        icon={<BarChartOutlined />}
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
          </Space>
        }
      />
      <Tabs activeKey={tab} onChange={setTab} items={tabs} destroyOnHidden />
    </div>
  );
};

export default GameDetailPage;

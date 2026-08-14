import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, ThunderboltOutlined, SettingOutlined, DollarOutlined, BarChartOutlined, PercentageOutlined, ProfileOutlined, BgColorsOutlined, FlagOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { type RaceGameDetail } from './race/raceShared';
import BasicTab from './race/BasicTab';
import ConfigTab from './race/ConfigTab';
import OddsTab from './race/OddsTab';
import FeesTab from './race/FeesTab';
import ResultDrawTab from './race/ResultDrawTab';
import RulesTab from './race/RulesTab';
import UiTab from './race/UiTab';
import ReportsTab from './race/ReportsTab';

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RaceGameDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(
        `games/${gameId}/detail`,
      )) as RaceGameDetail;
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

  const control = async (action: string) => {
    try {
      await api.post(`games/${gameId}/${action}`);
      message.success(`${action} done`);
      fetchDetail();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Action failed'));
    }
  };

  if (loading || !detail) return <PageLoader cards={6} />;

  const tabs = [
    {
      key: 'basic',
      label: (
        <span>
          <ProfileOutlined /> Basic
        </span>
      ),
      children: (
        <BasicTab detail={detail} reload={fetchDetail} control={control} />
      ),
    },
    {
      key: 'config',
      label: (
        <span>
          <SettingOutlined /> Config / Settings
        </span>
      ),
      children: <ConfigTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'odds',
      label: (
        <span>
          <PercentageOutlined /> Odds
        </span>
      ),
      children: <OddsTab gameId={gameId} gameType={detail.gameType} />,
    },
    {
      key: 'fees',
      label: (
        <span>
          <DollarOutlined /> Fees
        </span>
      ),
      children: <FeesTab gameId={gameId} gameType={detail.gameType} />,
    },
    {
      key: 'result',
      label: (
        <span>
          <ThunderboltOutlined /> Result & Draw
        </span>
      ),
      children: <ResultDrawTab detail={detail} reload={fetchDetail} />,
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
      key: 'ui',
      label: (
        <span>
          <BgColorsOutlined /> UI / Colours
        </span>
      ),
      children: <UiTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined /> P&L / Reports
        </span>
      ),
      children: <ReportsTab detail={detail} gameId={gameId} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`Race · ${detail.gameCode}`}
        icon={<FlagOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
              Refresh
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
          </Space>
        }
      />
      <Tabs activeKey={tab} onChange={setTab} items={tabs} destroyOnHidden />
    </div>
  );
};

export default RaceDetailPage;

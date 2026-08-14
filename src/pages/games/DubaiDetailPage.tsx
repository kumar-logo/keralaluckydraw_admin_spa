import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Space, Tabs, message } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, BarChartOutlined, BgColorsOutlined, ClockCircleOutlined, DollarOutlined, EyeInvisibleOutlined, EyeOutlined, PauseCircleOutlined, PercentageOutlined, PlayCircleOutlined, ProfileOutlined, ReloadOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { typeName } from '../../utils/gameTypes';
import { type GameDetail } from './dubai/dubaiShared';
import BasicTab from './dubai/BasicTab';
import ConfigTab from './dubai/ConfigTab';
import OddsTab from './dubai/OddsTab';
import FeesTab from './dubai/FeesTab';
import LimitsTab from './dubai/LimitsTab';
import ResultDrawTab from './dubai/ResultDrawTab';
import RulesTab from './dubai/RulesTab';
import UiTab from './dubai/UiTab';
import ReportsTab from './dubai/ReportsTab';

const DubaiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/detail`)) as GameDetail;
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
      message.error(getApiErrorMessage(e, 'Failed'));
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
      children: <BasicTab detail={detail} reload={fetchDetail} />,
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
      children: <OddsTab gameId={gameId} />,
    },
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
      key: 'limits',
      label: (
        <span>
          <ClockCircleOutlined /> Limits
        </span>
      ),
      children: <LimitsTab detail={detail} reload={fetchDetail} />,
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
      children: <RulesTab detail={detail} />,
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
        subtitle={`${typeName(detail.gameType)} · ${detail.gameCode} · ${detail.gameType}`}
        icon={<ApartmentOutlined />}
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

export default DubaiDetailPage;

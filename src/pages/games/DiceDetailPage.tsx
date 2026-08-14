import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined, EyeInvisibleOutlined, ThunderboltOutlined, SettingOutlined, DollarOutlined, PercentageOutlined, BgColorsOutlined, ProfileOutlined, BarChartOutlined, ExperimentOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { fmtDateTime, type DiceGameDetail } from './dice/diceShared';
import BasicTab from './dice/BasicTab';
import SettingsTab from './dice/SettingsTab';
import OddsTab from './dice/OddsTab';
import FeesTab from './dice/FeesTab';
import ResultDrawTab from './dice/ResultDrawTab';
import RulesTab from './dice/RulesTab';
import UiColoursTab from './dice/UiColoursTab';
import ReportsTab from './dice/ReportsTab';

const DiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DiceGameDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, DiceGameDetail>(`games/${gameId}/detail`);
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

  const control = async (action: 'pause' | 'resume' | 'hide' | 'show') => {
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
      key: 'settings',
      label: (
        <span>
          <SettingOutlined /> Config / Settings
        </span>
      ),
      children: <SettingsTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'odds',
      label: (
        <span>
          <PercentageOutlined /> Odds
        </span>
      ),
      children: <OddsTab detail={detail} />,
    },
    {
      key: 'fees',
      label: (
        <span>
          <DollarOutlined /> Fees
        </span>
      ),
      children: <FeesTab detail={detail} />,
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
          <ExperimentOutlined /> Rules
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
      children: <UiColoursTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined /> P&L / Reports
        </span>
      ),
      children: <ReportsTab detail={detail} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`Dice · ${detail.gameCode} · created ${fmtDateTime(detail.createdAt)}`}
        icon={<ExperimentOutlined />}
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
              <Button icon={<PlayCircleOutlined />} onClick={() => control('resume')}>
                Resume
              </Button>
            ) : (
              <Button icon={<PauseCircleOutlined />} onClick={() => control('pause')}>
                Pause
              </Button>
            )}
            {detail.isHidden === 1 ? (
              <Button icon={<EyeOutlined />} onClick={() => control('show')}>
                Show
              </Button>
            ) : (
              <Button icon={<EyeInvisibleOutlined />} onClick={() => control('hide')}>
                Hide
              </Button>
            )}
          </Space>
        }
      />
      <Tabs activeKey={tab} onChange={setTab} items={tabs} size="large" destroyOnHidden />
    </div>
  );
};

export default DiceDetailPage;

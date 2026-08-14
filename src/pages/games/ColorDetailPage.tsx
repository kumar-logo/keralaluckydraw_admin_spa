import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Space, Tabs, message } from 'antd';
import { ArrowLeftOutlined, BgColorsOutlined, BarChartOutlined, DollarOutlined, EyeInvisibleOutlined, EyeOutlined, PauseCircleOutlined, PercentageOutlined, PlayCircleOutlined, ProfileOutlined, ReloadOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { typeName } from '../../utils/gameTypes';
import { type ColorGameDetail } from './color/colorShared';
import BasicTab from './color/BasicTab';
import ColorMapTab from './color/ColorMapTab';
import OddsTab from './color/OddsTab';
import FeesTab from './color/FeesTab';
import LimitsTab from './color/LimitsTab';
import UiTab from './color/UiTab';
import RulesTab from './color/RulesTab';
import ResultDrawTab from './color/ResultDrawTab';
import PnLTab from './color/PnLTab';

const ColorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ColorGameDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(
        `games/${gameId}/detail`,
      )) as ColorGameDetail;
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

  const control = useCallback(
    async (action: string) => {
      try {
        await api.post(`games/${gameId}/${action}`);
        message.success(`${action} done`);
        fetchDetail();
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed'));
      }
    },
    [gameId, fetchDetail],
  );

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
      children: <ColorMapTab gameId={gameId} />,
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
      children: <FeesTab gameId={gameId} />,
    },
    {
      key: 'limits',
      label: (
        <span>
          <DollarOutlined /> Limits
        </span>
      ),
      children: <LimitsTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'result',
      label: (
        <span>
          <ThunderboltOutlined /> Result &amp; Draw
        </span>
      ),
      children: (
        <ResultDrawTab
          detail={detail}
          reload={fetchDetail}
          control={control}
        />
      ),
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
      key: 'pnl',
      label: (
        <span>
          <BarChartOutlined /> P&amp;L / Reports
        </span>
      ),
      children: <PnLTab detail={detail} gameId={gameId} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`${typeName(detail.gameType)} · ${detail.gameCode}`}
        icon={<BgColorsOutlined />}
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

export default ColorDetailPage;

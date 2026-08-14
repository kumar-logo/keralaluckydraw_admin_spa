import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Space, Tabs, message } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, BarChartOutlined, BgColorsOutlined, DollarOutlined, EyeInvisibleOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, ProfileOutlined, ReloadOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { type SpinDetail } from './luckyspin/luckySpinShared';
import BasicTab from './luckyspin/BasicTab';
import ConfigTab from './luckyspin/ConfigTab';
import FeesTab from './luckyspin/FeesTab';
import ResultDrawTab from './luckyspin/ResultDrawTab';
import RulesTab from './luckyspin/RulesTab';
import UiTab from './luckyspin/UiTab';
import ReportsTab from './luckyspin/ReportsTab';

const LuckySpinDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SpinDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/detail`)) as SpinDetail;
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
      key: 'fees',
      label: (
        <span>
          <DollarOutlined /> Fees
        </span>
      ),
      children: <FeesTab gameId={gameId} />,
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
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined /> P&amp;L / Reports
        </span>
      ),
      children: <ReportsTab detail={detail} gameId={gameId} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`Lucky Spin (Wheel) · ${detail.gameCode}`}
        icon={<ApartmentOutlined />}
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

export default LuckySpinDetailPage;

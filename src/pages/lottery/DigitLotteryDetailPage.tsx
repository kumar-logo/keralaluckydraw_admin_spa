import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, Tabs, Tooltip, message } from 'antd';
import {
  PercentageOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  DollarOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { typeName } from '../../utils/gameTypes';
import type { DigitGameDetail } from './digit/digitShared';
import BasicTab from './digit/BasicTab';
import ConfigTab from './digit/ConfigTab';
import FeesTab from './digit/FeesTab';
import LimitsTab from './digit/LimitsTab';
import OddsTab from './digit/OddsTab';
import ResultDrawTab from './digit/ResultDrawTab';
import RulesTab from './digit/RulesTab';
import UiColoursTab from './digit/UiColoursTab';
import ReportsTab from './digit/ReportsTab';

const DigitLotteryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = Number(id);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DigitGameDetail | null>(null);
  const [tab, setTab] = useState('basic');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/detail`)) as DigitGameDetail;
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
      key: 'basic',
      label: (
        <span>
          <ProfileOutlined /> Basic
        </span>
      ),
      children: <BasicTab detail={detail} control={control} />,
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
      key: 'limits',
      label: (
        <span>
          <DollarOutlined /> Limits
        </span>
      ),
      children: <LimitsTab detail={detail} reload={fetchDetail} />,
    },
    ...(detail.autoGenerate === 1
      ? [
          {
            key: 'odds',
            label: (
              <span>
                <PercentageOutlined /> Odds
              </span>
            ),
            children: <OddsTab detail={detail} />,
          },
        ]
      : []),
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
        subtitle={`${typeName(detail.gameType)} · ${detail.gameCode} · ${detail.digitCount ?? '?'}-Digit`}
        icon={<BarChartOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Tooltip title="Reload">
              <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
                Refresh
              </Button>
            </Tooltip>
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

export default DigitLotteryDetailPage;

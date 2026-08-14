import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Descriptions, Space, Tabs, Tag, message } from 'antd';
import { ArrowLeftOutlined, BgColorsOutlined, CalendarOutlined, CrownOutlined, DollarOutlined, ProfileOutlined, ReloadOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import PageHeader from '../../components/PageHeader';
import { formatDateTime } from '../../utils/format';
import { fmtDuration, type GameDetail } from './kerala/keralaShared';
import BasicTab from './kerala/BasicTab';
import ConfigTab from './kerala/ConfigTab';
import ScheduleTab from './kerala/ScheduleTab';
import FeesTab from './kerala/FeesTab';
import LimitsTab from './kerala/LimitsTab';
import ResultPrizeTab from './kerala/ResultPrizeTab';
import ResultDrawTab from './kerala/ResultDrawTab';
import RulesTab from './kerala/RulesTab';
import UiTab from './kerala/UiTab';
import PnlTab from './kerala/PnlTab';

const KeralaLotteryDetailPage = () => {
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

  if (loading || !detail)
    return (
      <Card style={{ borderRadius: 12, margin: 24 }} loading>
        <div style={{ height: 320 }} />
      </Card>
    );

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
      key: 'schedule',
      label: (
        <span>
          <CalendarOutlined /> Schedule
        </span>
      ),
      children: <ScheduleTab detail={detail} reload={fetchDetail} />,
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
      key: 'prize',
      label: (
        <span>
          <CrownOutlined /> Result &amp; Prize
        </span>
      ),
      children: <ResultPrizeTab detail={detail} reload={fetchDetail} />,
    },
    {
      key: 'draw',
      label: (
        <span>
          <ThunderboltOutlined /> Result &amp; Draw
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
      key: 'pnl',
      label: (
        <span>
          <DollarOutlined /> P&amp;L / Reports
        </span>
      ),
      children: <PnlTab detail={detail} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={detail.gameName}
        subtitle={`Kerala Lottery · ${detail.gameType?.toUpperCase()} · ${detail.gameCode}`}
        icon={<CrownOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/lottery/list')}
            >
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
              Refresh
            </Button>
          </Space>
        }
      />
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 4 }}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Code">{detail.gameCode}</Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag>{detail.gameType?.toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {detail.status === 1 ? (
            <span className="status-badge active">Active</span>
          ) : (
            <span className="status-badge inactive">Disabled</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Draw Interval">
          {fmtDuration(detail.drawInterval)}
        </Descriptions.Item>
        <Descriptions.Item label="Paused">
          {detail.isPaused === 1 ? (
            <Tag color="orange">Yes</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Hidden">
          {detail.isHidden === 1 ? <Tag>Yes</Tag> : <Tag color="green">No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Emergency Stop">
          {detail.emergencyStop === 1 ? (
            <Tag color="red">Yes</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
      </Descriptions>
      <Tabs activeKey={tab} onChange={setTab} items={tabs} destroyOnHidden />
    </div>
  );
};

export default KeralaLotteryDetailPage;

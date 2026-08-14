import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Spin,
  Button,
  Space,
  Tooltip,
  message,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SettingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { resolveAssetUrl } from '../utils/assetUrl';
import MoneyText from '../components/MoneyText';
import { GameResultDisplay } from '../components/ResultBall';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { typeName } from '../utils/gameTypes';
import { orDash } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';

const FALLBACK_THEME_GRADIENT = 'linear-gradient(135deg,#6366f1,#8b5cf6)';

interface LiveGame {
  id: number;
  gameName: string;
  gameCode: string;
  gameType: string;
  status: number;
  isPaused?: number;
  isHidden?: number;
  emergencyStop?: number;
  drawInterval?: number;
  bannerUrl?: string;
  thumbnailUrl?: string;
  iconUrl?: string;
  themeColor?: string;
  bgColor?: string;
  todayBetAmount?: number;
  currentRound?: { roundNo?: string; drawTime?: string } | null;
  recentResults?: { result: unknown }[];
}

const useCountdown = (target?: string | null) => {
  const [label, setLabel] = useState<{ text: string; over: boolean }>({
    text: '--:--',
    over: false,
  });
  useEffect(() => {
    if (!target) {
      setLabel({ text: '--:--', over: false });
      return;
    }
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setLabel({ text: 'Drawing…', over: true });
        return;
      }
      const h = Math.floor(diff / 3600000),
        m = Math.floor((diff % 3600000) / 60000),
        s = Math.floor((diff % 60000) / 1000);
      setLabel({
        text:
          h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        over: false,
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [target]);
  return label;
};

const VariantCard = ({
  g,
  onConfigure,
  onControl,
}: {
  g: LiveGame;
  onConfigure: () => void;
  onControl: (a: string) => void;
}) => {
  const cd = useCountdown(g.currentRound?.drawTime);
  const { get: getDigitConfig } = useDigitPositionConfig();
  const digitConfig = getDigitConfig(g.id);
  const img = g.bannerUrl || g.thumbnailUrl || g.iconUrl;
  const theme = g.themeColor || g.bgColor || FALLBACK_THEME_GRADIENT;
  const active = g.status === 1 && g.isPaused !== 1 && g.emergencyStop !== 1;

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          background: theme,
          padding: 12,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {img ? (
          <img
            src={resolveAssetUrl(img)}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: 8, objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'rgba(255,255,255,.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppstoreOutlined style={{ fontSize: 20, color: '#fff' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {g.gameName}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{g.gameCode}</div>
        </div>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: active ? '#22c55e' : '#94a3b8',
            boxShadow: active ? '0 0 6px #22c55e' : 'none',
          }}
        />
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <ClockCircleOutlined /> Next draw
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 18,
              color: cd.over ? '#f59e0b' : 'var(--primary)',
            }}
          >
            {cd.text}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Round</span>
          <span className="mono">{orDash(g.currentRound?.roundNo)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Interval</span>
          <span>{g.drawInterval ? `${g.drawInterval}s` : '—'}</span>
        </div>
        {g.recentResults && g.recentResults.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            {g.recentResults.slice(0, 4).map((r, i: number) => (
              <GameResultDisplay
                key={i}
                gameType={g.gameType}
                result={r.result}
                size={20}
                positionColors={digitConfig.colors}
                slatLabels={digitConfig.labels}
              />
            ))}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-light)',
            paddingTop: 8,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Today <MoneyText value={g.todayBetAmount} variant="neutral" />
          </span>
          <Space size={2}>
            {g.isPaused === 1 ? (
              <Tooltip title="Resume">
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onControl('resume')}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Pause">
                <Button
                  type="text"
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={() => onControl('pause')}
                />
              </Tooltip>
            )}
            {g.isHidden === 1 ? (
              <Tooltip title="Show">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onControl('show')}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Hide">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => onControl('hide')}
                />
              </Tooltip>
            )}
            <Button
              type="primary"
              size="small"
              icon={<SettingOutlined />}
              onClick={onConfigure}
            >
              Configure
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

const GameTypeDetailPage = () => {
  const { gameType = '' } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<LiveGame[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get('games/live-status')) as LiveGame[] | unknown;
      const list = Array.isArray(res) ? (res as LiveGame[]) : [];
      setVariants(list.filter((g) => g.gameType === gameType));
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData();
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleControl = async (id: number, action: string) => {
    try {
      await api.post(`games/${id}/${action}`);
      message.success(`${action} successful`);
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, `${action} failed`));
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title={typeName(gameType)}
        subtitle={`${variants.length} schedule${variants.length === 1 ? '' : 's'} • live next-round timers`}
        icon={<ClockCircleOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/games?category=our')}
            >
              Back to Games
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Refresh
            </Button>
          </Space>
        }
      />
      <Spin spinning={loading}>
        {variants.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No schedules for this game"
            style={{ padding: 48 }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {variants.map((g) => (
              <Col key={g.id} xs={24} sm={12} lg={8} xl={6}>
                <VariantCard
                  g={g}
                  onConfigure={() => navigate(`/games/${g.id}/detail`)}
                  onControl={(a) => handleControl(g.id, a)}
                />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default GameTypeDetailPage;

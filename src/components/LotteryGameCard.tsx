import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tooltip, Switch } from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { CardForType, UserGame } from './UserGameCard';
import { LotteryResult } from './LotteryResult';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { formatTime } from '../utils/format';

const ROUND_PLACEHOLDER = '---';

interface LotteryGameCardProps {
  game: {
    id: number;
    gameName: string;
    gameType: string;
    gameCode: string;
    status: number;
    isPaused: number;
    isHidden?: number;
    emergencyStop: number;
    mode: string;
    pendingManualDraw: boolean;
    pendingDraws?: {
      id: number;
      roundNo: string;
      drawTime: string;
      status: number;
    }[];
    pendingDrawCount?: number;
    closed?: boolean;
    iconUrl?: string;
    bannerUrl?: string;
    coverUrl?: string;
    thumbnailUrl?: string;
    sellingPrice?: number;
    drawInterval?: number;
    maxPrize?: string;
    themeColor?: string;
    bgColor?: string;
    groupName?: string;
    lotteryType?: string;
    currentRound: {
      id: number;
      roundNo: string;
      drawTime: string;
      status: number;
    } | null;
    lastDraw?: { roundNo: string; result: unknown; drawTime: string } | null;
    todaySales: number;
    todayPayout?: number;
    todayProfit?: number;
    todayTickets: number;
    totalBet?: number;
    totalPayout?: number;
    totalOrders?: number;
    configJson?: { maxPrize?: string } | null;
  };
  onDetail: () => void;
  onDelete?: () => void;
  onToggleMode?: (auto: boolean) => void;
  onControl?: (action: string) => void;
  onTriggerDraw?: (roundId: number) => void;
}

export const useCountdown = (targetDate: string | null) => {
  const [remaining, setRemaining] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    total: 0,
  });
  useEffect(() => {
    if (!targetDate) {
      setRemaining({ d: 0, h: 0, m: 0, s: 0, total: 0 });
      return;
    }
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        total: diff,
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return remaining;
};

export const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 3,
      overflow: 'hidden',
      minWidth: 28,
    }}
  >
    <div
      style={{
        background: '#fff',
        color: '#000',
        width: '100%',
        textAlign: 'center',
        padding: '2px 4px',
        fontWeight: 700,
        fontSize: 13,
        lineHeight: '18px',
        borderRadius: '0 0 2px 2px',
      }}
    >
      {String(value).padStart(2, '0')}
    </div>
    <div
      style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: 7,
        fontWeight: 600,
        padding: '1px 0',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  </div>
);

const toUserGame = (game: LotteryGameCardProps['game']): UserGame => {
  const countDown = game.currentRound?.drawTime
    ? Math.max(
        0,
        Math.round(
          (new Date(game.currentRound.drawTime).getTime() - Date.now()) / 1000,
        ),
      )
    : 0;
  const pendingDrawList = Array.isArray(game.pendingDraws)
    ? game.pendingDraws
    : [];
  const pendingDraws = [...pendingDrawList].sort(
    (a, b) =>
      new Date(a.drawTime).getTime() - new Date(b.drawTime).getTime(),
  );
  const roundElapsed =
    !!game.currentRound?.drawTime &&
    new Date(game.currentRound.drawTime).getTime() <= Date.now();
  const awaitingDraw = game.currentRound?.status === 1;
  const loops = Boolean(game.drawInterval && game.drawInterval > 0);
  const drawDue =
    game.pendingManualDraw ||
    awaitingDraw ||
    (roundElapsed && !loops) ||
    (!game.currentRound && pendingDraws.length > 0);
  const resolvedNextDraw =
    pendingDraws[0]?.drawTime ?? game.currentRound?.drawTime;
  const nextDrawTime = resolvedNextDraw ? resolvedNextDraw : null;
  return {
    id: game.id,
    gameName: game.gameName,
    gameType: game.gameType,
    gameCode: game.gameCode,
    status: game.status,
    isPaused: game.isPaused,
    isHidden: game.isHidden,
    emergencyStop: game.emergencyStop,
    iconUrl: game.iconUrl,
    bannerUrl: game.bannerUrl || game.coverUrl,
    thumbnailUrl: game.thumbnailUrl,
    themeColor: game.themeColor,
    bgColor: game.bgColor,
    sellingPrice: game.sellingPrice,
    drawInterval: game.drawInterval,
    countDown,
    drawDue,
    nextDrawTime,
    isManual: game.mode === 'manual',
    currentRound: game.currentRound
      ? {
          roundNo: game.currentRound.roundNo,
          drawTime: game.currentRound.drawTime,
          status: game.currentRound.status,
        }
      : null,
    configJson: {
      ...game.configJson,
      maxPrize: game.maxPrize || game.configJson?.maxPrize,
    },
  };
};

const LotteryGameCard = ({
  game,
  onDetail,
  onDelete,
  onToggleMode,
  onControl,
  onTriggerDraw,
}: LotteryGameCardProps) => {
  const navigate = useNavigate();
  const userGame = useMemo(() => toUserGame(game), [game]);
  const todayBet = game.todaySales ?? 0;
  const todayPayout = game.todayPayout ?? 0;
  const todayProfit = game.todayProfit ?? todayBet - todayPayout;
  const { get: getDigitConfig } = useDigitPositionConfig();
  const digitConfig = getDigitConfig(game.id);

  const pendingDraws = Array.isArray(game.pendingDraws)
    ? game.pendingDraws
    : [];
  const dueCount = game.pendingDrawCount ?? pendingDraws.length;
  const overlay =
    game.emergencyStop === 1
      ? { text: 'E-STOP', color: '#ef4444' }
      : game.pendingManualDraw
        ? {
            text: dueCount > 1 ? `${dueCount} DRAWS DUE` : 'AWAITING DRAW',
            color: '#d97706',
          }
        : game.isPaused === 1
          ? { text: 'PAUSED', color: '#f59e0b' }
          : game.status !== 1
            ? { text: 'DISABLED', color: '#64748b' }
            : game.closed
              ? { text: 'CLOSED', color: '#64748b' }
              : null;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        background: 'var(--bg-card, #fff)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={onDetail}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <CardForType g={userGame} index={0} />
        {overlay && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: overlay.color,
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.4,
              padding: '2px 7px',
              borderRadius: 999,
              zIndex: 5,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {overlay.text}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '8px 10px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
        }}
      >
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          NO.
          {game.currentRound?.roundNo
            ? game.currentRound.roundNo
            : ROUND_PLACEHOLDER}
        </span>
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Last</span>
          <LotteryResult
            gameType={game.gameType}
            result={game.lastDraw?.result}
            size={18}
            positionColors={digitConfig.colors}
            slatLabels={digitConfig.labels}
          />
        </span>
      </div>

      <div
        style={{
          padding: '6px 10px 0',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Today Bet</span>{' '}
          <span style={{ fontWeight: 700 }}>
            Rs.{todayBet.toFixed(2)}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Payout</span>{' '}
          <span style={{ fontWeight: 700 }}>
            Rs.{todayPayout.toFixed(2)}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Profit</span>{' '}
          <span
            style={{
              fontWeight: 700,
              color: todayProfit >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            Rs.{todayProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {pendingDraws.length > 0 && onTriggerDraw && (
        <div
          style={{
            margin: '8px 10px 0',
            padding: '6px 8px',
            background: 'rgba(217,119,6,0.10)',
            border: '1px solid rgba(217,119,6,0.35)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#b45309',
              marginBottom: 4,
            }}
          >
            {pendingDraws.length} draw{pendingDraws.length > 1 ? 's' : ''} due —
            open to enter result
          </div>
          <Space size={4} wrap>
            {pendingDraws.map((r) => (
              <Button
                key={r.id}
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => navigate(`/lottery/draws/${r.id}`)}
                style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
              >
                {formatTime(r.drawTime)}
              </Button>
            ))}
          </Space>
        </div>
      )}

      <div
        style={{
          padding: '8px 8px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={onDetail}
          >
            Detail
          </Button>
          {onDelete && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
            />
          )}
          {onControl &&
            (game.isPaused === 1 ? (
              <Tooltip title="Resume">
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onControl('resume')}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Pause">
                <Button
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={() => onControl('pause')}
                />
              </Tooltip>
            ))}
        </Space>
        {onToggleMode && (
          <Switch
            size="small"
            checked={game.mode === 'auto'}
            checkedChildren="Auto"
            unCheckedChildren="Manual"
            onChange={(checked) => onToggleMode(checked)}
          />
        )}
      </div>
    </div>
  );
};

export default LotteryGameCard;

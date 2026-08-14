import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Modal, Row, Space, Statistic, Tag, message } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { TimeBox, useCountdown } from '../components/LotteryGameCard';
import { typeName } from '../utils/gameTypes';
import { formatMoney } from '../utils/format';
import KeralaDrawPanel from './lottery/draw/KeralaDrawPanel';
import ThreeDigitDrawPanel from './lottery/draw/ThreeDigitDrawPanel';
import FourFiveDigitDrawPanel from './lottery/draw/FourFiveDigitDrawPanel';
import DubaiDrawPanel from './lottery/draw/DubaiDrawPanel';
import GenericDrawPanel from './lottery/draw/GenericDrawPanel';
import {
  DEFAULT_TICKET_LENGTH,
  DrawGameType,
  positionColorList,
  type DrawDetail,
  type DrawPanelProps,
  type GameConfig,
  type PositionColorRow,
  type PreviewData,
  type SettleResponse,
} from './lottery/draw/drawTypes';

const ROUND_STATUS_SETTLED = 2;

const FALLBACK_TICKET_LENGTH = 4;

const ticketLengthFor = (
  gameType: string,
  digitCount: number | null | undefined,
  cfg: GameConfig | null | undefined,
  sample?: string | number,
): number => {
  if (digitCount && digitCount > 0) return Number(digitCount);
  if (cfg?.ticketLength) return Number(cfg.ticketLength);
  const s = sample != null ? String(sample) : '';
  if (s && /^\d+$/.test(s)) return s.length;
  return DEFAULT_TICKET_LENGTH[gameType] ?? FALLBACK_TICKET_LENGTH;
};

const LotteryDrawPage = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const id = Number(roundId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DrawDetail | null>(null);
  const [positionColors, setPositionColors] = useState<string[]>([]);
  const [slatProducts, setSlatProducts] = useState<
    { tiers: { label: string; positions: number[] }[] }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, DrawDetail>(`lottery/draw/${id}`);
      setData(res);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load draw'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const gameId = data?.game?.id;
    if (!gameId) return;
    void api
      .get<
        unknown,
        {
          positionColors?: PositionColorRow[];
          slatProducts?: { tiers: { label: string; positions: number[] }[] }[];
        }
      >(`games/${gameId}/config`)
      .then((cfg) => {
        setPositionColors(positionColorList(cfg.positionColors));
        setSlatProducts(Array.isArray(cfg.slatProducts) ? cfg.slatProducts : []);
      })
      .catch(() => {
        setPositionColors([]);
        setSlatProducts([]);
      });
  }, [data?.game?.id]);

  const game = data?.game;
  const round = data?.round;
  const settled = round?.status === ROUND_STATUS_SETTLED;
  const resolvedGameType = round?.gameType ?? game?.gameType;
  const gameType = resolvedGameType ? resolvedGameType : '';
  const ticketLength = data
    ? ticketLengthFor(
        gameType,
        game?.digitCount,
        game?.configJson,
        round?.result?.drawResult,
      )
    : 4;
  const cd = useCountdown(round?.drawTime ? round.drawTime : null);

  const confirmSettle = useCallback(
    async (drawResult: string, prefix?: string) => {
      if (!round) return;
      if (!drawResult || drawResult.length < 1) {
        message.warning('Enter the winning result first');
        return;
      }
      let preview: PreviewData | null = null;
      try {
        preview = await api.post<unknown, PreviewData>(`draws/${id}/preview`, {
          result: { drawResult },
        });
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Could not compute the preview'));
        return;
      }
      const summary = preview;
      Modal.confirm({
        title: `Settle draw ${round.roundNo}?`,
        icon: (
          <CheckCircleOutlined
            style={{
              color:
                summary.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)',
            }}
          />
        ),
        width: 460,
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>
              Result{' '}
              <strong style={{ fontSize: 18, letterSpacing: 2 }}>
                {prefix ? `${prefix} ` : ''}
                {drawResult}
              </strong>
            </p>
            <p style={{ margin: 0 }}>
              {summary.totalWinners} winner(s) · payout{' '}
              {formatMoney(summary.totalPayout)} · stake{' '}
              {formatMoney(summary.totalStake)}
            </p>
            <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
              Profit/Loss:{' '}
              <MoneyText value={summary.profitLoss} variant="auto" showSign />
            </p>
            <p
              style={{
                marginTop: 10,
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              Winners are paid immediately and notified. This cannot be undone.
            </p>
          </div>
        ),
        okText: 'Confirm & Settle',
        okButtonProps: { danger: summary.profitLoss < 0 },
        onOk: async () => {
          try {
            const res = await api.post<unknown, SettleResponse>(
              `draws/${id}/confirm`,
              { result: { drawResult, ...(prefix ? { prefix } : {}) } },
            );
            message.success(
              `Settled — ${res.winnersNotified ? res.winnersNotified : 0} winner(s) notified`,
            );
            await load();
            navigate('/lottery/draws');
          } catch (err) {
            message.error(getApiErrorMessage(err, 'Settlement failed'));
          }
        },
      });
    },
    [id, round, load, navigate],
  );

  if (loading || !data || !round || !game) return <PageLoader cards={6} />;

  const panelProps: DrawPanelProps = {
    round,
    game,
    orders: data.orders,
    ticketCount: data.ticketCount,
    totalStake: data.totalStake,
    gameType,
    ticketLength,
    readOnly: settled,
    positionColors,
    slatProducts,
    onConfirm: confirmSettle,
  };

  const renderPanel = () => {
    switch (gameType) {
      case DrawGameType.Kerala:
        return <KeralaDrawPanel {...panelProps} prizeTiers={data.prizeTiers} />;
      case DrawGameType.ThreeDigit:
        return <ThreeDigitDrawPanel {...panelProps} />;
      case DrawGameType.FourFiveDigit:
        return <FourFiveDigitDrawPanel {...panelProps} />;
      case DrawGameType.Dubai:
        return <DubaiDrawPanel {...panelProps} />;
      default:
        return <GenericDrawPanel {...panelProps} />;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title={`Draw — ${round.roundNo}`}
        subtitle={`${game.gameName || typeName(gameType)} · ${typeName(gameType)}`}
        icon={<TrophyOutlined />}
        iconBg="var(--gradient-red)"
        extra={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/lottery/draws')}
            >
              Back to Draws
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              Refresh
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tickets"
              value={data.ticketCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Players"
              value={data.uniquePlayers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Total Stake
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              <MoneyText value={data.totalStake} variant="neutral" />
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            size="small"
            styles={{ body: { padding: 12 } }}
            style={{
              background:
                settled || cd.total <= 0
                  ? undefined
                  : 'linear-gradient(135deg,var(--danger),var(--color-rose-dark, #b91c1c))',
              borderColor: settled || cd.total <= 0 ? undefined : 'transparent',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color:
                  settled || cd.total <= 0
                    ? 'var(--text-muted)'
                    : 'rgba(255,255,255,0.9)',
                marginBottom: 6,
              }}
            >
              <ClockCircleOutlined /> {settled ? 'Status' : 'Draw in'}
            </div>
            {settled ? (
              <StatusBadge kind="round" status={round.status} />
            ) : cd.total > 0 ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {cd.d > 0 && (
                  <>
                    <TimeBox value={cd.d} label="DAY" />
                    <span style={{ color: '#fff', fontWeight: 700 }}>:</span>
                  </>
                )}
                <TimeBox value={cd.h} label="HOU" />
                <span style={{ color: '#fff', fontWeight: 700 }}>:</span>
                <TimeBox value={cd.m} label="MIN" />
                <span style={{ color: '#fff', fontWeight: 700 }}>:</span>
                <TimeBox value={cd.s} label="SEC" />
              </div>
            ) : (
              <Tag color="orange" style={{ fontSize: 13 }}>
                Draw time reached
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      {renderPanel()}
    </div>
  );
};

export default LotteryDrawPage;

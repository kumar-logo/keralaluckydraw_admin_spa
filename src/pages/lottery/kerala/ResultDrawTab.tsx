import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Divider, Empty, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { Dayjs } from 'dayjs';
import api from '../../../services/api';
import { toList } from '../../../services/listResponse';
import { getApiErrorMessage } from '../../../utils/apiError';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import { GameResultDisplay } from '../../../components/ResultBall';
import DrawDigitInput from '../draw/DrawDigitInput';
import { formatDateTime } from '../../../utils/format';
import { cardStyle, RESULT_MODE_OPTIONS, type RoundRow, type GameDetail, type ConfigResponse } from './keralaShared';

const { Text } = Typography;

const ResultDrawTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [draws, setDraws] = useState<RoundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);
  const [resultDigits, setResultDigits] = useState('');
  const [resultPrefix, setResultPrefix] = useState('');
  const [resultLen, setResultLen] = useState(6);
  const [newRoundTime, setNewRoundTime] = useState<Dayjs | null>(null);
  const [creating, setCreating] = useState(false);

  const openResultModal = async (r: RoundRow) => {
    setActiveRound(r);
    setResultDigits('');
    setResultPrefix('');
    try {
      const cfg = (await api.get(
        `games/${detail.id}/config`,
      )) as ConfigResponse;
      if (cfg.kerala?.ticketLength) setResultLen(cfg.kerala.ticketLength);
    } catch {
      message.error('Failed to load lottery config');
    }
    setResultOpen(true);
  };

  const rc = {
    resultMode: detail.resultMode || 'random',
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.post('lottery/draws', {
        gameId: detail.id,
        pageNo: 1,
        pageSize: 20,
      })) as { list?: RoundRow[] };
      setDraws(toList(res));
    } catch {
      message.error('Failed to load draws');
    } finally {
      setLoading(false);
    }
  }, [detail.id]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const saveResultConfig = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`games/${detail.id}/result-config`, { ...rc, ...patch });
      message.success('Result config updated');
      reload();
    } catch {
      message.error('Update failed');
    }
  };

  const control = async (action: string) => {
    try {
      await api.post(`games/${detail.id}/${action}`);
      message.success(`${action} successful`);
      reload();
      fetchDraws();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed'));
    }
  };

  const triggerDraw = async (roundId: number) => {
    try {
      await api.post('draws/trigger', { roundId });
      message.success('Draw triggered');
      reload();
      fetchDraws();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to trigger draw'));
    }
  };

  const cancelRound = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled and orders refunded');
      fetchDraws();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Cancel failed'));
    }
  };

  const submitResult = async () => {
    if (!activeRound) return;
    if (resultDigits.length < resultLen) {
      message.warning(`Enter all ${resultLen} digits`);
      return;
    }
    try {
      await api.post('draws/set-result', {
        roundId: activeRound.id,
        result: resultPrefix
          ? { drawResult: resultDigits, prefix: resultPrefix }
          : { drawResult: resultDigits },
      });
      message.success('Manual result set');
      setResultOpen(false);
      reload();
      fetchDraws();
    } catch {
      message.error('Failed to set result');
    }
  };

  const createRound = async () => {
    if (!newRoundTime) {
      message.warning('Select a draw time');
      return;
    }
    setCreating(true);
    try {
      await api.post(`lottery/${detail.id}/create-round`, {
        drawTime: newRoundTime.toISOString(),
      });
      message.success('New round created');
      setNewRoundTime(null);
      reload();
      fetchDraws();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to create round'));
    } finally {
      setCreating(false);
    }
  };

  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(
    rc.resultMode,
  );

  const drawColumns: ColumnsType<RoundRow> = [
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 150,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 190,
      render: (_: unknown, r: RoundRow) => (
        <GameResultDisplay gameType={detail.gameType} result={r.result} size={22} />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Manual',
      dataIndex: 'manualResult',
      key: 'manualResult',
      width: 80,
      render: (v: number) =>
        v === 1 ? <Tag color="orange">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_: unknown, r: RoundRow) => (
        <Space size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => triggerDraw(r.id)}
          >
            Draw
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openResultModal(r)}
          >
            Set Result
          </Button>
          <Popconfirm
            title="Cancel this round?"
            description="Open orders will be refunded."
            onConfirm={() => cancelRound(r.id)}
          >
            <Button type="link" size="small" danger>
              Cancel
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <>
            <ThunderboltOutlined /> Smart Result Engine
          </>
        }
        style={cardStyle}
      >
        {biased && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Biased result mode active"
            description="This game biases outcomes against players. Every draw is recorded in the Decision Log."
          />
        )}
        <Row gutter={[24, 16]} align="top">
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
              Result Mode
            </div>
            <Select
              style={{ width: '100%' }}
              value={rc.resultMode}
              onChange={(val) => saveResultConfig({ resultMode: val })}
              options={RESULT_MODE_OPTIONS}
            />
          </Col>
          <Col xs={12} md={8}>
            <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
              House Edge Target
            </div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={0.95}
              step={0.05}
              placeholder="global default"
              value={rc.houseEdgeTarget}
              onChange={(val) => saveResultConfig({ houseEdgeTarget: val })}
            />
          </Col>
          <Col xs={12} md={8}>
            <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
              Hold for Approval
            </div>
            <Switch
              checked={!!rc.holdForApproval}
              checkedChildren="On"
              unCheckedChildren="Off"
              onChange={(val) => saveResultConfig({ holdForApproval: val })}
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Space align="start">
              <Switch
                checked={!!rc.avoidBigPrize}
                onChange={(val) => saveResultConfig({ avoidBigPrize: val })}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Avoid big-prize numbers
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Never pick an outcome whose payout exceeds the house-edge
                  target.
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space align="start">
              <Switch
                checked={!!rc.avoidZeroOrder}
                onChange={(val) => saveResultConfig({ avoidZeroOrder: val })}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Prefer zero-order numbers
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Favour outcomes that no player bet on (zero winners).
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <StopOutlined /> Game Controls
          </>
        }
        style={cardStyle}
      >
        <Space wrap>
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
          {detail.emergencyStop === 1 ? (
            <Popconfirm
              title="Resume from emergency stop?"
              onConfirm={() => control('emergency-resume')}
            >
              <Button icon={<PlayCircleOutlined />}>Emergency Resume</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Emergency stop?"
              description="Cancels open rounds and refunds all pending orders."
              onConfirm={() => control('emergency-stop')}
            >
              <Button danger icon={<StopOutlined />}>
                Emergency Stop
              </Button>
            </Popconfirm>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Paused: {detail.isPaused === 1 ? 'Yes' : 'No'} | Hidden:{' '}
            {detail.isHidden === 1 ? 'Yes' : 'No'} | Emergency:{' '}
            {detail.emergencyStop === 1 ? 'Yes' : 'No'}
          </Text>
        </Space>
      </Card>

      <Card
        title={
          <>
            <PlusOutlined /> Create Round
          </>
        }
        style={cardStyle}
      >
        <Space wrap>
          <DatePicker
            showTime={{ format: 'hh:mm A', use12Hours: true }}
            format="YYYY-MM-DD hh:mm A"
            value={newRoundTime}
            onChange={setNewRoundTime}
            placeholder="Draw time"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createRound}
            loading={creating}
          >
            Create Round
          </Button>
        </Space>
      </Card>

      <Card
        title="Rounds / Draws"
        style={cardStyle}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchDraws}>
            Refresh
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={drawColumns}
          dataSource={draws}
          loading={loading}
          className="modern-table"
          pagination={false}
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description="No rounds yet" /> }}
        />
      </Card>

      <Modal
        title={`Set Manual Result${activeRound ? ` — ${activeRound.roundNo}` : ''}`}
        open={resultOpen}
        onOk={submitResult}
        onCancel={() => setResultOpen(false)}
        width={520}
      >
        <div style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 12 }}>
          Enter the {resultLen}-digit winning number. Add a series letter if the
          draw has one.
        </div>
        <DrawDigitInput
          length={resultLen}
          value={resultDigits}
          onChange={setResultDigits}
          prefix={resultPrefix}
          onPrefixChange={setResultPrefix}
          prefixLabel="Series"
          size={46}
        />
        {resultDigits.length === resultLen && (
          <div style={{ marginTop: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Preview:{' '}
            </span>
            <GameResultDisplay
              gameType="kerala"
              result={
                resultPrefix
                  ? { drawResult: resultDigits, prefix: resultPrefix }
                  : { drawResult: resultDigits }
              }
              size={30}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResultDrawTab;

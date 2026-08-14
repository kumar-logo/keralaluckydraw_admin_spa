import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Switch, Select, Input, InputNumber, Form, Card, Row, Col, Space, Modal, Popconfirm, Alert, Divider, message } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import { GameResultDisplay } from '../../../components/ResultBall';
import { formatDateTime } from '../../../utils/format';
import { DEFAULT_RESULT_MODE, RESULT_MODE_OPTIONS, DICE_DEFAULTS, DiceFaceSelector, type TabProps, type RoundRow } from './diceShared';

const ResultDrawTab = ({ detail, reload }: TabProps) => {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [resultOpen, setResultOpen] = useState(false);
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);
  const [resultForm] = Form.useForm();
  const [diceFaces, setDiceFaces] = useState<number[]>(
    Array.from({ length: DICE_DEFAULTS.diceCount }, () => 1),
  );
  const resultDrawValue = diceFaces.join(',');
  const [settingResult, setSettingResult] = useState(false);

  const setDieFace = (index: number, face: number) => {
    setDiceFaces((prev) => {
      const next = prev.slice();
      next[index] = face;
      resultForm.setFieldsValue({ drawResult: next.join(',') });
      return next;
    });
  };

  const rc = {
    resultMode: detail.resultMode ? detail.resultMode : DEFAULT_RESULT_MODE,
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };

  const loadRounds = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await api.post<
          unknown,
          { list: RoundRow[]; total: number; pageNo: number }
        >('games/rounds', { gameId: detail.id, pageNo: page, pageSize: 10 });
        setRounds(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo);
      } catch {
        message.error('Failed to load rounds');
      } finally {
        setLoading(false);
      }
    },
    [detail.id],
  );

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const saveResultConfig = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`games/${detail.id}/result-config`, { ...rc, ...patch });
      message.success('Result config updated');
      reload();
    } catch {
      message.error('Update failed');
    }
  };

  const control = async (action: 'pause' | 'resume' | 'emergency-stop') => {
    try {
      await api.post(`games/${detail.id}/${action}`);
      message.success(`${action} done`);
      reload();
      loadRounds(pageNo);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed'));
    }
  };

  const triggerDraw = async (roundId: number) => {
    try {
      await api.post('draws/trigger', { roundId });
      message.success('Draw triggered');
      loadRounds(pageNo);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to trigger draw'));
    }
  };

  const cancelRound = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled');
      loadRounds(pageNo);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Cancel failed'));
    }
  };

  const openForceResult = (round: RoundRow) => {
    setActiveRound(round);
    const defaults = Array.from({ length: DICE_DEFAULTS.diceCount }, () => 1);
    setDiceFaces(defaults);
    resultForm.resetFields();
    resultForm.setFieldsValue({ drawResult: defaults.join(',') });
    setResultOpen(true);
  };

  const submitForceResult = async () => {
    try {
      const v = await resultForm.validateFields();
      const raw: string = (v.drawResult ? v.drawResult : '').trim();
      const dice = raw
        .split(/[\s,]+/)
        .map((n) => Number(n))
        .filter((n) => !Number.isNaN(n));
      if (dice.length === 0 || dice.some((n) => n < 1 || n > DICE_DEFAULTS.diceFaces)) {
        message.error(
          `Enter comma-separated dice values between 1 and ${DICE_DEFAULTS.diceFaces}, e.g. 1,2,3`,
        );
        return;
      }
      setSettingResult(true);
      await api.post('draws/set-result', {
        roundId: activeRound?.id,
        result: { dice, drawResult: dice.join(',') },
        drawResult: dice.join(','),
      });
      message.success('Result set');
      setResultOpen(false);
      loadRounds(pageNo);
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(getApiErrorMessage(e, 'Failed to set result'));
    } finally {
      setSettingResult(false);
    }
  };

  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(rc.resultMode);

  const columns: ColumnsType<RoundRow> = [
    {
      title: 'Round No',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 160,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>
          {v}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val: number) => <StatusBadge kind="round" status={val} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 180,
      render: (_, r) => (
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
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => openForceResult(r)}
          >
            Force Result
          </Button>
          {r.status === 1 && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => triggerDraw(r.id)}
            >
              Draw
            </Button>
          )}
          {(r.status === 0 || r.status === 1) && (
            <Popconfirm title="Cancel this round?" onConfirm={() => cancelRound(r.id)}>
              <Button type="link" size="small" danger>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <>
            <ThunderboltOutlined /> Smart Result Engine
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
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
        <Row gutter={24} align="top">
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
        <Row gutter={24}>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Never pick an outcome whose payout exceeds the house-edge target.
                </div>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Favour outcomes that no player bet on (zero winners).
                </div>
              </div>
            </Space>
          </Col>
        </Row>
        <Divider />
        <Space wrap>
          {detail.isPaused === 1 ? (
            <Button icon={<PlayCircleOutlined />} onClick={() => control('resume')}>
              Resume
            </Button>
          ) : (
            <Button icon={<PauseCircleOutlined />} onClick={() => control('pause')}>
              Pause
            </Button>
          )}
          <Popconfirm
            title="Emergency stop?"
            description="Cancels open rounds and refunds all pending orders."
            okButtonProps={{ danger: true }}
            onConfirm={() => control('emergency-stop')}
          >
            <Button danger icon={<StopOutlined />}>
              Emergency Stop
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      <Card
        title={
          <>
            <HistoryOutlined /> Rounds — Manual Result & Draw Control
          </>
        }
        style={{ borderRadius: 12 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => loadRounds(pageNo)}>
            Refresh
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rounds}
          className="modern-table"
          scroll={{ x: 1000 }}
          pagination={{
            current: pageNo,
            pageSize: 10,
            total,
            showTotal: (t) => `${t} rounds`,
            onChange: (p) => loadRounds(p),
          }}
        />
      </Card>

      <Modal
        title={`Set / Force Result${activeRound ? ` — ${activeRound.roundNo}` : ''}`}
        open={resultOpen}
        onOk={submitForceResult}
        onCancel={() => setResultOpen(false)}
        confirmLoading={settingResult}
        okText="Set Result"
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Manual dice result"
          description={`Pick the face for each of the ${DICE_DEFAULTS.diceCount} dice (1–${DICE_DEFAULTS.diceFaces}). The preview shows the sum, big/small and odd/even exactly as players see it.`}
        />
        <Form form={resultForm} layout="vertical">
          <Form.Item
            name="drawResult"
            rules={[{ required: true, message: 'Pick a face for each die' }]}
            style={{ margin: 0 }}
          >
            <Input type="hidden" />
          </Form.Item>
        </Form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 18 }}>
          {diceFaces.map((face, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                {`Die ${i + 1}`}
              </div>
              <DiceFaceSelector value={face} onChange={(n) => setDieFace(i, n)} />
            </div>
          ))}
        </div>
        {resultDrawValue ? (
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Result Preview
            </div>
            <GameResultDisplay
              gameType={detail.gameType}
              result={{ dice: diceFaces, drawResult: resultDrawValue }}
              size={32}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
};

export default ResultDrawTab;

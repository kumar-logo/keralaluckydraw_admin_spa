import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, Empty, Form, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import { EyeOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import StatusBadge from '../../../components/StatusBadge';
import { GameResultDisplay } from '../../../components/ResultBall';
import { formatDateTime } from '../../../utils/format';
import { RESULT_MODE_OPTIONS, WingoDigitPicker, DEFAULT_RESULT_MODE, type ColorGameDetail, type RoundRow } from './colorShared';

const ResultDrawTab = ({
  detail,
  reload,
  control,
}: {
  detail: ColorGameDetail;
  reload: () => void;
  control: (action: string) => Promise<void>;
}) => {
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultRound, setResultRound] = useState<RoundRow | null>(null);
  const [resultForm] = Form.useForm();
  const [resultSaving, setResultSaving] = useState(false);
  const [numberColors, setNumberColors] = useState<Record<string, string[]>>({});
  const [palette, setPalette] = useState<Record<string, string>>({});
  const resultNumber = Form.useWatch('number', resultForm);

  useEffect(() => {
    let active = true;
    api
      .get(`games/${detail.id}/config`)
      .then((cfg) => {
        if (!active) return;
        const typed = cfg as {
          colorPalette?: { colorKey: string; hex: string }[];
          numberColors?: { number: number; colors: string[] }[];
        };
        setPalette(
          Object.fromEntries(
            (Array.isArray(typed.colorPalette) ? typed.colorPalette : []).map((row) => [row.colorKey, row.hex]),
          ),
        );
        setNumberColors(
          Object.fromEntries(
            (Array.isArray(typed.numberColors) ? typed.numberColors : []).map((row) => [
              String(row.number),
              row.colors,
            ]),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [detail.id]);

  const rc = {
    resultMode: detail.resultMode ? detail.resultMode : DEFAULT_RESULT_MODE,
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.post('games/rounds', {
        gameId: detail.id,
        pageNo: 1,
        pageSize: 20,
      })) as { list?: RoundRow[] };
      setRounds(Array.isArray(res.list) ? res.list : []);
    } catch {
      message.error('Failed to load rounds');
    } finally {
      setLoading(false);
    }
  }, [detail.id]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const saveResultConfig = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`games/${detail.id}/result-config`, { ...rc, ...patch });
      message.success('Result config updated');
      reload();
    } catch {
      message.error('Update failed');
    }
  };

  const triggerDraw = async (roundId: number) => {
    try {
      await api.post('draws/trigger', { roundId });
      message.success('Draw triggered');
      fetchRounds();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to trigger draw'));
    }
  };

  const cancelDraw = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled');
      fetchRounds();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Cancel failed'));
    }
  };

  const openResult = (round: RoundRow) => {
    setResultRound(round);
    resultForm.resetFields();
    setResultOpen(true);
  };

  const submitResult = async () => {
    if (!resultRound) return;
    try {
      const v = await resultForm.validateFields();
      setResultSaving(true);
      await api.post('draws/set-result', {
        roundId: resultRound.id,
        gameType: detail.gameType,
        result: { number: v.number },
        drawResult: { number: v.number },
      });
      message.success('Result set and settled');
      setResultOpen(false);
      fetchRounds();
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error(getApiErrorMessage(e, 'Failed to set result'));
    } finally {
      setResultSaving(false);
    }
  };

  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(
    rc.resultMode,
  );

  const columns: ColumnsType<RoundRow> = [
    {
      title: 'Round No',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 170,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
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
      width: 160,
      render: (_: unknown, r: RoundRow) => (
        <GameResultDisplay
          gameType={detail.gameType}
          result={r.result}
          size={22}
          numberColors={numberColors}
          palette={palette}
        />
      ),
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 160,
      render: (v?: string) =>
        formatDateTime(v),
    },
    {
      title: 'Manual',
      dataIndex: 'manualResult',
      key: 'manualResult',
      width: 80,
      render: (v?: number) =>
        v === 1 ? <Tag color="orange">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: unknown, r: RoundRow) => (
        <Space size={4}>
          {r.status === 1 && (
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => triggerDraw(r.id)}
            >
              Draw
            </Button>
          )}
          {(r.status === 0 || r.status === 1) && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openResult(r)}
            >
              Set Result
            </Button>
          )}
          {r.status === 0 && (
            <Popconfirm
              title="Cancel this round?"
              onConfirm={() => cancelDraw(r.id)}
            >
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
        size="small"
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
                  Never pick an outcome whose payout exceeds the house-edge
                  target.
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
      </Card>

      <Card
        size="small"
        title={
          <>
            <StopOutlined /> Emergency Stop
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Space>
          <Tag color={detail.emergencyStop === 1 ? 'red' : 'green'}>
            {detail.emergencyStop === 1 ? 'Stopped' : 'Normal'}
          </Tag>
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
        </Space>
      </Card>

      <Card
        size="small"
        title="Rounds & Manual Result Entry"
        style={{ borderRadius: 12 }}
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchRounds}
          >
            Refresh
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rounds}
          pagination={false}
          className="modern-table"
          scroll={{ x: 960 }}
          locale={{ emptyText: <Empty description="No rounds" /> }}
        />
      </Card>

      <Modal
        title={`Set Result — ${resultRound?.roundNo || ''}`}
        open={resultOpen}
        onOk={submitResult}
        confirmLoading={resultSaving}
        onCancel={() => setResultOpen(false)}
      >
        <Form form={resultForm} layout="vertical">
          <Form.Item
            name="number"
            label="Winning Number (0–9)"
            rules={[
              {
                validator: (_, val) =>
                  val === undefined || val === null
                    ? Promise.reject(new Error('Select the winning number'))
                    : Promise.resolve(),
              },
            ]}
          >
            <WingoDigitPicker numberColors={numberColors} palette={palette} />
          </Form.Item>
        </Form>
        {resultNumber !== undefined && resultNumber !== null && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ fontWeight: 600 }}>Selected number: </span>
            <span style={{ fontWeight: 700 }}>{resultNumber}</span>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ResultDrawTab;

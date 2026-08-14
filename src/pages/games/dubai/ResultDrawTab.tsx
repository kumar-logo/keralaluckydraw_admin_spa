import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import { GameResultDisplay } from '../../../components/ResultBall';
import { useConfigStore } from '../../../store/configStore';
import { formatDateTime } from '../../../utils/format';
import { num, EMPTY_STATUS_MAP, DEFAULT_RESULT_MODE, type RoundRow, type PageList, type GameDetail, type ResultConfig } from './dubaiShared';

const ResultDrawTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const rangeMin =
    Number.isInteger(detail.numberMin) && Number(detail.numberMin) >= 1
      ? Number(detail.numberMin)
      : 1;
  const rangeMax =
    Number.isInteger(detail.numberMax) && Number(detail.numberMax) >= rangeMin
      ? Number(detail.numberMax)
      : 36;
  const roundStatusMap = useConfigStore((s) => s.statusMaps.round ?? EMPTY_STATUS_MAP);
  const rc: ResultConfig = {
    resultMode: detail.resultMode ? detail.resultMode : DEFAULT_RESULT_MODE,
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };

  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [resultOpen, setResultOpen] = useState(false);
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);
  const [digit, setDigit] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchRounds = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = (await api.post('games/rounds', {
          gameId: detail.id,
          pageNo: p,
          pageSize: 10,
        })) as PageList<RoundRow>;
        setRounds(Array.isArray(res.list) ? res.list : []);
        setTotal(typeof res.total === 'number' ? res.total : 0);
        setPage(res.pageNo || p);
      } catch {
        message.error('Failed to load rounds');
      } finally {
        setLoading(false);
      }
    },
    [detail.id],
  );
  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const saveResultConfig = async (patch: Partial<ResultConfig>) => {
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
      fetchRounds(page);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Trigger failed'));
    }
  };

  const cancelDraw = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled');
      fetchRounds(page);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Cancel failed'));
    }
  };

  const submitManualResult = async () => {
    if (!activeRound) return;
    setSubmitting(true);
    try {
      const payload = {
        number: String(digit),
        digits: [digit],
        drawResult: String(digit),
      };
      await api.post('draws/set-result', {
        roundId: activeRound.id,
        gameType: detail.gameType,
        result: payload,
        drawResult: payload,
      });
      message.success('Manual result set');
      setResultOpen(false);
      setActiveRound(null);
      fetchRounds(page);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to set result'));
    } finally {
      setSubmitting(false);
    }
  };

  const emergencyStop = async () => {
    try {
      await api.post(`games/${detail.id}/emergency-stop`);
      message.success('Emergency stop applied');
      fetchRounds(page);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Emergency stop failed'));
    }
  };

  const emergencyResume = async () => {
    try {
      await api.post(`games/${detail.id}/emergency-resume`);
      message.success('Emergency stop cleared');
      fetchRounds(page);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Resume failed'));
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
        <span
          style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}
        >
          {v}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: number) => {
        const info = roundStatusMap[val] || {
          text: `#${val}`,
          color: 'default',
        };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'Result',
      key: 'result',
      width: 160,
      render: (_: unknown, r: RoundRow) => (
        <GameResultDisplay
          gameType={detail.gameType}
          result={r.result}
          size={24}
          themeColor={detail.themeColor}
        />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 110,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{num(v).toFixed(2)}</span>
      ),
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 110,
      render: (v: number) => num(v).toFixed(2),
    },
    {
      title: 'P/L',
      key: 'pl',
      width: 110,
      render: (_: unknown, r: RoundRow) => {
        const pl = num(r.totalBet) - num(r.totalPayout);
        return (
          <span className={pl >= 0 ? 'amount-positive' : 'amount-negative'}>
            {pl >= 0 ? '+' : ''}
            {pl.toFixed(2)}
          </span>
        );
      },
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
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: unknown, r: RoundRow) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setActiveRound(r);
              setDigit(rangeMin);
              setResultOpen(true);
            }}
          >
            Set Result
          </Button>
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
        title={
          <>
            <ThunderboltOutlined /> Smart Result Engine
          </>
        }
        size="small"
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
        <Row gutter={[24, 16]} align="top">
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
              Result Mode
            </div>
            <Select
              style={{ width: '100%' }}
              value={rc.resultMode}
              onChange={(val) => saveResultConfig({ resultMode: val })}
              options={[
                { value: 'random', label: 'Random (fair)' },
                { value: 'weighted', label: 'Weighted' },
                { value: 'min_payout', label: 'Minimum Payout ⚠' },
                { value: 'max_profit', label: 'Maximum Profit ⚠' },
                { value: 'lowest_risk', label: 'Lowest Risk ⚠' },
                { value: 'manual', label: 'Manual Approval' },
              ]}
            />
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}
            >
              How the winning digit is chosen each draw.
            </div>
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
              precision={4}
              placeholder="global default"
              value={rc.houseEdgeTarget}
              onChange={(val) =>
                saveResultConfig({ houseEdgeTarget: val === null ? undefined : val })
              }
            />
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}
            >
              Fraction 0–0.95 (e.g. 0.20 = 20%). Blank uses the global default.
            </div>
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
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}
            >
              Pause each result for manual confirmation before settling.
            </div>
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
                  Prefer zero-order outcomes
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
        title={
          <>
            <StopOutlined /> Emergency Control
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Space wrap>
          <Popconfirm
            title="Emergency stop?"
            description="Cancels open rounds and refunds all pending orders."
            okButtonProps={{ danger: true }}
            onConfirm={emergencyStop}
          >
            <Button danger icon={<StopOutlined />}>
              Emergency Stop
            </Button>
          </Popconfirm>
          {detail.emergencyStop === 1 && (
            <Popconfirm
              title="Clear emergency stop?"
              description="Re-enables draws for this game."
              onConfirm={emergencyResume}
            >
              <Button icon={<PlayCircleOutlined />}>
                Clear Emergency Stop
              </Button>
            </Popconfirm>
          )}
          {detail.emergencyStop === 1 ? (
            <Tag color="red">Emergency stop currently active</Tag>
          ) : (
            <Tag color="green">Normal operation</Tag>
          )}
        </Space>
      </Card>

      <Card
        title="Recent Rounds"
        size="small"
        style={{ borderRadius: 12 }}
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchRounds(page)}
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
          className="modern-table"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (t) => `${t} rounds`,
            onChange: (p) => fetchRounds(p),
          }}
        />
      </Card>

      <Modal
        title="Manual Result Entry"
        open={resultOpen}
        onOk={submitManualResult}
        onCancel={() => setResultOpen(false)}
        confirmLoading={submitting}
        okText="Set Result"
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            activeRound
              ? `Setting result for round ${activeRound.roundNo}`
              : 'Select a round'
          }
          description={`Dubai draws a single number in the configured range (${rangeMin}-${rangeMax}, 1-based). This forces the round result and settles all orders for that round.`}
        />
        <Row gutter={16} align="middle">
          <Col xs={24} sm={14}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Winning Number
            </div>
            <InputNumber
              min={rangeMin}
              max={rangeMax}
              precision={0}
              value={digit}
              onChange={(v) => setDigit(v ?? rangeMin)}
              style={{ width: '100%' }}
              size="large"
            />
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}
            >
              Players who bet number_{digit} win at the configured odds.
            </div>
          </Col>
          <Col xs={24} sm={10}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
            <GameResultDisplay
              gameType={detail.gameType}
              result={{
                number: String(digit),
                digits: [digit],
                drawResult: String(digit),
              }}
              size={36}
              themeColor={detail.themeColor}
            />
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default ResultDrawTab;

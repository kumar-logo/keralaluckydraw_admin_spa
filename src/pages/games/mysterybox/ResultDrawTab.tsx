import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
import { ClockCircleOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import { GameResultDisplay } from '../../../components/ResultBall';
import { formatDateTime } from '../../../utils/format';
import { num, RESULT_MODE_OPTIONS, DEFAULT_RESULT_MODE, type BoxDetail, type RoundRow } from './mysteryBoxShared';

const ResultDrawTab = ({
  detail,
  reload,
  control,
}: {
  detail: BoxDetail;
  reload: () => void;
  control: (action: string) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [resultOpen, setResultOpen] = useState(false);
  const [activeRound, setActiveRound] = useState<RoundRow | null>(null);
  const [itemId, setItemId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const rc = {
    resultMode: detail.resultMode ? detail.resultMode : DEFAULT_RESULT_MODE,
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };

  const saveResultConfig = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`games/${detail.id}/result-config`, { ...rc, ...patch });
      message.success('Result config updated');
      reload();
    } catch {
      message.error('Update failed');
    }
  };

  const fetchRounds = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = (await api.post('games/rounds', {
          gameId: detail.id,
          pageNo: p,
          pageSize: 10,
        })) as { list: RoundRow[]; total: number; pageNo: number };
        setRounds(res.list);
        setTotal(res.total);
        setPage(res.pageNo);
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
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Cancel failed'));
    }
  };

  const submitManualResult = async () => {
    if (!activeRound) return;
    setSubmitting(true);
    try {
      await api.post('draws/set-result', {
        roundId: activeRound.id,
        gameType: detail.gameType,
        result: { itemId },
        drawResult: { itemId },
      });
      message.success('Result set');
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
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 200,
      render: (_: unknown, r: RoundRow) => (
        <GameResultDisplay
          gameType={detail.gameType}
          result={r.result}
          size={22}
        />
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
      width: 230,
      render: (_: unknown, r: RoundRow) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => triggerDraw(r.id)}
          >
            Trigger
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setActiveRound(r);
              setItemId(0);
              setResultOpen(true);
            }}
          >
            Set Result
          </Button>
          <Popconfirm
            title="Cancel this round?"
            onConfirm={() => cancelDraw(r.id)}
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
    <>
      <Card
        title={
          <>
            <ThunderboltOutlined /> Result Engine
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
            description="Outcomes are biased against players. Every draw is recorded in the Decision Log."
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
              onChange={(v) => saveResultConfig({ resultMode: v })}
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
              onChange={(v) => saveResultConfig({ houseEdgeTarget: v })}
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
              onChange={(v) => saveResultConfig({ holdForApproval: v })}
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Space align="start">
              <Switch
                checked={!!rc.avoidBigPrize}
                onChange={(v) => saveResultConfig({ avoidBigPrize: v })}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Avoid big-prize items
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Never pick an item whose payout exceeds the house-edge
                  target.
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space align="start">
              <Switch
                checked={!!rc.avoidZeroOrder}
                onChange={(v) => saveResultConfig({ avoidZeroOrder: v })}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Prefer zero-order items
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Favour items that no player bet on.
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
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Space size={16} wrap align="center">
          <Tag color={detail.emergencyStop === 1 ? 'red' : 'green'}>
            {detail.emergencyStop === 1 ? 'STOPPED' : 'NORMAL'}
          </Tag>
          {detail.emergencyStop === 1 ? (
            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => control('emergency-resume')}
            >
              Emergency Resume
            </Button>
          ) : (
            <Popconfirm
              title="Emergency stop?"
              description="Cancels open rounds and refunds pending orders."
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
        title={
          <>
            <ClockCircleOutlined /> Rounds &amp; Manual Draw
          </>
        }
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
          scroll={{ x: 900 }}
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
        title="Set Manual Result"
        open={resultOpen}
        onOk={submitManualResult}
        confirmLoading={submitting}
        onCancel={() => setResultOpen(false)}
        okText="Force Result"
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Manual override"
          description={`Force the winning item for round ${
            activeRound ? activeRound.roundNo : ''
          }. This settles all orders on that round.`}
        />
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          Winning Item ID
        </div>
        <InputNumber
          min={0}
          value={itemId}
          onChange={(v) => setItemId(num(v))}
          style={{ width: '100%' }}
        />
      </Modal>
    </>
  );
};

export default ResultDrawTab;

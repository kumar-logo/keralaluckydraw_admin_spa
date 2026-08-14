import { useCallback, useEffect, useState } from 'react';
import { Input, InputNumber, Switch, Select, Button, Card, Row, Col, Table, Tag, Space, Modal, Popconfirm, Alert, Divider, message } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, FlagOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import RaceResult from '../../../components/RaceResult';
import { RaceRunner } from '../../../components/RaceBadges';
import { orDash } from '../../../utils/format';
import { parsePositions, SINGLE_RUNNER_COUNT, RESULT_MODE_OPTIONS, DEFAULT_RUNNER_COUNT, clampLaneCount, RaceResultPicker, fmtTime, DEFAULT_RESULT_MODE, type RaceGameDetail, type GameConfigResponse, type RoundRow } from './raceShared';

const ResultDrawTab = ({
  detail,
  reload,
}: {
  detail: RaceGameDetail;
  reload: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [resultRound, setResultRound] = useState<RoundRow | null>(null);
  const [positionsInput, setPositionsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [runnerCount, setRunnerCount] = useState(6);
  const [raceRunners, setRaceRunners] = useState<RaceRunner[]>([]);

  useEffect(() => {
    let active = true;
    api
      .get(`games/${detail.id}/config`)
      .then((cfg) => {
        if (!active) return;
        const config = cfg as unknown as GameConfigResponse;
        setRunnerCount(clampLaneCount(config.race?.runnerCount ?? DEFAULT_RUNNER_COUNT));
        setRaceRunners(
          Array.isArray(config.raceRunners) ? config.raceRunners : [],
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

  const load = useCallback(
    async (page = 1, size = 10) => {
      setLoading(true);
      try {
        const res = (await api.post('games/rounds', {
          gameId: detail.id,
          pageNo: page,
          pageSize: size,
        })) as { list: RoundRow[]; total: number; pageNo: number; pageSize: number };
        setRounds(Array.isArray(res.list) ? res.list : []);
        setTotal(typeof res.total === 'number' ? res.total : 0);
        setPageNo(res.pageNo || page);
        setPageSize(res.pageSize || size);
      } catch {
        message.error('Failed to load rounds');
      } finally {
        setLoading(false);
      }
    },
    [detail.id],
  );
  useEffect(() => {
    load();
  }, [load]);

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
      load(pageNo, pageSize);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Trigger failed'));
    }
  };

  const cancelRound = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled');
      load(pageNo, pageSize);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Cancel failed'));
    }
  };

  const openResult = (r: RoundRow) => {
    setResultRound(r);
    setPositionsInput(parsePositions(r.result).join(', '));
  };

  const submitResult = async (force: boolean) => {
    if (!resultRound) return;
    const positions = positionsInput
      .split(/[\s,]+/)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n));
    if (positions.length < 2) {
      message.warning('Enter at least 2 finishing positions');
      return;
    }
    if (positions.some((p) => p < 1 || p > runnerCount)) {
      message.warning(`Runner numbers must be between 1 and ${runnerCount}`);
      return;
    }
    if (new Set(positions).size !== positions.length) {
      message.warning('Each runner may appear only once');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('draws/set-result', {
        roundId: resultRound.id,
        result: { positions, runnerCount },
        gameType: detail.gameType,
        force,
      });
      message.success(force ? 'Result forced' : 'Result set');
      setResultRound(null);
      load(pageNo, pageSize);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Set result failed'));
    } finally {
      setSubmitting(false);
    }
  };

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
      width: 130,
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      render: (v: string) => fmtTime(v),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Total Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Result (Positions)',
      key: 'result',
      width: 200,
      render: (_: unknown, r: RoundRow) => (
        <RaceResult
          positions={parsePositions(r.result)}
          single={runnerCount === SINGLE_RUNNER_COUNT}
          raceRunners={raceRunners}
        />
      ),
    },
    {
      title: 'Manual',
      dataIndex: 'manualResult',
      key: 'manualResult',
      width: 80,
      render: (v: number) =>
        v === 1 ? <Tag color="orange">Manual</Tag> : <Tag>Auto</Tag>,
    },
    {
      title: 'Result Status',
      dataIndex: 'resultStatus',
      key: 'resultStatus',
      width: 140,
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: 'Settled By',
      dataIndex: 'settledBy',
      key: 'settledBy',
      width: 110,
      render: (v: number | string) => orDash(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
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
          <Button
            type="link"
            size="small"
            icon={<FlagOutlined />}
            onClick={() => openResult(r)}
          >
            Result
          </Button>
          {r.status === 0 && (
            <Popconfirm
              title="Cancel this round?"
              onConfirm={() => cancelRound(r.id)}
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

  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(
    rc.resultMode,
  );

  return (
    <>
      <Card
        title={
          <>
            <ThunderboltOutlined /> Result Engine
          </>
        }
        extra={<Tag color="blue">{runnerCount} runners</Tag>}
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
                  Avoid Big Prize
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
                  Prefer Zero-Order (no winners)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Favour outcomes that no player bet on (zero winners).
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 12,
        }}
      >
        <Button
          icon={<ReloadOutlined />}
          onClick={() => load(pageNo, pageSize)}
        >
          Refresh
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rounds}
        className="modern-table"
        scroll={{ x: 1200 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} rounds`,
          onChange: (p, s) => load(p, s),
        }}
      />

      <Modal
        title={`Set Race Result — ${resultRound ? resultRound.roundNo : ''}`}
        open={!!resultRound}
        onCancel={() => setResultRound(null)}
        footer={[
          <Button key="cancel" onClick={() => setResultRound(null)}>
            Cancel
          </Button>,
          <Popconfirm
            key="force"
            title="Force this result?"
            description="Overrides any existing result and re-settles the round."
            onConfirm={() => submitResult(true)}
          >
            <Button danger icon={<ThunderboltOutlined />} loading={submitting}>
              Force Result
            </Button>
          </Popconfirm>,
          <Button
            key="set"
            type="primary"
            icon={<FlagOutlined />}
            loading={submitting}
            onClick={() => submitResult(false)}
          >
            Set Result
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Finishing order"
          description={`Tap the runners (1 - ${runnerCount}) in finishing order — the first pick is the winner. Each runner may be picked once.`}
        />
        <RaceResultPicker
          value={positionsInput
            .split(/[\s,]+/)
            .map((s) => Number(s))
            .filter((n) => !Number.isNaN(n))}
          onChange={(positions) => setPositionsInput(positions.join(', '))}
          runnerCount={runnerCount}
          single={runnerCount === SINGLE_RUNNER_COUNT}
          raceRunners={raceRunners}
        />
        <Divider style={{ margin: '16px 0 8px' }} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          Or type the order
        </div>
        <Input
          value={positionsInput}
          onChange={(e) => setPositionsInput(e.target.value)}
          placeholder={`e.g. ${Array.from(
            { length: runnerCount },
            (_, i) => i + 1,
          ).join(', ')}`}
        />
        <Space style={{ marginTop: 8 }} wrap>
          <Button
            size="small"
            onClick={() =>
              setPositionsInput(
                Array.from({ length: runnerCount }, (_, i) => i + 1).join(', '),
              )
            }
          >
            Fill 1…{runnerCount}
          </Button>
          <Button size="small" onClick={() => setPositionsInput('')}>
            Clear
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default ResultDrawTab;

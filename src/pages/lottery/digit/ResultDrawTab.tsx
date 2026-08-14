import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  ExperimentOutlined,
  HistoryOutlined,
  ProfileOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { toPaginated } from '../../../services/listResponse';
import { getApiErrorMessage } from '../../../utils/apiError';
import MoneyText from '../../../components/MoneyText';
import { GameResultDisplay } from '../../../components/ResultBall';
import DrawDigitInput from '../draw/DrawDigitInput';
import {
  positionColorList,
} from '../draw/drawTypes';
import { useConfigStore } from '../../../store/configStore';
import { formatDateTime } from '../../../utils/format';
import {
  ROUND_STATUS_SETTLED,
  SLAT_TYPES,
  DEFAULT_SLAT_DIGIT_COUNT,
  deriveSlatLabels,
  num,
  summarizeResultObject,
  RESULT_MODE_OPTIONS,
  ENGINE_LABEL_STYLE,
  ENGINE_HINT_STYLE,
  type DigitGameDetail,
  type GameConfigResponse,
  type SlatReadingResponse,
} from './digitShared';
import SlatReadingPanel from './SlatReadingPanel';

interface RoundResultPayload {
  drawResult?: string | number | null;
}

interface RoundRow {
  id: number;
  roundNo: string;
  status: number;
  drawTime?: string;
  totalBet?: number;
  totalPayout?: number;
  manualResult?: number;
  result?: RoundResultPayload | null;
  proposedResult?: RoundResultPayload | null;
}

interface DrawAnalysis {
  totalOrders?: number;
  totalStake?: number;
  uniquePlayers?: number;
  betsByNumber?: Record<string, number>;
}

interface DrawRecommendation {
  strategy?: string;
  result?: { drawResult?: string | number } | null;
  profitLoss?: number;
  totalWinners?: number;
}

interface DrawPreview {
  proposedResult?: string;
  result?: string;
  profitLoss: number;
  totalWinners?: number;
  totalPayout?: number;
  totalStake?: number;
}

const ResultDrawTab = ({
  detail,
  reload,
}: {
  detail: DigitGameDetail;
  reload: () => void;
}) => {
  const roundStatusMap = useConfigStore((s) => s.statusMaps.round || {});
  const rc = {
    resultMode: detail.resultMode || 'random',
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };
  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(
    rc.resultMode,
  );
  const isManual = rc.resultMode === 'manual';

  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [positionColors, setPositionColors] = useState<string[]>([]);
  const [posLabels, setPosLabels] = useState<string[]>([]);

  const [resultOpen, setResultOpen] = useState(false);
  const [resultRecord, setResultRecord] = useState<RoundRow | null>(null);
  const [resultForm] = Form.useForm();
  const resultDrawValue = Form.useWatch('drawResult', resultForm);
  const [analysis, setAnalysis] = useState<DrawAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<DrawRecommendation[]>(
    [],
  );
  const [preview, setPreview] = useState<DrawPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [proposeLoading, setProposeLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [settingResult, setSettingResult] = useState(false);

  const isSlatGame = SLAT_TYPES.includes(detail.gameType);
  const [readingOpen, setReadingOpen] = useState(false);
  const [readingRound, setReadingRound] = useState<string>('');
  const [readingData, setReadingData] = useState<SlatReadingResponse | null>(
    null,
  );
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingByRound, setReadingByRound] = useState<
    Record<number, SlatReadingResponse>
  >({});

  const fetchReading = useCallback(
    async (roundId: number): Promise<SlatReadingResponse | null> => {
      try {
        const res = await api.get<unknown, SlatReadingResponse>(
          `games/${detail.id}/rounds/${roundId}/slat-reading`,
        );
        setReadingByRound((prev) => ({ ...prev, [roundId]: res }));
        return res;
      } catch {
        return null;
      }
    },
    [detail.id],
  );

  const openReading = useCallback(
    async (record: { id: number; roundNo: string }) => {
      if (!isSlatGame) return;
      setReadingRound(record.roundNo);
      setReadingData(null);
      setReadingOpen(true);
      setReadingLoading(true);
      try {
        const res = await fetchReading(record.id);
        setReadingData(res);
      } finally {
        setReadingLoading(false);
      }
    },
    [fetchReading, isSlatGame],
  );

  const fetchRounds = useCallback(
    async (page = 1, size = 10) => {
      setRoundsLoading(true);
      try {
        const res = toPaginated(
          (await api.post('games/rounds', {
            gameId: detail.id,
            pageNo: page,
            pageSize: size,
          })) as { list?: RoundRow[]; total?: number; pageNo?: number; pageSize?: number },
          page,
          size,
        );
        setRounds(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo);
        setPageSize(res.pageSize);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to load rounds'));
      } finally {
        setRoundsLoading(false);
      }
    },
    [detail.id],
  );
  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  useEffect(() => {
    void api
      .get<unknown, GameConfigResponse>(`games/${detail.id}/config`)
      .then((cfg) => {
        setPositionColors(positionColorList(cfg.positionColors));
        setPosLabels(
          deriveSlatLabels(detail.digitCount ?? DEFAULT_SLAT_DIGIT_COUNT, cfg.slatProducts ?? []),
        );
      })
      .catch(() => {
        setPositionColors([]);
        setPosLabels([]);
      });
  }, [detail.id]);

  useEffect(() => {
    if (!isSlatGame) return;
    for (const r of rounds) {
      if (
        r.status === ROUND_STATUS_SETTLED &&
        readingByRound[r.id] === undefined
      ) {
        void fetchReading(r.id);
      }
    }
  }, [rounds, isSlatGame, readingByRound, fetchReading]);

  const slatLabelsFor = (roundId: number): string[] | undefined => {
    const labeled = readingByRound[roundId]?.reading.labeled;
    return labeled ? labeled.map((pos) => pos.label) : undefined;
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

  const triggerDraw = async (roundId: number) => {
    try {
      await api.post('draws/trigger', { roundId });
      message.success('Draw triggered');
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to trigger draw'));
    }
  };

  const cancelRound = async (roundId: number) => {
    try {
      await api.post('draws/cancel', { roundId });
      message.success('Round cancelled and bets refunded');
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Cancel failed'));
    }
  };

  const openResult = async (record: RoundRow) => {
    setResultRecord(record);
    resultForm.resetFields();
    setPreview(null);
    setAnalysis(null);
    setRecommendations([]);
    setResultOpen(true);
    try {
      const [a, recs] = await Promise.all([
        api.get(`draws/${record.id}/analysis`),
        api.get(`draws/${record.id}/recommend`),
      ]);
      setAnalysis(a as unknown as DrawAnalysis);
      setRecommendations(
        Array.isArray(recs) ? (recs as DrawRecommendation[]) : [],
      );
    } catch {
    }
  };

  const applyRec = (rec: DrawRecommendation) => {
    if (rec?.result?.drawResult) {
      resultForm.setFieldsValue({ drawResult: rec.result.drawResult });
      setPreview(null);
    }
  };

  const doPreview = async () => {
    try {
      const v = await resultForm.validateFields();
      setPreviewLoading(true);
      const res = await api.post(`draws/${resultRecord!.id}/preview`, {
        result: { drawResult: v.drawResult },
      });
      setPreview(res as unknown as DrawPreview);
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error(getApiErrorMessage(err, 'Preview failed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const doSetResult = async () => {
    try {
      const v = await resultForm.validateFields();
      setSettingResult(true);
      await api.post('draws/set-result', {
        roundId: resultRecord!.id,
        result: { drawResult: v.drawResult },
        gameType: detail.gameType,
      });
      message.success('Manual result set');
      setResultOpen(false);
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error(getApiErrorMessage(err, 'Failed to set result'));
    } finally {
      setSettingResult(false);
    }
  };

  const doForceResult = async () => {
    if (!preview) {
      message.warning('Preview the result first');
      return;
    }
    setConfirmLoading(true);
    try {
      await api.post(`draws/${resultRecord!.id}/confirm`, {
        result: preview.proposedResult || preview.result,
      });
      message.success('Result forced, confirmed and settled');
      setResultOpen(false);
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to confirm result'));
    } finally {
      setConfirmLoading(false);
    }
  };

  const doPropose = async () => {
    try {
      const v = await resultForm.validateFields();
      setProposeLoading(true);
      await api.post(`draws/${resultRecord!.id}/propose`, {
        result: { drawResult: v.drawResult },
        mode: rc.resultMode,
      });
      message.success('Result proposed for approval');
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      message.error(getApiErrorMessage(err, 'Propose failed'));
    } finally {
      setProposeLoading(false);
    }
  };

  const doApprove = async () => {
    setApproveLoading(true);
    try {
      await api.post(`draws/${resultRecord!.id}/approve`, {
        result: preview?.proposedResult,
      });
      message.success('Result approved and settled');
      setResultOpen(false);
      fetchRounds(pageNo, pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Approve failed'));
    } finally {
      setApproveLoading(false);
    }
  };

  const columns: ColumnsType<RoundRow> = [
    {
      title: 'Round No',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 160,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: number) => {
        const info = roundStatusMap[val] || { text: `#${val}`, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 160,
      render: (v: string) => formatDateTime(v),
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
      render: (_, r) => {
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
      title: 'Result',
      key: 'result',
      width: 180,
      render: (_, r) => (
        <GameResultDisplay
          gameType={detail.gameType}
          result={r.result}
          size={22}
          slatLabels={slatLabelsFor(r.id)}
          positionColors={positionColors}
        />
      ),
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
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4} wrap>
          {r.status === 1 && (
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => triggerDraw(r.id)}
            >
              Trigger
            </Button>
          )}
          {(r.status === 0 || r.status === 1) && (
            <Button
              type="link"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => openResult(r)}
            >
              Set Result
            </Button>
          )}
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
          {isSlatGame && r.status === ROUND_STATUS_SETTLED && (
            <Button
              type="link"
              size="small"
              icon={<ProfileOutlined />}
              onClick={() => openReading(r)}
            >
              Reading / P&L
            </Button>
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
            description="This game biases outcomes against players. Every draw is recorded in the Decision Log (see P&L / Reports)."
          />
        )}
        <Row gutter={[24, 16]} align="top">
          <Col xs={24} md={8}>
            <div style={ENGINE_LABEL_STYLE}>Result Mode</div>
            <Select
              style={{ width: '100%' }}
              value={rc.resultMode}
              onChange={(val) => saveResultConfig({ resultMode: val })}
              options={RESULT_MODE_OPTIONS}
            />
            <div style={ENGINE_HINT_STYLE}>
              How the winning outcome is chosen each draw.
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={ENGINE_LABEL_STYLE}>House Edge Target</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={0.95}
              step={0.05}
              precision={2}
              placeholder="global default"
              value={rc.houseEdgeTarget}
              onChange={(val) => saveResultConfig({ houseEdgeTarget: val })}
            />
            <div style={ENGINE_HINT_STYLE}>
              Target profit margin (0.10 = 10%). Blank uses the global default.
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={ENGINE_LABEL_STYLE}>Hold For Approval</div>
            <Switch
              checked={!!rc.holdForApproval}
              checkedChildren="On"
              unCheckedChildren="Off"
              onChange={(val) => saveResultConfig({ holdForApproval: val })}
            />
            <div style={ENGINE_HINT_STYLE}>
              Require an admin to approve each result before settling.
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
                  Avoid Big Prize Numbers
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
                  Prefer Zero-Order (No Bets)
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
            <HistoryOutlined /> Round History
          </>
        }
        style={{ borderRadius: 12 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchRounds(pageNo, pageSize)}
          >
            Refresh
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={roundsLoading}
          columns={columns}
          dataSource={rounds}
          className="modern-table"
          scroll={{ x: 1180 }}
          pagination={{
            current: pageNo,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `${t} rounds`,
            onChange: (p, s) => fetchRounds(p, s),
          }}
        />
      </Card>

      <Modal
        title={`Set / Force Result — ${resultRecord?.roundNo ?? ''}`}
        open={resultOpen}
        onCancel={() => setResultOpen(false)}
        width={680}
        footer={[
          <Button key="cancel" onClick={() => setResultOpen(false)}>
            Close
          </Button>,
          <Button key="preview" onClick={doPreview} loading={previewLoading}>
            Preview
          </Button>,
          isManual ? (
            <Button
              key="propose"
              onClick={doPropose}
              loading={proposeLoading}
            >
              Propose
            </Button>
          ) : null,
          isManual ? (
            <Button
              key="approve"
              type="primary"
              onClick={doApprove}
              loading={approveLoading}
              disabled={!preview}
            >
              Approve & Settle
            </Button>
          ) : null,
          <Button
            key="set"
            onClick={doSetResult}
            loading={settingResult}
          >
            Set Manual Result
          </Button>,
          <Button
            key="force"
            type="primary"
            danger
            onClick={doForceResult}
            loading={confirmLoading}
            disabled={!preview}
          >
            Force Result & Settle
          </Button>,
        ]}
      >
        {analysis && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: 'var(--bg-card-alt)',
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Draw Analysis
            </div>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Orders
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {analysis.totalOrders ?? 0}
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Stake
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  <MoneyText value={analysis.totalStake} variant="neutral" />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Players
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {analysis.uniquePlayers ?? 0}
                </div>
              </Col>
            </Row>
            {analysis.betsByNumber && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Bets per Number
                </div>
                <Space wrap size={4}>
                  {Object.entries(
                    analysis.betsByNumber as Record<string, number>,
                  ).map(([k, v]) => (
                    <Tag key={k}>
                      {k}: {num(v).toFixed(0)}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              AI Recommendations
            </div>
            <Row gutter={8}>
              {recommendations.map((rec, i) => (
                <Col xs={24} sm={12} md={8} key={i}>
                  <div
                    onClick={() => applyRec(rec)}
                    style={{
                      cursor: 'pointer',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border-light)',
                      background:
                        rec.strategy === 'zero_loss'
                          ? '#f0fdf4'
                          : 'var(--bg-card-alt)',
                    }}
                  >
                    <Tag
                      color={
                        rec.strategy === 'zero_loss'
                          ? 'green'
                          : rec.strategy === 'min_payout'
                            ? 'blue'
                            : 'orange'
                      }
                      style={{ marginBottom: 4 }}
                    >
                      {String(rec.strategy || '').replace('_', ' ')}
                    </Tag>
                    <div
                      style={{
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        margin: '2px 0 4px',
                      }}
                    >
                      Result:{' '}
                      {rec.result?.drawResult != null ? (
                        <GameResultDisplay
                          gameType={detail.gameType}
                          result={rec.result}
                          size={20}
                          slatLabels={posLabels}
                          positionColors={positionColors}
                        />
                      ) : (
                        '-'
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      P/L: <MoneyText value={rec.profitLoss} variant="auto" /> |{' '}
                      {rec.totalWinners} winners
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        <Form form={resultForm} layout="vertical">
          <Form.Item label="Game Type">
            <Input disabled value={`${detail.gameType} (${detail.digitCount ?? '?'} digits)`} />
          </Form.Item>
          <Form.Item
            name="drawResult"
            label="Set Manual Result"
            rules={[{ required: true, message: 'Enter the draw result digits' }]}
          >
            {detail.gameType === 'dubai' ? (
              <Select
                showSearch
                placeholder="Pick the winning number"
                style={{ width: '100%' }}
                optionFilterProp="label"
                options={Array.from(
                  {
                    length:
                      (Number.isInteger(detail.numberMax) &&
                      Number(detail.numberMax) >=
                        (Number(detail.numberMin) || 1)
                        ? Number(detail.numberMax)
                        : 36) -
                      (Number.isInteger(detail.numberMin) &&
                      Number(detail.numberMin) >= 1
                        ? Number(detail.numberMin)
                        : 1) +
                      1,
                  },
                  (_, i) => {
                    const lo =
                      Number.isInteger(detail.numberMin) &&
                      Number(detail.numberMin) >= 1
                        ? Number(detail.numberMin)
                        : 1;
                    const n = lo + i;
                    return { value: String(n), label: String(n) };
                  },
                )}
              />
            ) : (
              <DrawDigitInput
                length={detail.digitCount ?? DEFAULT_SLAT_DIGIT_COUNT}
                labels={
                  (resultRecord ? slatLabelsFor(resultRecord.id) : undefined) ??
                  posLabels
                }
                colors={positionColors.slice(0, detail.digitCount ?? DEFAULT_SLAT_DIGIT_COUNT)}
                size={46}
              />
            )}
          </Form.Item>
        </Form>

        {resultRecord && resultDrawValue ? (
          <div style={{ marginBottom: 12 }}>
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
              result={{ drawResult: resultDrawValue, number: resultDrawValue }}
              size={32}
              slatLabels={slatLabelsFor(resultRecord.id)}
              positionColors={positionColors}
            />
          </div>
        ) : null}

        {isManual && resultRecord?.proposedResult && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Proposed vs Final"
            description={
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
              >
                Proposed:{' '}
                {resultRecord.proposedResult?.drawResult != null ? (
                  <GameResultDisplay
                    gameType={detail.gameType}
                    result={resultRecord.proposedResult}
                    size={18}
                    slatLabels={posLabels}
                    positionColors={positionColors}
                  />
                ) : (
                  <strong>
                    {summarizeResultObject(resultRecord.proposedResult)}
                  </strong>
                )}
                {' — '}Final:{' '}
                {resultRecord.result?.drawResult != null ? (
                  <GameResultDisplay
                    gameType={detail.gameType}
                    result={resultRecord.result}
                    size={18}
                    slatLabels={posLabels}
                    positionColors={positionColors}
                  />
                ) : (
                  <strong>{summarizeResultObject(resultRecord.result)}</strong>
                )}
              </div>
            }
          />
        )}

        {preview && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              border: '2px solid',
              borderColor: preview.profitLoss >= 0 ? '#10b981' : '#ef4444',
              background: preview.profitLoss >= 0 ? '#f0fdf4' : '#fef2f2',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Result Preview (Payout Forecast)
            </div>
            <Row gutter={16}>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Winners
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {preview.totalWinners}
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Payout
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText value={preview.totalPayout} variant="neutral" />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Stake
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText value={preview.totalStake} variant="neutral" />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Profit / Loss
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText
                    value={preview.profitLoss}
                    variant="auto"
                    showSign
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {isSlatGame && (
        <Modal
          title={`Result Reading & P&L — ${readingRound}`}
          open={readingOpen}
          onCancel={() => setReadingOpen(false)}
          width={860}
          footer={[
            <Button key="close" onClick={() => setReadingOpen(false)}>
              Close
            </Button>,
          ]}
        >
          <SlatReadingPanel
            gameType={detail.gameType}
            data={readingData}
            loading={readingLoading}
            positionColors={positionColors}
          />
        </Modal>
      )}
    </>
  );
};

export default ResultDrawTab;

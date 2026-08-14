import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Tooltip,
  InputNumber,
  Switch,
  Tabs,
} from 'antd';
import {
  ReloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  AimOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { GameResultDisplay } from '../components/ResultBall';
import { useConfigStore, type StatusEntry } from '../store/configStore';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { formatDateTime, formatMoney } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';

const EMPTY_STATUS_MAP: Record<number, StatusEntry> = {};
const DEFAULT_RESULT_MODE = 'random';

const { RangePicker } = DatePicker;

interface DrawRecord {
  id: number;
  roundNo: string;
  gameId: number;
  gameType: string;
  gameName: string;
  drawTime: string;
  status: number;
  result: unknown;
  totalBet: number;
  totalPayout: number;
  manualResult: number;
  settledBy: string;
  resultStatus?: string;
  resultMode?: string;
  autoGenerate?: number;
  proposedResult?: { drawResult?: string | number } | null;
  winners?: number;
  winnerCount?: number;
  totalWinners?: number;
}

interface DrawListResponse {
  list: DrawRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface AnalysisData {
  totalOrders: number;
  totalStake: number;
  uniquePlayers: number;
}

interface RecommendationItem {
  strategy: string;
  profitLoss: number;
  totalWinners: number;
  totalPayout: number;
  result?: { drawResult?: string | number };
}

interface PreviewWinner {
  orderNo: string;
  userId: string | number;
  amount: number;
  winAmount: number;
  prizeLevel: number | string;
}

interface PreviewData {
  totalWinners: number;
  totalPayout: number;
  totalStake: number;
  profitLoss: number;
  winners?: PreviewWinner[];
  proposedResult?: { drawResult?: string | number };
  winRate?: number;
}

interface GameRow {
  id: number;
  gameName: string;
  gameType: string;
  isThirdParty?: boolean;
  resultConfigJson?: {
    resultMode?: string;
    houseEdgeTarget?: number;
    holdForApproval?: boolean;
  } | null;
}

interface DecisionRow {
  id: number;
  createdAt: string;
  gameId: number;
  gameType: string;
  mode: string;
  decidedBy: string;
  chosenResult?: { drawResult?: string | number };
  totalStake: number;
  totalPayout: number;
  profitLoss: number;
  reason: string;
}


const RESULT_SOURCE_META: Record<
  string,
  { label: string; cls: 'active' | 'pending' | 'processing' | 'inactive' | 'cancelled' }
> = {
  AUTO: { label: 'AUTO', cls: 'active' },
  MANUAL: { label: 'MANUAL', cls: 'pending' },
  SMART: { label: 'SMART', cls: 'processing' },
  AWAITING: { label: 'AWAITING APPROVAL', cls: 'pending' },
};

const resolveResultSource = (
  r: DrawRecord,
): { label: string; cls: 'active' | 'pending' | 'processing' | 'inactive' | 'cancelled'; tone?: string } => {
  if (r.resultStatus === 'proposed') {
    return { ...RESULT_SOURCE_META.AWAITING, tone: r.resultMode };
  }
  if (r.manualResult) return { ...RESULT_SOURCE_META.MANUAL };
  if (
    r.resultMode &&
    r.resultMode !== 'random' &&
    r.resultMode !== 'auto' &&
    r.resultMode !== 'manual'
  ) {
    return { ...RESULT_SOURCE_META.SMART, tone: r.resultMode };
  }
  if (r.autoGenerate === 0) return { ...RESULT_SOURCE_META.MANUAL };
  return { ...RESULT_SOURCE_META.AUTO, tone: r.resultMode };
};

const winnersCountOf = (r: DrawRecord): number | null => {
  if (typeof r.totalWinners === 'number') return r.totalWinners;
  if (typeof r.winnerCount === 'number') return r.winnerCount;
  if (typeof r.winners === 'number') return r.winners;
  return null;
};

const DrawManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLotteryContext = location.pathname.startsWith('/lottery');
  const { lotteryTypes, gameOnlyTypes, statusMaps } = useConfigStore();
  const { get: getDigitConfig } = useDigitPositionConfig();
  const roundStatusMap: Record<number, StatusEntry> =
    statusMaps.round ?? EMPTY_STATUS_MAP;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrawRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [gameType, setGameType] = useState<string | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [tabFilter, setTabFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultRecord, setResultRecord] = useState<DrawRecord | null>(null);
  const [resultForm] = Form.useForm<{ drawResult: string }>();
  const resultDrawValue = Form.useWatch('drawResult', resultForm);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    [],
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const [gamesList, setGamesList] = useState<GameRow[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const RESULT_MODES = [
    'random',
    'weighted',
    'min_payout',
    'max_profit',
    'lowest_risk',
    'manual',
  ];
  const BIASED_MODES = ['min_payout', 'max_profit', 'lowest_risk'];

  const fetchDraws = async (
    page = pageNo,
    size = pageSize,
    q = search,
    gt = gameType,
    st = status,
    dates = dateRange,
    tab = tabFilter,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { pageNo: page, pageSize: size };
      if (q) params.search = q;
      if (gt) params.gameType = gt;
      if (st !== undefined) params.status = st;
      if (tab && tab !== 'all') params.filterType = tab;
      if (dates) {
        params.startDate = dates[0].format('YYYY-MM-DD');
        params.endDate = dates[1].format('YYYY-MM-DD');
      }
      const endpoint = isLotteryContext ? 'lottery/draws' : 'draws/list';
      const res = (await api.post(endpoint, params)) as unknown as DrawListResponse;
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
      window.dispatchEvent(new Event('admin:refresh-badges'));
    } catch {
      message.error('Failed to load draws');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraws();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPageNo(1);
    fetchDraws(1, pageSize, v, gameType, status, dateRange);
  };
  const handleGameTypeFilter = (v: string | undefined) => {
    setGameType(v);
    setPageNo(1);
    fetchDraws(1, pageSize, search, v, status, dateRange);
  };
  const handleStatusFilter = (v: number | undefined) => {
    setStatus(v);
    setPageNo(1);
    fetchDraws(1, pageSize, search, gameType, v, dateRange);
  };
  const handleDateRange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    setPageNo(1);
    fetchDraws(1, pageSize, search, gameType, status, dates);
  };
  const handleTabChange = (tab: string) => {
    setTabFilter(tab);
    setStatus(undefined);
    setPageNo(1);
    fetchDraws(1, pageSize, search, gameType, undefined, dateRange, tab);
  };

  const handleSetResult = async (record: DrawRecord) => {
    setResultRecord(record);
    resultForm.resetFields();
    setPreviewData(null);
    setRecommendations([]);
    setAnalysisData(null);
    setResultModalOpen(true);
    try {
      const [analysis, recs] = await Promise.all([
        api.get(`draws/${record.id}/analysis`) as unknown as Promise<AnalysisData>,
        api.get(`draws/${record.id}/recommend`) as unknown as Promise<
          RecommendationItem[]
        >,
      ]);
      setAnalysisData(analysis);
      setRecommendations(Array.isArray(recs) ? recs : []);
    } catch {}
  };

  const handlePreview = async () => {
    try {
      const values = await resultForm.validateFields();
      setPreviewLoading(true);
      const res = (await api.post(`draws/${resultRecord!.id}/preview`, {
        result: { drawResult: values.drawResult },
      })) as unknown as PreviewData;
      setPreviewData(res);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Preview failed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmResult = async () => {
    if (!previewData) {
      message.warning('Preview the result first');
      return;
    }
    setConfirmLoading(true);
    try {
      await api.post(`draws/${resultRecord!.id}/confirm`, {
        result: previewData.proposedResult,
      });
      message.success('Draw result confirmed and settled');
      setResultModalOpen(false);
      fetchDraws();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to confirm result'));
    } finally {
      setConfirmLoading(false);
    }
  };

  const applyRecommendation = (rec: RecommendationItem) => {
    if (rec.result?.drawResult != null) {
      resultForm.setFieldsValue({ drawResult: String(rec.result.drawResult) });
      setPreviewData(null);
    }
  };

  const handleTriggerDraw = async (record: DrawRecord) => {
    Modal.confirm({
      title: 'Trigger Draw',
      content: `Trigger draw for round ${record.roundNo}?`,
      onOk: async () => {
        try {
          await api.post('draws/trigger', { roundId: record.id });
          message.success('Draw triggered');
          fetchDraws();
        } catch {
          message.error('Failed to trigger draw');
        }
      },
    });
  };
  const handleCancelRound = async (record: DrawRecord) => {
    Modal.confirm({
      title: 'Cancel Round',
      content: `Cancel round ${record.roundNo}? All bets will be refunded.`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.post('draws/cancel', { roundId: record.id });
          message.success('Round cancelled and bets refunded');
          fetchDraws();
        } catch {
          message.error('Failed to cancel round');
        }
      },
    });
  };
  const handleRetrySettlement = async (record: DrawRecord) => {
    Modal.confirm({
      title: 'Retry Settlement',
      content: `Re-settle round ${record.roundNo}?`,
      onOk: async () => {
        try {
          await api.post('settlement/retry', { roundId: record.id });
          message.success('Settlement retried');
          fetchDraws();
        } catch {
          message.error('Settlement retry failed');
        }
      },
    });
  };
  const handleApprove = (record: DrawRecord) => {
    Modal.confirm({
      title: `Approve Result — ${record.roundNo}`,
      width: 520,
      icon: <CheckCircleOutlined style={{ color: 'var(--success)' }} />,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            The Smart Result Engine proposed this result:
          </p>
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: 'var(--bg-card-alt)',
              marginBottom: 8,
            }}
          >
            <GameResultDisplay
              gameType={record.gameType}
              result={record.proposedResult}
              size={28}
              positionColors={getDigitConfig(record.gameId).colors}
              slatLabels={getDigitConfig(record.gameId).labels}
            />
          </div>
          {record.resultMode && (
            <Tag color="purple" style={{ marginBottom: 8 }}>
              {record.resultMode}
            </Tag>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Approving sets this result and settles all bets. Use “Set Result” to
            override with a different result.
          </p>
        </div>
      ),
      okText: 'Approve & Settle',
      onOk: async () => {
        try {
          await api.post(`draws/${record.id}/approve`, {});
          message.success('Result approved and settled');
          fetchDraws();
        } catch (err) {
          message.error(getApiErrorMessage(err, 'Approval failed'));
        }
      },
    });
  };

  const openResultModes = async () => {
    setModesOpen(true);
    setGamesLoading(true);
    try {
      const res = (await api.post('games/list', {
        pageNo: 1,
        pageSize: 200,
      })) as unknown as { list: GameRow[] };
      setGamesList(res.list.filter((g) => !g.isThirdParty));
    } catch {
      message.error('Failed to load games');
    } finally {
      setGamesLoading(false);
    }
  };

  const saveResultConfig = async (
    game: GameRow,
    patch: Record<string, unknown>,
  ) => {
    const rc = { ...game.resultConfigJson, ...patch };
    try {
      await api.put(`games/${game.id}/result-config`, rc);
      setGamesList((list) =>
        list.map((g) =>
          g.id === game.id ? { ...g, resultConfigJson: rc } : g,
        ),
      );
      message.success(`${game.gameName}: result config saved`);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Save failed'));
    }
  };

  const openDecisions = async () => {
    setDecisionsOpen(true);
    setDecisionsLoading(true);
    try {
      const res = (await api.post('result-decisions', {
        pageNo: 1,
        pageSize: 50,
      })) as unknown as { list: DecisionRow[] };
      setDecisions(res.list);
    } catch {
      message.error('Failed to load decision log');
    } finally {
      setDecisionsLoading(false);
    }
  };

  const profitLoss = data.reduce(
    (sum, d) => sum + (d.totalBet - d.totalPayout),
    0,
  );

  const columns: ColumnsType<DrawRecord> = [
    {
      title: 'Round No',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 180,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'Game',
      dataIndex: 'gameName',
      key: 'gameName',
      width: 140,
      render: (name: string, r: DrawRecord) => (
        <div>
          <span style={{ fontWeight: 600 }}>{name}</span>{' '}
          <Tag style={{ marginLeft: 4 }}>{r.gameType}</Tag>
        </div>
      ),
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 160,
      render: (t: string) => formatDateTime(t),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: number) => <StatusBadge kind="round" status={s} />,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      width: 180,
      render: (r: unknown, record: DrawRecord) => (
        <GameResultDisplay
          gameType={record.gameType}
          result={r}
          size={24}
          positionColors={getDigitConfig(record.gameId).colors}
          slatLabels={getDigitConfig(record.gameId).labels}
        />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'P/L',
      key: 'pl',
      width: 110,
      render: (_: unknown, r: DrawRecord) => {
        const pl = r.totalBet - r.totalPayout;
        return <MoneyText value={pl} variant="auto" showSign />;
      },
    },
    {
      title: 'Winners',
      key: 'winners',
      width: 90,
      render: (_: unknown, r: DrawRecord) => {
        const n = winnersCountOf(r);
        return n === null ? (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ) : (
          <span style={{ fontWeight: 600 }}>{n}</span>
        );
      },
    },
    {
      title: 'Result Source',
      key: 'resultSource',
      width: 160,
      render: (_: unknown, r: DrawRecord) => {
        const src = resolveResultSource(r);
        return (
          <Space direction="vertical" size={2}>
            <span className={`status-badge ${src.cls}`}>{src.label}</span>
            {src.tone && src.tone !== 'auto' && src.tone !== src.label.toLowerCase() && (
              <Tooltip
                title={
                  BIASED_MODES.includes(src.tone)
                    ? 'Operator-biased result mode (audited)'
                    : ''
                }
              >
                <Tag
                  color={BIASED_MODES.includes(src.tone) ? 'purple' : 'default'}
                  style={{ margin: 0 }}
                >
                  {src.tone}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 320,
      fixed: 'right',
      render: (_: unknown, record: DrawRecord) => (
        <Space size={4} wrap>
          {record.status === 1 && record.resultStatus === 'proposed' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ color: 'var(--success)' }}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
          )}
          {record.status <= 1 &&
            (isLotteryContext ? (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/lottery/draws/${record.id}`)}
              >
                Open Draw
              </Button>
            ) : (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleSetResult(record)}
              >
                {record.resultStatus === 'proposed' ? 'Override' : 'Set Result'}
              </Button>
            ))}
          {!isLotteryContext &&
            record.status === 1 &&
            record.resultStatus !== 'proposed' && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleTriggerDraw(record)}
              >
                Trigger
              </Button>
            )}
          {record.status <= 1 && (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleCancelRound(record)}
            >
              Cancel
            </Button>
          )}
          {record.status === 2 && isLotteryContext && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/lottery/draws/${record.id}`)}
            >
              View
            </Button>
          )}
          {record.status === 2 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleRetrySettlement(record)}
            >
              Re-settle
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Draw Management"
        subtitle={`${total} rounds · P/L: ${formatMoney(profitLoss, { showSign: true })}`}
        icon={<AimOutlined />}
        iconBg="var(--gradient-red)"
      />

      {isLotteryContext && (
        <Tabs
          activeKey={tabFilter}
          onChange={handleTabChange}
          items={[
            { key: 'all', label: 'All' },
            { key: 'auto', label: 'Auto' },
            { key: 'manual', label: 'Manual' },
            { key: 'pending', label: 'Pending Draw' },
            { key: 'closed', label: 'Closed' },
          ]}
          style={{ marginBottom: 8 }}
        />
      )}

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="200px">
            <Input.Search
              placeholder="Search round..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="150px">
            <Select
              placeholder={isLotteryContext ? 'Lottery Type' : 'Game Type'}
              allowClear
              style={{ width: '100%' }}
              onChange={handleGameTypeFilter}
              value={gameType}
              options={(isLotteryContext ? lotteryTypes : gameOnlyTypes).map(
                (t) => ({ value: t.value, label: `${t.emoji} ${t.label}` }),
              )}
            />
          </Col>
          <Col flex="150px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusFilter}
              value={status}
              options={Object.entries(roundStatusMap).map(([k, v]) => ({
                value: Number(k),
                label: v.text,
              }))}
            />
          </Col>
          <Col flex="260px">
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) =>
                handleDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
          </Col>
          <Col>
            <Space>
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchDraws()}
                />
              </Tooltip>
              <Button onClick={openResultModes}>Result Modes</Button>
              <Button onClick={openDecisions}>Decision Log</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        className="modern-table"
        scroll={{ x: 1500 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} rounds`,
          onChange: (p, s) => {
            setPageNo(p);
            setPageSize(s);
            fetchDraws(p, s);
          },
        }}
      />

      <Modal
        title={`Draw Result — ${resultRecord?.roundNo}`}
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setResultModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="preview"
            type="default"
            onClick={handlePreview}
            loading={previewLoading}
          >
            Preview
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmResult}
            loading={confirmLoading}
            disabled={!previewData}
            danger
          >
            Confirm & Settle
          </Button>,
        ]}
        destroyOnHidden
      >
        {analysisData && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: 'var(--bg-card-alt)',
              borderRadius: 10,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Orders
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {analysisData.totalOrders}
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Stake
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  <MoneyText value={analysisData.totalStake} variant="neutral" />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Players
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {analysisData.uniquePlayers}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Smart Recommendations
            </div>
            <Row gutter={8}>
              {recommendations.map((rec, i) => (
                <Col xs={24} sm={12} md={8} key={i}>
                  <div
                    onClick={() => applyRecommendation(rec)}
                    style={{
                      cursor: 'pointer',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border-light)',
                      background:
                        rec.strategy === 'zero_loss'
                          ? 'var(--bg-success-soft, var(--bg-card-alt))'
                          : 'var(--bg-card-alt)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--primary)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        'var(--border-light)')
                    }
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
                      {rec.strategy.replace('_', ' ')}
                    </Tag>
                    {rec.result?.drawResult != null && (
                      <div style={{ margin: '2px 0 6px' }}>
                        <GameResultDisplay
                          gameType={resultRecord ? resultRecord.gameType : ''}
                          result={rec.result}
                          size={20}
                          positionColors={getDigitConfig(resultRecord?.gameId).colors}
                          slatLabels={getDigitConfig(resultRecord?.gameId).labels}
                        />
                      </div>
                    )}
                    <div style={{ fontSize: 12 }}>
                      P/L:{' '}
                      <MoneyText value={rec.profitLoss} variant="auto" showSign />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {rec.totalWinners} winners · Payout:{' '}
                      {formatMoney(rec.totalPayout)}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        <Form form={resultForm} layout="vertical">
          <Form.Item label="Game Type">
            <Input disabled value={resultRecord?.gameType} />
          </Form.Item>
          <Form.Item
            name="drawResult"
            label="Draw Result"
            rules={[{ required: true, message: 'Enter the draw result' }]}
          >
            <Input
              placeholder="e.g., 7 for Colour, 3,5,1 for Dice, etc."
              size="large"
            />
          </Form.Item>
        </Form>

        {resultRecord && resultDrawValue ? (
          <div style={{ marginBottom: 16 }}>
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
              gameType={resultRecord.gameType}
              result={{ drawResult: resultDrawValue, number: resultDrawValue }}
              size={30}
              positionColors={getDigitConfig(resultRecord.gameId).colors}
              slatLabels={getDigitConfig(resultRecord.gameId).labels}
            />
          </div>
        ) : null}

        {previewData && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              border: '2px solid',
              borderColor:
                previewData.profitLoss >= 0
                  ? 'var(--success)'
                  : 'var(--danger)',
              background: 'var(--bg-card-alt)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Result Preview
            </div>
            <Row gutter={16}>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Winners
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {previewData.totalWinners}
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Payout
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText value={previewData.totalPayout} variant="neutral" />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Stake
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText value={previewData.totalStake} variant="neutral" />
                </div>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Profit/Loss
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <MoneyText
                    value={previewData.profitLoss}
                    variant="auto"
                    showSign
                  />
                </div>
              </Col>
            </Row>
            {previewData.winners && previewData.winners.length > 0 && (
              <div style={{ marginTop: 12, maxHeight: 150, overflow: 'auto' }}>
                <Table<PreviewWinner>
                  size="small"
                  pagination={false}
                  rowKey="orderNo"
                  dataSource={previewData.winners}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: 'User', dataIndex: 'userId', width: 120 },
                    {
                      title: 'Amount',
                      dataIndex: 'amount',
                      width: 90,
                      render: (v: number) => (
                        <MoneyText value={v} variant="neutral" />
                      ),
                    },
                    {
                      title: 'Win',
                      dataIndex: 'winAmount',
                      width: 90,
                      render: (v: number) => (
                        <MoneyText value={v} variant="positive" />
                      ),
                    },
                    { title: 'Prize', dataIndex: 'prizeLevel', width: 80 },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Result Mode Control"
        open={modesOpen}
        onCancel={() => setModesOpen(false)}
        width={860}
        footer={null}
        destroyOnHidden
      >
        <p
          style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}
        >
          Choose how each game's draw result is selected.{' '}
          <strong>random</strong> is fair;{' '}
          <strong>min_payout / max_profit / lowest_risk</strong> are
          operator-biased modes (every decision is audit-logged in the Decision
          Log). Games left unset use the global default in System Config →
          Result.
        </p>
        <Table<GameRow>
          rowKey="id"
          loading={gamesLoading}
          dataSource={gamesList}
          size="small"
          pagination={false}
          scroll={{ x: 'max-content', y: 440 }}
          columns={[
            {
              title: 'Game',
              dataIndex: 'gameName',
              render: (n: string, g) => (
                <span style={{ fontWeight: 600 }}>
                  {n} <Tag>{g.gameType}</Tag>
                </span>
              ),
            },
            {
              title: 'Result Mode',
              width: 180,
              render: (_: unknown, g) => (
                <Select
                  size="small"
                  style={{ width: 168 }}
                  value={
                    g.resultConfigJson?.resultMode
                      ? g.resultConfigJson.resultMode
                      : DEFAULT_RESULT_MODE
                  }
                  options={RESULT_MODES.map((m) => ({
                    value: m,
                    label: BIASED_MODES.includes(m) ? `${m} ⚠` : m,
                  }))}
                  onChange={(v) => saveResultConfig(g, { resultMode: v })}
                />
              ),
            },
            {
              title: 'House Edge',
              width: 120,
              render: (_: unknown, g) => (
                <InputNumber
                  size="small"
                  min={0}
                  max={0.95}
                  step={0.05}
                  style={{ width: 100 }}
                  placeholder="default"
                  value={g.resultConfigJson?.houseEdgeTarget}
                  onChange={(v) =>
                    saveResultConfig(g, {
                      houseEdgeTarget: v === null ? undefined : v,
                    })
                  }
                />
              ),
            },
            {
              title: 'Hold for Approval',
              width: 130,
              render: (_: unknown, g) => (
                <Switch
                  size="small"
                  checked={!!g.resultConfigJson?.holdForApproval}
                  onChange={(v) => saveResultConfig(g, { holdForApproval: v })}
                />
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="Result Decision Log"
        open={decisionsOpen}
        onCancel={() => setDecisionsOpen(false)}
        width={960}
        footer={null}
        destroyOnHidden
      >
        <Table<DecisionRow>
          rowKey="id"
          loading={decisionsLoading}
          dataSource={decisions}
          size="small"
          scroll={{ x: 'max-content', y: 440 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Time',
              dataIndex: 'createdAt',
              width: 160,
              render: (t: string) => formatDateTime(t),
            },
            { title: 'Game', dataIndex: 'gameType', width: 80 },
            {
              title: 'Mode',
              dataIndex: 'mode',
              width: 120,
              render: (m: string) => (
                <Tag color={BIASED_MODES.includes(m) ? 'purple' : 'default'}>
                  {m}
                </Tag>
              ),
            },
            { title: 'By', dataIndex: 'decidedBy', width: 110 },
            {
              title: 'Result',
              dataIndex: 'chosenResult',
              width: 130,
              render: (r: DecisionRow['chosenResult'], record: DecisionRow) =>
                r?.drawResult != null ? (
                  <GameResultDisplay
                    gameType={record.gameType}
                    result={r}
                    size={22}
                    positionColors={getDigitConfig(record.gameId).colors}
                    slatLabels={getDigitConfig(record.gameId).labels}
                  />
                ) : (
                  '—'
                ),
            },
            {
              title: 'Stake',
              dataIndex: 'totalStake',
              width: 100,
              render: (v: number) => <MoneyText value={v} variant="neutral" />,
            },
            {
              title: 'Payout',
              dataIndex: 'totalPayout',
              width: 100,
              render: (v: number) => <MoneyText value={v} variant="neutral" />,
            },
            {
              title: 'P/L',
              dataIndex: 'profitLoss',
              width: 110,
              render: (v: number) => (
                <MoneyText value={v} variant="auto" showSign />
              ),
            },
            { title: 'Reason', dataIndex: 'reason', width: 130 },
          ]}
        />
      </Modal>
    </div>
  );
};

export default DrawManagementPage;

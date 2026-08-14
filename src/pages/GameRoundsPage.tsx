import { useEffect, useState } from 'react';
import {
  Table,
  Select,
  Tag,
  message,
  Input,
  Button,
  Tooltip,
  Row,
  Col,
  Descriptions,
  Modal,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import GameSelect from '../components/GameSelect';
import StatsCard from '../components/StatsCard';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { GameResultDisplay } from '../components/ResultBall';
import { useConfigStore, type StatusEntry } from '../store/configStore';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { formatDateTime } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';

const EMPTY_STATUS_MAP: Record<number, StatusEntry> = {};

interface RoundRecord {
  id: number;
  gameId: number;
  roundNo: string;
  gameType: string;
  status: number;
  drawTime: string;
  result: unknown;
  totalBet: number;
  totalPayout: number;
  stopBetTime: string;
  manualResult: number;
  settledBy: string;
  createdAt: string;
  settledAt: string;
}

interface RoundListResponse {
  list: RoundRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface GameOption {
  id: number;
  name: string;
  gameType: string;
}

const GameRoundsPage = () => {
  const { get: getDigitConfig } = useDigitPositionConfig();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoundRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [gameIds, setGameIds] = useState<number[]>([]);
  const [gameType, setGameType] = useState<string | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [games, setGames] = useState<GameOption[]>([]);
  const [detailRecord, setDetailRecord] = useState<RoundRecord | null>(null);

  const fetchGames = async () => {
    try {
      const res = (await api.post('games/options', {
        scope: 'all',
      })) as unknown as GameOption[];
      setGames(res);
    } catch {}
  };

  const { gameTypes: allGameTypes, statusMaps } = useConfigStore();
  const roundStatusMap: Record<number, StatusEntry> =
    statusMaps.round ?? EMPTY_STATUS_MAP;

  const fetchRounds = async (
    page = pageNo,
    size = pageSize,
    gids = gameIds,
    gt = gameType,
    st = status,
    q = search,
  ) => {
    setLoading(true);
    try {
      const res = (await api.post('games/rounds', {
        gameIds: gids.length > 0 ? gids : undefined,
        gameType: gt,
        status: st,
        search: q ? q : undefined,
        pageNo: page,
        pageSize: size,
      })) as unknown as RoundListResponse;
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load rounds'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchRounds();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPageNo(1);
    fetchRounds(1, pageSize, gameIds, gameType, status, v);
  };
  const handleReset = () => {
    setGameIds([]);
    setGameType(undefined);
    setStatus(undefined);
    setSearch('');
    setPageNo(1);
    fetchRounds(1, pageSize, [], undefined, undefined, '');
  };

  const getGameName = (gid: number) => {
    const g = games.find((x) => x.id === gid);
    return g ? g.name : `Game #${gid}`;
  };

  const totalRoundsShown = data.length;
  const settledShown = data.filter((d) => d.status === 2).length;
  const totalSales = data.reduce((s, d) => s + Number(d.totalBet), 0);
  const totalPayout = data.reduce((s, d) => s + Number(d.totalPayout), 0);

  const columns: ColumnsType<RoundRecord> = [
    {
      title: 'Game',
      key: 'game',
      width: 150,
      render: (_: unknown, r: RoundRecord) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {getGameName(r.gameId)}
          </div>
          <Tag color="default" style={{ fontSize: 10 }}>
            {r.gameType?.toUpperCase()}
          </Tag>
        </div>
      ),
    },
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
      render: (val: number) => <StatusBadge kind="round" status={val} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 200,
      render: (_: unknown, r: RoundRecord) => (
        <GameResultDisplay
          gameType={r.gameType}
          result={r.result}
          size={24}
          positionColors={getDigitConfig(r.gameId).colors}
          slatLabels={getDigitConfig(r.gameId).labels}
        />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 120,
      sorter: (a, b) => a.totalBet - b.totalBet,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Total Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 120,
      render: (v: number) => (
        <MoneyText value={v} variant={Number(v) > 0 ? 'positive' : 'neutral'} />
      ),
    },
    {
      title: 'P/L',
      key: 'pl',
      width: 110,
      render: (_: unknown, r: RoundRecord) => {
        const pl = r.totalBet - r.totalPayout;
        return <MoneyText value={pl} variant="auto" showSign />;
      },
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      fixed: 'right',
      render: (_: unknown, r: RoundRecord) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Game Rounds"
        subtitle={`${total} rounds`}
        icon={<HistoryOutlined />}
        iconBg="var(--gradient-purple)"
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <StatsCard
            title="Total Rounds (page)"
            value={totalRoundsShown}
            icon={<FileTextOutlined />}
            color="indigo"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatsCard
            title="Settled (page)"
            value={settledShown}
            icon={<CheckCircleOutlined />}
            color="green"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatsCard
            title="Total Sales (page)"
            value={totalSales.toFixed(2)}
            icon={<RiseOutlined />}
            color="cyan"
            prefix="₹"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatsCard
            title="Total Payout (page)"
            value={totalPayout.toFixed(2)}
            icon={<FallOutlined />}
            color="orange"
            prefix="₹"
          />
        </Col>
      </Row>

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search round no..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="260px">
            <GameSelect
              scope="all"
              value={gameIds}
              onChange={(v) => {
                setGameIds(v);
                setPageNo(1);
                fetchRounds(1, pageSize, v, gameType, status, search);
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col flex="160px">
            <Select
              placeholder="Game Type"
              allowClear
              style={{ width: '100%' }}
              options={allGameTypes.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              onChange={(v) => {
                setGameType(v);
                setPageNo(1);
                fetchRounds(1, pageSize, gameIds, v, status, search);
              }}
              value={gameType}
            />
          </Col>
          <Col flex="130px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => {
                setStatus(v);
                setPageNo(1);
                fetchRounds(1, pageSize, gameIds, gameType, v, search);
              }}
              value={status}
              options={Object.entries(roundStatusMap).map(([k, v]) => ({
                value: Number(k),
                label: v.text,
              }))}
            />
          </Col>
          <Col>
            <Tooltip title="Reset Filters">
              <Button icon={<ReloadOutlined />} onClick={handleReset} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table<RoundRecord>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        locale={{ emptyText: <Empty description="No rounds found" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} rounds`,
          onChange: (page, size) => {
            setPageNo(page);
            setPageSize(size);
            fetchRounds(page, size);
          },
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title="Round Details"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={null}
        width={720}
      >
        {detailRecord && (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Game">
              {getGameName(detailRecord.gameId)} ({detailRecord.gameType})
            </Descriptions.Item>
            <Descriptions.Item label="Round No">
              <span style={{ fontFamily: 'monospace' }}>
                {detailRecord.roundNo}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge kind="round" status={detailRecord.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Manual Result">
              {detailRecord.manualResult ? <Tag color="orange">Yes</Tag> : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Bet">
              <MoneyText value={detailRecord.totalBet} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Total Payout">
              <MoneyText value={detailRecord.totalPayout} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="P/L">
              <MoneyText
                value={detailRecord.totalBet - detailRecord.totalPayout}
                variant="auto"
                showSign
              />
            </Descriptions.Item>
            <Descriptions.Item label="Draw Time">
              {formatDateTime(detailRecord.drawTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Stop Bet Time">
              {formatDateTime(detailRecord.stopBetTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDateTime(detailRecord.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Settled">
              {formatDateTime(detailRecord.settledAt)}
            </Descriptions.Item>
            {detailRecord.settledBy && (
              <Descriptions.Item label="Settled By" span={2}>
                {detailRecord.settledBy}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Result" span={2}>
              {detailRecord.result ? (
                <div style={{ padding: 8 }}>
                  <GameResultDisplay
                    gameType={detailRecord.gameType}
                    result={detailRecord.result}
                    size={32}
                    positionColors={getDigitConfig(detailRecord.gameId).colors}
                    slatLabels={getDigitConfig(detailRecord.gameId).labels}
                  />
                </div>
              ) : (
                '—'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default GameRoundsPage;

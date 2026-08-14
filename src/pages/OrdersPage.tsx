import { useEffect, useState } from 'react';
import {
  Table,
  Input,
  Select,
  Tag,
  Empty,
  message,
  Button,
  Tooltip,
  Row,
  Col,
  Modal,
  Descriptions,
  Avatar,
} from 'antd';
import {
  OrderedListOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import GameSelect from '../components/GameSelect';
import DateRangeFilter, { rangeToDates } from '../components/DateRangeFilter';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { GameResultDisplay } from '../components/ResultBall';
import { AdminBetContentRenderer } from '../components/AdminBetContentRenderer';
import { resolveAssetUrl } from '../utils/assetUrl';
import BetTypeTag from '../components/BetTypeTag';
import { formatDateTime, orDash } from '../utils/format';
import { typeName } from '../utils/gameTypes';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { gameVisualProps } from '../utils/gameVisualProps';

type BetContent = Record<string, unknown>;
type RoundResult = Record<string, unknown>;

interface OrderRecord {
  id: number;
  orderNo: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  gameId: number;
  gameType: string;
  gameName?: string;
  roundNo: string;
  betType: string;
  betContent: BetContent | null;
  amount: number;
  totalAmount: number;
  odds: number;
  winAmount: number;
  prize: number;
  quantity: number;
  status: number;
  isBonus: number;
  createdAt: string;
  result?: RoundResult | null;
}

interface OrdersListResponse {
  list: OrderRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const UserCell = ({ record }: { record: OrderRecord }) => (
  <Link
    to={`/users/${record.userId}`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      color: 'inherit',
    }}
  >
    {record.userAvatar ? (
      <Avatar size={28} src={resolveAssetUrl(record.userAvatar)} style={{ flexShrink: 0 }} />
    ) : (
      <Avatar
        size={28}
        icon={<UserOutlined />}
        style={{ background: 'var(--gradient-blue)', flexShrink: 0 }}
      />
    )}
    <span style={{ fontWeight: 500 }}>
      {record.userNickname ? record.userNickname : record.userId}
    </span>
  </Link>
);

const ORDER_STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Won' },
  { value: 2, label: 'Lost' },
  { value: 3, label: 'Cancelled' },
  { value: 4, label: 'Refunded' },
  { value: 5, label: 'Settled' },
];

const OrdersPage = () => {
  const { get: getDigitConfig } = useDigitPositionConfig();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [userId, setUserId] = useState('');
  const [gameIds, setGameIds] = useState<number[]>([]);
  const [status, setStatus] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [detailRecord, setDetailRecord] = useState<OrderRecord | null>(null);

  const fetchOrders = async (
    page = pageNo,
    size = pageSize,
    uid = userId,
    gids = gameIds,
    st = status,
    range = dateRange,
  ) => {
    setLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = (await api.post('orders/list', {
        pageNo: page,
        pageSize: size,
        userId: uid ? uid : undefined,
        gameIds: gids.length > 0 ? gids : undefined,
        status: st,
        startDate,
        endDate,
      })) as unknown as OrdersListResponse;
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (v: string) => {
    setUserId(v);
    setPageNo(1);
    fetchOrders(1, pageSize, v, gameIds, status, dateRange);
  };
  const handleReset = () => {
    setUserId('');
    setGameIds([]);
    setStatus(undefined);
    setDateRange(null);
    setPageNo(1);
    fetchOrders(1, pageSize, '', [], undefined, null);
  };

  const columns: ColumnsType<OrderRecord> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 170,
      render: (_: unknown, r: OrderRecord) => <UserCell record={r} />,
    },
    {
      title: 'Game Name',
      key: 'gameName',
      width: 150,
      render: (_: unknown, r: OrderRecord) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {orDash(r.gameName)}
        </span>
      ),
    },
    {
      title: 'Game Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 130,
      render: (t: string, r: OrderRecord) => (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Tag>{typeName(t)}</Tag>
          {r.isBonus ? <Tag color="gold">B</Tag> : null}
        </span>
      ),
    },
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 150,
      render: (v: string) =>
        v ? (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            {v}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Picked',
      key: 'picked',
      width: 220,
      render: (_: unknown, r: OrderRecord) =>
        r.betContent ? (
          <AdminBetContentRenderer
            gameType={r.gameType}
            betContent={r.betContent}
            size={20}
            {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        ),
    },
    {
      title: 'Result',
      key: 'result',
      width: 220,
      render: (_: unknown, r: OrderRecord) => (
        <GameResultDisplay
          gameType={r.gameType}
          result={r.result}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 110,
      render: (v: string, r: OrderRecord) => (
        <BetTypeTag
          betType={v}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Odds',
      dataIndex: 'odds',
      key: 'odds',
      width: 70,
      render: (v: number) =>
        v ? (
          <span style={{ color: 'var(--text-muted)' }}>
            {Number(v).toFixed(2)}x
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Win',
      key: 'win',
      width: 110,
      render: (_: unknown, r: OrderRecord) => (
        <MoneyText value={r.winAmount} variant="auto" />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => <StatusBadge kind="order" status={v} />,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'actions',
      width: 45,
      fixed: 'right',
      render: (_: unknown, r: OrderRecord) => (
        <Tooltip title="Details">
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
        title="Orders"
        subtitle={`${total} total orders`}
        icon={<OrderedListOutlined />}
        iconBg="var(--gradient-indigo)"
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search by User ID..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && userId && handleSearch('')}
            />
          </Col>
          <Col flex="260px">
            <GameSelect
              scope="all"
              value={gameIds}
              onChange={(v) => {
                setGameIds(v);
                setPageNo(1);
                fetchOrders(1, pageSize, userId, v, status, dateRange);
              }}
              style={{ width: '100%' }}
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
                fetchOrders(1, pageSize, userId, gameIds, v, dateRange);
              }}
              value={status}
              options={ORDER_STATUS_OPTIONS}
            />
          </Col>
          <Col flex="280px">
            <DateRangeFilter
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPageNo(1);
                fetchOrders(1, pageSize, userId, gameIds, status, range);
              }}
            />
          </Col>
          <Col>
            <Tooltip title="Reset">
              <Button icon={<ReloadOutlined />} onClick={handleReset} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        locale={{ emptyText: <Empty description="No orders" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} orders`,
          onChange: (page, size) => {
            setPageNo(page);
            setPageSize(size);
            fetchOrders(page, size);
          },
        }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="Order Details"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={null}
        width={650}
      >
        {detailRecord && (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Order No">
              <span style={{ fontFamily: 'monospace' }}>
                {detailRecord.orderNo}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="User">
              <UserCell record={detailRecord} />
            </Descriptions.Item>
            <Descriptions.Item label="Game">
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>
                  {orDash(detailRecord.gameName)}
                </span>
                <Tag>{typeName(detailRecord.gameType)}</Tag>
                {detailRecord.isBonus ? <Tag color="gold">Bonus</Tag> : null}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Round No">
              <span style={{ fontFamily: 'monospace' }}>
                {orDash(detailRecord.roundNo)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Bet Type">
              <BetTypeTag
                betType={detailRecord.betType}
                {...gameVisualProps(
                  detailRecord.gameType,
                  getDigitConfig(detailRecord.gameId),
                )}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {detailRecord.quantity ? detailRecord.quantity : 1}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <MoneyText value={detailRecord.totalAmount} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Odds">
              {detailRecord.odds
                ? `${Number(detailRecord.odds).toFixed(2)}x`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Win Amount">
              <MoneyText value={detailRecord.winAmount} variant="auto" />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge kind="order" status={detailRecord.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={2}>
              {formatDateTime(detailRecord.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Picked" span={2}>
              {detailRecord.betContent ? (
                <AdminBetContentRenderer
                  gameType={detailRecord.gameType}
                  betContent={detailRecord.betContent}
                  size={26}
                  {...gameVisualProps(
                    detailRecord.gameType,
                    getDigitConfig(detailRecord.gameId),
                  )}
                />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Result" span={2}>
              {detailRecord.result ? (
                <GameResultDisplay
                  gameType={detailRecord.gameType}
                  result={detailRecord.result}
                  size={26}
                  {...gameVisualProps(
                    detailRecord.gameType,
                    getDigitConfig(detailRecord.gameId),
                  )}
                />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Not drawn yet
                </span>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;

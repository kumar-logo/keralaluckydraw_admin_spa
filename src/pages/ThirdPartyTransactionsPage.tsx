import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Empty,
  Tooltip,
  message,
} from 'antd';
import {
  GlobalOutlined,
  SearchOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  FundOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import MoneyText from '../components/MoneyText';
import { formatDateTime } from '../utils/format';

const { RangePicker } = DatePicker;

interface ThirdPartyTransactionRow {
  id: number;
  txnKey: string;
  serialNumber: string | null;
  memberId: number;
  userId: string;
  username: string;
  gameRound: string | null;
  betAmount: number;
  winAmount: number;
  net: number;
  createdAt: string;
}

interface ThirdPartyTransactionSummary {
  totalWagered: number;
  totalWon: number;
  netProfit: number;
}

interface ThirdPartyTransactionResponse {
  list: ThirdPartyTransactionRow[];
  total: number;
  pageNo: number;
  pageSize: number;
  summary: ThirdPartyTransactionSummary;
}

const EMPTY_SUMMARY: ThirdPartyTransactionSummary = {
  totalWagered: 0,
  totalWon: 0,
  netProfit: 0,
};

const ThirdPartyTransactionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ThirdPartyTransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [summary, setSummary] =
    useState<ThirdPartyTransactionSummary>(EMPTY_SUMMARY);
  const [memberId, setMemberId] = useState('');
  const [gameRound, setGameRound] = useState('');
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);

  const fetchRecords = useCallback(
    async (page = pageNo, size = pageSize) => {
      setLoading(true);
      try {
        const res = (await api.post('third-party/transactions', {
          pageNo: page,
          pageSize: size,
          memberId: memberId.trim() ? Number(memberId.trim()) : undefined,
          gameRound: gameRound.trim() ? gameRound.trim() : undefined,
          startDate: dateRange
            ? dateRange[0].format('YYYY-MM-DD')
            : undefined,
          endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
        })) as unknown as ThirdPartyTransactionResponse;
        setData(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo);
        setPageSize(res.pageSize);
        setSummary(res.summary);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load third-party transactions';
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [pageNo, pageSize, memberId, gameRound, dateRange],
  );

  useEffect(() => {
    fetchRecords(1, pageSize);
  }, []);

  const applyFilters = () => {
    setPageNo(1);
    fetchRecords(1, pageSize);
  };

  const columns: ColumnsType<ThirdPartyTransactionRow> = [
    {
      title: 'User',
      key: 'user',
      width: 180,
      render: (_, r) => (
        <div>
          {r.username && <div style={{ fontWeight: 500 }}>{r.username}</div>}
          <div
            style={{
              fontSize: 12,
              color: r.username ? 'var(--text-muted)' : 'var(--text-primary)',
              fontFamily: 'monospace',
            }}
          >
            {r.userId || `#${r.memberId}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Game Round',
      dataIndex: 'gameRound',
      key: 'gameRound',
      width: 180,
      render: (v: string | null) =>
        v ? (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Serial',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 200,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              {v.length > 18 ? `${v.slice(0, 18)}…` : v}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Wagered',
      dataIndex: 'betAmount',
      key: 'betAmount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Won',
      dataIndex: 'winAmount',
      key: 'winAmount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'GGR (P&L)',
      dataIndex: 'net',
      key: 'net',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Third-Party Transactions"
        subtitle="Casino / slot bets and wins from the 24game aggregator"
        icon={<GlobalOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchRecords(pageNo, pageSize)}
            />
          </Tooltip>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <StatsCard
            title="Total Wagered"
            value={summary.totalWagered}
            icon={<RiseOutlined />}
            color="blue"
            prefix="₹"
            precision={2}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatsCard
            title="Total Won"
            value={summary.totalWon}
            icon={<FallOutlined />}
            color="red"
            prefix="₹"
            precision={2}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatsCard
            title="GGR (P&L)"
            value={summary.netProfit}
            icon={<FundOutlined />}
            color={summary.netProfit >= 0 ? 'green' : 'orange'}
            prefix="₹"
            precision={2}
          />
        </Col>
      </Row>

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="180px">
            <Input
              placeholder="Member ID"
              allowClear
              prefix={<SearchOutlined />}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              onPressEnter={applyFilters}
            />
          </Col>
          <Col flex="220px">
            <Input
              placeholder="Game round"
              allowClear
              value={gameRound}
              onChange={(e) => setGameRound(e.target.value)}
              onPressEnter={applyFilters}
            />
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(d) =>
                setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters}>
              Filter
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        locale={{
          emptyText: <Empty description="No third-party transactions" />,
        }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} transactions`,
          onChange: (page, size) => {
            setPageNo(page);
            setPageSize(size);
            fetchRecords(page, size);
          },
        }}
        scroll={{ x: 1100 }}
      />
    </div>
  );
};

export default ThirdPartyTransactionsPage;

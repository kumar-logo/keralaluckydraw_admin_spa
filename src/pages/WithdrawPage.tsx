import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Popconfirm,
  Space,
  Modal,
  Input,
  Empty,
  message,
  Tooltip,
  Row,
  Col,
  Descriptions,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { StatCardGrid } from '../components/StatCard';
import type { StatGradient } from '../components/StatCard';
import {
  formatDateTime,
  formatRelativeTime,
  formatMoney,
  orDash,
  DATE_FORMAT,
} from '../utils/format';
import { downloadFile } from '../services/download';

const { RangePicker } = DatePicker;

interface WithdrawRecord {
  id: number;
  orderNo: string;
  userId: string;
  username?: string;
  userBalance?: number;
  amount: number;
  fee: number;
  actualAmount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  ifscCode: string;
  upiId: string;
  gpayId: string;
  phonepeId: string;
  status: number;
  remark: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawStatusCount {
  status: number;
  count: number;
  amount: number;
}

interface WithdrawListResponse {
  list: WithdrawRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
  statusCounts: WithdrawStatusCount[];
}

enum WithdrawStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Initiated = 3,
}

interface StatCardDef {
  status: WithdrawStatus;
  label: string;
  gradient: StatGradient;
}

const STAT_CARDS: StatCardDef[] = [
  {
    status: WithdrawStatus.Approved,
    label: 'Successful Withdraw',
    gradient: 'green',
  },
  {
    status: WithdrawStatus.Pending,
    label: 'Pending Withdraw',
    gradient: 'orange',
  },
  {
    status: WithdrawStatus.Rejected,
    label: 'Rejected Withdraw',
    gradient: 'red',
  },
  {
    status: WithdrawStatus.Initiated,
    label: 'Initiated Withdraw',
    gradient: 'blue',
  },
];

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<WithdrawRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<WithdrawStatusCount[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const requestSeqRef = useRef(0);
  const queryRef = useRef<{
    pageNo: number;
    pageSize: number;
    search: string;
    startDate?: string;
    endDate?: string;
  }>({ pageNo: 1, pageSize: 10, search: '' });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrderNo, setRejectOrderNo] = useState('');
  const [rejectRemark, setRejectRemark] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [detailRecord, setDetailRecord] = useState<WithdrawRecord | null>(null);

  const fetchRecords = async (
    page = queryRef.current.pageNo,
    size = queryRef.current.pageSize,
    q = queryRef.current.search,
    startDate = queryRef.current.startDate,
    endDate = queryRef.current.endDate,
  ) => {
    queryRef.current = {
      pageNo: page,
      pageSize: size,
      search: q,
      startDate,
      endDate,
    };
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setLoading(true);
    try {
      const res = (await api.post('finance/withdraw/list', {
        pageNo: page,
        pageSize: size,
        search: q ? q : undefined,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
      })) as unknown as WithdrawListResponse;
      if (requestSeqRef.current !== seq) return;
      setData(res.list);
      setTotal(res.total);
      setStatusCounts(res.statusCounts ?? []);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      const msg =
        err instanceof Error ? err.message : 'Failed to load withdrawals';
      message.error(msg);
    } finally {
      if (requestSeqRef.current === seq) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => fetchRecords(), 30000);
    return () => clearInterval(iv);
  }, []);

  const handleDateChange = (range: [Dayjs, Dayjs] | null) => {
    setDateRange(range);
    setPageNo(1);
    const start = range && range[0] ? range[0].format(DATE_FORMAT) : undefined;
    const end = range && range[1] ? range[1].format(DATE_FORMAT) : undefined;
    fetchRecords(1, pageSize, search, start, end);
  };

  const handleApprove = async (orderNo: string) => {
    try {
      await api.post('finance/withdraw/approve', { orderNo });
      message.success('Withdrawal approved');
      fetchRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve';
      message.error(msg);
    }
  };

  const handleReject = async () => {
    if (!rejectRemark.trim()) {
      message.warning('Please enter a remark');
      return;
    }
    setRejectLoading(true);
    try {
      await api.post('finance/withdraw/reject', {
        orderNo: rejectOrderNo,
        remark: rejectRemark,
      });
      message.success('Withdrawal rejected');
      setRejectModalOpen(false);
      fetchRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject';
      message.error(msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleExportApproved = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('status', String(WithdrawStatus.Approved));
      const { search: q, startDate, endDate } = queryRef.current;
      if (q) params.set('search', q);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      await downloadFile(
        `/finance/withdraw/export?${params.toString()}`,
        `approved-withdrawals-${Date.now()}.csv`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export';
      message.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const statusCountFor = (status: WithdrawStatus): WithdrawStatusCount =>
    statusCounts.find((c) => c.status === status) ?? {
      status,
      count: 0,
      amount: 0,
    };
  const pendingStats = statusCountFor(WithdrawStatus.Pending);
  const pendingCount = pendingStats.count;

  const columns: ColumnsType<WithdrawRecord> = [
    {
      title: 'Initiated',
      key: 'initiated',
      width: 200,
      render: (_: unknown, r: WithdrawRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{formatDateTime(r.createdAt)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatRelativeTime(r.createdAt)}
          </div>
          <Button
            type="link"
            size="small"
            danger
            style={{ padding: 0, height: 'auto' }}
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(r)}
          >
            View
          </Button>
        </div>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 180,
      render: (_: unknown, r: WithdrawRecord) => (
        <div>
          {r.username && <div style={{ fontWeight: 500 }}>{r.username}</div>}
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', fontFamily: 'monospace' }}
            onClick={() => navigate(`/users/${r.userId}`)}
          >
            @{r.userId}
          </Button>
        </div>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'userBalance',
      key: 'userBalance',
      width: 130,
      render: (v: number | undefined) => (
        <MoneyText value={v ?? 0} variant="positive" />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => <MoneyText value={v} variant="negative" large />,
    },
    {
      title: 'Bank Info',
      key: 'bankInfo',
      width: 200,
      render: (_: unknown, r: WithdrawRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{orDash(r.bankName)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {orDash(r.bankAccount ? r.bankAccount : r.upiId)} /{' '}
            {orDash(r.bankHolder)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: number, r: WithdrawRecord) => (
        <div>
          <StatusBadge kind="withdraw" status={v} />
          {v !== WithdrawStatus.Pending && (
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}
            >
              {formatRelativeTime(r.updatedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_: unknown, record: WithdrawRecord) => (
        <Space size={4}>
          <Button
            type="default"
            size="small"
            icon={<ProfileOutlined />}
            onClick={() => setDetailRecord(record)}
          >
            Details
          </Button>
          {record.status === WithdrawStatus.Pending && (
            <>
              <Popconfirm
                title="Approve?"
                description={`Amount: ${formatMoney(record.amount)}`}
                onConfirm={() => handleApprove(record.orderNo)}
                okText="Approve"
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                  Approve
                </Button>
              </Popconfirm>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setRejectOrderNo(record.orderNo);
                  setRejectRemark('');
                  setRejectModalOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Withdraw History"
        subtitle={`${total} withdrawal requests${pendingCount > 0 ? ` | ${pendingCount} pending` : ''}`}
        icon={<ProfileOutlined />}
        iconBg="var(--gradient-red)"
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportApproved}
            loading={exporting}
            style={{
              borderColor: 'var(--success)',
              color: 'var(--success)',
            }}
          >
            Export Approved
          </Button>
        }
      />

      <StatCardGrid
        cards={STAT_CARDS.map((card) => {
          const stat = statusCountFor(card.status);
          return {
            key: card.status,
            label: card.label,
            value: stat.amount,
            gradient: card.gradient,
            money: true,
            sub: `${stat.count} ${stat.count === 1 ? 'record' : 'records'}`,
          };
        })}
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="240px">
            <Input.Search
              placeholder="Search user ID or order..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(v) => {
                setSearch(v);
                setPageNo(1);
                fetchRecords(1, pageSize, v);
              }}
              onChange={(e) => {
                if (!e.target.value && search) {
                  setSearch('');
                  fetchRecords(1, pageSize, '');
                }
              }}
            />
          </Col>
          <Col flex="300px">
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(range) =>
                handleDateChange(range as [Dayjs, Dayjs] | null)
              }
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => fetchRecords()} />
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
        rowClassName={(record) =>
          record.status === WithdrawStatus.Pending ? 'pending-row' : ''
        }
        locale={{ emptyText: <Empty description="No withdrawal records" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} records`,
          onChange: (page, size) => {
            setPageNo(page);
            setPageSize(size);
            fetchRecords(page, size);
          },
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title="Reject Withdrawal"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={rejectLoading}
        okText="Reject"
        okType="danger"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Please provide a reason for rejection:
        </p>
        <Input.TextArea
          rows={3}
          value={rejectRemark}
          onChange={(e) => setRejectRemark(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </Modal>

      <Modal
        title="Withdrawal Details"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={
          detailRecord?.status === WithdrawStatus.Pending ? (
            <Space>
              <Button onClick={() => setDetailRecord(null)}>Close</Button>
              <Button
                danger
                onClick={() => {
                  setRejectOrderNo(detailRecord.orderNo);
                  setRejectRemark('');
                  setRejectModalOpen(true);
                  setDetailRecord(null);
                }}
              >
                Reject
              </Button>
              <Popconfirm
                title="Approve this withdrawal?"
                onConfirm={() => {
                  handleApprove(detailRecord.orderNo);
                  setDetailRecord(null);
                }}
              >
                <Button type="primary" className="btn-approve">
                  Approve
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
        width={640}
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
            <Descriptions.Item label="User ID">
              {detailRecord.userId}
            </Descriptions.Item>
            {detailRecord.username && (
              <Descriptions.Item label="Username">
                {detailRecord.username}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="User Balance">
              <MoneyText
                value={detailRecord.userBalance ?? 0}
                variant="positive"
              />
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <MoneyText value={detailRecord.amount} variant="negative" large />
            </Descriptions.Item>
            <Descriptions.Item label="Fee">
              <MoneyText value={detailRecord.fee} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Actual Amount">
              <MoneyText value={detailRecord.actualAmount} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge kind="withdraw" status={detailRecord.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Bank Name">
              {orDash(detailRecord.bankName)}
            </Descriptions.Item>
            <Descriptions.Item label="Account">
              {orDash(detailRecord.bankAccount)}
            </Descriptions.Item>
            <Descriptions.Item label="Holder">
              {orDash(detailRecord.bankHolder)}
            </Descriptions.Item>
            <Descriptions.Item label="IFSC">
              {orDash(detailRecord.ifscCode)}
            </Descriptions.Item>
            {detailRecord.upiId && (
              <Descriptions.Item label="UPI ID" span={2}>
                {detailRecord.upiId}
              </Descriptions.Item>
            )}
            {detailRecord.gpayId && (
              <Descriptions.Item label="Gpay" span={2}>
                {detailRecord.gpayId}
              </Descriptions.Item>
            )}
            {detailRecord.phonepeId && (
              <Descriptions.Item label="PhonePe" span={2}>
                {detailRecord.phonepeId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created">
              {formatDateTime(detailRecord.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {formatDateTime(detailRecord.updatedAt)}
            </Descriptions.Item>
            {detailRecord.remark && (
              <Descriptions.Item label="Remark" span={2}>
                {detailRecord.remark}
              </Descriptions.Item>
            )}
            {detailRecord.processedBy && (
              <Descriptions.Item label="Processed By" span={2}>
                {detailRecord.processedBy}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default WithdrawPage;

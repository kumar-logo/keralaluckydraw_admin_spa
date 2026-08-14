import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Popconfirm,
  Space,
  Modal,
  Input,
  Image,
  Descriptions,
  Divider,
  Empty,
  message,
  Row,
  Col,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
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
import { resolveAssetUrl } from '../utils/assetUrl';
import { canResolveRecharge } from '../utils/recharge';
import { downloadFile } from '../services/download';

const { RangePicker } = DatePicker;

interface RechargeConfig {
  proofUrl?: string;
  [key: string]: unknown;
}

interface RechargeRecord {
  id: number;
  orderNo: string;
  userId: string;
  username?: string;
  phone?: string;
  userBalance?: number;
  amount: number;
  channel: string;
  gatewayMode?: string;
  additionalVerification?: number;
  manualFallback?: number;
  status: number;
  remark?: string;
  callbackData?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  configJson?: RechargeConfig | null;
  proofUrl?: string;
  paymentRef?: string;
}

interface RechargeStatusCount {
  status: number;
  count: number;
  amount: number;
}

interface RechargeListResponse {
  list: RechargeRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
  statusCounts: RechargeStatusCount[];
}

enum RechargeStatus {
  Pending = 0,
  Success = 1,
  Failed = 2,
  Initiated = 3,
}

interface StatCardDef {
  status: RechargeStatus;
  label: string;
  gradient: StatGradient;
}

const STAT_CARDS: StatCardDef[] = [
  {
    status: RechargeStatus.Success,
    label: 'Successful Deposit',
    gradient: 'green',
  },
  {
    status: RechargeStatus.Pending,
    label: 'Pending Deposit',
    gradient: 'orange',
  },
  {
    status: RechargeStatus.Failed,
    label: 'Rejected Deposit',
    gradient: 'red',
  },
  {
    status: RechargeStatus.Initiated,
    label: 'Initiated Deposit',
    gradient: 'blue',
  },
];

const RechargePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<RechargeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<RechargeStatusCount[]>([]);
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<RechargeRecord | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    orderNo: string;
  }>({ open: false, orderNo: '' });
  const [rejectRemark, setRejectRemark] = useState('');

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
      const res = (await api.post('finance/recharge/list', {
        pageNo: page,
        pageSize: size,
        search: q ? q : undefined,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
      })) as unknown as RechargeListResponse;
      if (requestSeqRef.current !== seq) return;
      setData(res.list);
      setTotal(res.total);
      setStatusCounts(res.statusCounts ?? []);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch (err) {
      if (requestSeqRef.current !== seq) return;
      const msg =
        err instanceof Error ? err.message : 'Failed to load recharge records';
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

  const handleApprove = async (orderNo: string) => {
    try {
      await api.post('finance/recharge/approve', { orderNo });
      message.success('Recharge approved successfully');
      fetchRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve';
      message.error(msg);
    }
  };

  const handleReject = async () => {
    if (!rejectRemark.trim()) {
      message.warning('Please enter a rejection reason');
      return;
    }
    try {
      await api.post('finance/recharge/reject', {
        orderNo: rejectModal.orderNo,
        remark: rejectRemark,
      });
      message.success('Recharge rejected');
      setRejectModal({ open: false, orderNo: '' });
      setRejectRemark('');
      fetchRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject';
      message.error(msg);
    }
  };

  const handleDateChange = (range: [Dayjs, Dayjs] | null) => {
    setDateRange(range);
    setPageNo(1);
    const start = range && range[0] ? range[0].format(DATE_FORMAT) : undefined;
    const end = range && range[1] ? range[1].format(DATE_FORMAT) : undefined;
    fetchRecords(1, pageSize, search, start, end);
  };

  const handleExportApproved = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('status', String(RechargeStatus.Success));
      const { search: q, startDate, endDate } = queryRef.current;
      if (q) params.set('search', q);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      await downloadFile(
        `/finance/recharge/export?${params.toString()}`,
        `approved-deposits-${Date.now()}.csv`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export';
      message.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const canApprove = (r: RechargeRecord): boolean =>
    canResolveRecharge(r, r.status === RechargeStatus.Pending);

  const canReject = (r: RechargeRecord): boolean =>
    canResolveRecharge(r, r.status === RechargeStatus.Pending);

  const statusCountFor = (status: RechargeStatus): RechargeStatusCount =>
    statusCounts.find((c) => c.status === status) ?? {
      status,
      count: 0,
      amount: 0,
    };
  const pendingStats = statusCountFor(RechargeStatus.Pending);
  const pendingCount = pendingStats.count;

  const columns: ColumnsType<RechargeRecord> = [
    {
      title: 'Initiated',
      key: 'initiated',
      width: 200,
      render: (_: unknown, r: RechargeRecord) => (
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
            onClick={() => {
              setDetailRecord(r);
              setDetailOpen(true);
            }}
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
      render: (_: unknown, r: RechargeRecord) => (
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
          {r.phone && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {r.phone}
            </div>
          )}
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
      render: (v: number) => <MoneyText value={v} variant="approve" large />,
    },
    {
      title: 'Gateway',
      key: 'gateway',
      width: 140,
      render: (_: unknown, r: RechargeRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {r.channel ? r.channel : 'Direct'}
          </div>
          {r.gatewayMode && (
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}
            >
              {r.gatewayMode === 'manual' ? 'Manual' : 'Auto'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: number, r: RechargeRecord) => (
        <div>
          <StatusBadge kind="recharge" status={v} />
          {v !== RechargeStatus.Pending && (
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
      render: (_: unknown, record: RechargeRecord) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<ProfileOutlined />}
            onClick={() => {
              setDetailRecord(record);
              setDetailOpen(true);
            }}
          >
            Details
          </Button>
          {canApprove(record) && (
            <Popconfirm
              title="Approve this recharge?"
              description={
                <span>
                  Amount: <strong>{formatMoney(record.amount)}</strong>
                </span>
              }
              onConfirm={() => handleApprove(record.orderNo)}
              okText="Approve"
            >
              <Button
                type="link"
                size="small"
                className="text-approve"
                icon={<CheckCircleOutlined />}
              >
                Approve
              </Button>
            </Popconfirm>
          )}
          {canReject(record) && (
            <Button
              type="link"
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setRejectModal({ open: true, orderNo: record.orderNo });
                setRejectRemark('');
              }}
            >
              Reject
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Deposit History"
        subtitle={`${total} total records${pendingCount > 0 ? ` | ${pendingCount} pending` : ''}`}
        icon={<ProfileOutlined />}
        iconBg="var(--gradient-green)"
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
          record.status === RechargeStatus.Pending ? 'pending-row' : ''
        }
        locale={{ emptyText: <Empty description="No recharge records" /> }}
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
        scroll={{ x: 1100 }}
      />

      <Modal
        title="Recharge Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={
          detailRecord && detailRecord.status === RechargeStatus.Pending ? (
            <Space>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              {canReject(detailRecord) && (
                <Button
                  danger
                  onClick={() => {
                    setDetailOpen(false);
                    setRejectModal({
                      open: true,
                      orderNo: detailRecord.orderNo,
                    });
                    setRejectRemark('');
                  }}
                >
                  Reject
                </Button>
              )}
              {canApprove(detailRecord) && (
                <Popconfirm
                  title="Approve this recharge?"
                  onConfirm={() => {
                    handleApprove(detailRecord.orderNo);
                    setDetailOpen(false);
                  }}
                >
                  <Button type="primary" className="btn-approve">
                    Approve
                  </Button>
                </Popconfirm>
              )}
            </Space>
          ) : null
        }
        width={600}
      >
        {detailRecord && (
          <>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              bordered
              size="small"
              labelStyle={{ fontWeight: 500, background: 'var(--bg-card-alt)' }}
            >
              <Descriptions.Item label="Order No" span={2}>
                {detailRecord.orderNo}
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
                <MoneyText value={detailRecord.amount} variant="approve" large />
              </Descriptions.Item>
              <Descriptions.Item label="Channel">
                {detailRecord.channel ? detailRecord.channel : 'Direct'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusBadge kind="recharge" status={detailRecord.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Processed By">
                {orDash(detailRecord.processedBy)}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {formatDateTime(detailRecord.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {formatDateTime(detailRecord.updatedAt)}
              </Descriptions.Item>
              {detailRecord.remark && (
                <Descriptions.Item label="Remark" span={2}>
                  {detailRecord.status === RechargeStatus.Failed ? (
                    <span className="text-danger">{detailRecord.remark}</span>
                  ) : (
                    detailRecord.remark
                  )}
                </Descriptions.Item>
              )}
              {detailRecord.callbackData && (
                <Descriptions.Item label="Gateway Callback" span={2}>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: 180,
                      overflow: 'auto',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {detailRecord.callbackData}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
            {detailRecord.gatewayMode === 'manual' && (
              <>
                <Divider>Manual Payment Verification</Divider>
                {detailRecord.paymentRef && (
                  <div style={{ marginBottom: 8 }}>
                    Reference / UTR: <strong>{detailRecord.paymentRef}</strong>
                  </div>
                )}
                {detailRecord.proofUrl || detailRecord.configJson?.proofUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <Image
                      src={resolveAssetUrl(
                        detailRecord.proofUrl ||
                          detailRecord.configJson?.proofUrl,
                      )}
                      style={{ maxWidth: 300, borderRadius: 8 }}
                    />
                  </div>
                ) : (
                  <span style={{ color: 'var(--danger, #ef4444)' }}>
                    No payment proof submitted.
                  </span>
                )}
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="Reject Recharge"
        open={rejectModal.open}
        onOk={handleReject}
        onCancel={() => setRejectModal({ open: false, orderNo: '' })}
        okText="Reject"
        okType="danger"
      >
        <p>
          Order: <strong>{rejectModal.orderNo}</strong>
        </p>
        <Input.TextArea
          rows={3}
          value={rejectRemark}
          onChange={(e) => setRejectRemark(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </Modal>
    </div>
  );
};

export default RechargePage;

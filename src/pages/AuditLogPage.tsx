import { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Tag,
  Row,
  Col,
  Tooltip,
  Modal,
  Descriptions,
  Empty,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  AuditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import { formatDateTime, orDash } from '../utils/format';

const { RangePicker } = DatePicker;

type AuditDetails = Record<string, unknown> | null | undefined;

interface AuditRecord {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: AuditDetails;
  ipAddress: string;
  createdAt: string;
}

interface AuditListResponse {
  list: AuditRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface AuditListParams {
  pageNo: number;
  pageSize: number;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const actionColors: Record<string, string | undefined> = {
  approve_recharge: 'green',
  reject_recharge: 'red',
  approve_withdraw: 'green',
  reject_withdraw: 'red',
  set_draw_result: 'volcano',
  cancel_round: 'red',
  update_odds: 'blue',
  update_user: 'cyan',
  create_admin: 'purple',
};

const detailsKeyCount = (d: AuditDetails): number => {
  if (!d || typeof d !== 'object') return 0;
  return Object.keys(d as object).length;
};

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

const AuditLogPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [detailsRecord, setDetailsRecord] = useState<AuditRecord | null>(null);

  const fetchLogs = async (
    page = pageNo,
    size = pageSize,
    q = search,
    act = action,
    dates = dateRange,
  ) => {
    setLoading(true);
    try {
      const params: AuditListParams = { pageNo: page, pageSize: size };
      if (act) params.action = act;
      if (q) params.search = q;
      if (dates) {
        params.startDate = dates[0].format('YYYY-MM-DD');
        params.endDate = dates[1].format('YYYY-MM-DD');
      }
      const res = await api.post<unknown, AuditListResponse>(
        'audit/list',
        params,
      );
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch {
      message.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPageNo(1);
    fetchLogs(1, pageSize, v, action, dateRange);
  };
  const handleActionFilter = (v: string | undefined) => {
    setAction(v);
    setPageNo(1);
    fetchLogs(1, pageSize, search, v, dateRange);
  };
  const handleDateRange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    setPageNo(1);
    fetchLogs(1, pageSize, search, action, dates);
  };

  const columns: ColumnsType<AuditRecord> = [
    {
      title: 'Admin',
      dataIndex: 'adminName',
      key: 'adminName',
      width: 140,
      render: (name: string, r: AuditRecord) => (
        <span style={{ fontWeight: 600 }}>
          {name ? name : `Admin #${r.adminId}`}
        </span>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 170,
      render: (a: string) => (
        <Tag color={actionColors[a]}>{a?.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Target Type',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (v: string) => orDash(v),
    },
    {
      title: 'Target ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 130,
      render: (v: string) =>
        v ? (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      width: 180,
      render: (d: AuditDetails, r: AuditRecord) => {
        const count = detailsKeyCount(d);
        if (count === 0) {
          return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailsRecord(r)}
          >
            View ({count} {count === 1 ? 'key' : 'keys'})
          </Button>
        );
      },
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {orDash(v)}
        </span>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t: string) => formatDateTime(t),
    },
  ];

  const detailsObj = detailsRecord?.details;
  const detailsEntries =
    detailsObj && typeof detailsObj === 'object'
      ? Object.entries(detailsObj as Record<string, unknown>)
      : [];

  return (
    <div className="page-container">
      <PageHeader
        title="Audit Log"
        subtitle={`${total} entries`}
        icon={<AuditOutlined />}
        iconBg="var(--gradient-indigo)"
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search admin or target..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="180px">
            <Select
              placeholder="Action"
              allowClear
              style={{ width: '100%' }}
              onChange={handleActionFilter}
              value={action}
              options={[
                { value: 'approve_recharge', label: 'Approve Recharge' },
                { value: 'reject_recharge', label: 'Reject Recharge' },
                { value: 'approve_withdraw', label: 'Approve Withdraw' },
                { value: 'reject_withdraw', label: 'Reject Withdraw' },
                { value: 'set_draw_result', label: 'Set Draw Result' },
                { value: 'cancel_round', label: 'Cancel Round' },
                { value: 'update_odds', label: 'Update Odds' },
                { value: 'update_user', label: 'Update User' },
                { value: 'create_admin', label: 'Create Admin' },
              ]}
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
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        className="modern-table"
        scroll={{ x: 1260 }}
        locale={{ emptyText: <Empty description="No audit entries" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} entries`,
          onChange: (p, s) => {
            setPageNo(p);
            setPageSize(s);
            fetchLogs(p, s);
          },
        }}
      />

      <Modal
        title={
          detailsRecord
            ? `Audit Details — ${detailsRecord.action?.replace(/_/g, ' ')}`
            : 'Audit Details'
        }
        open={!!detailsRecord}
        onCancel={() => setDetailsRecord(null)}
        footer={
          <Button onClick={() => setDetailsRecord(null)}>Close</Button>
        }
        width={640}
        destroyOnHidden
      >
        {detailsRecord ? (
          <>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 1 }}
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Admin">
                {detailsRecord.adminName
                  ? detailsRecord.adminName
                  : `Admin #${detailsRecord.adminId}`}
              </Descriptions.Item>
              <Descriptions.Item label="Target">
                {orDash(detailsRecord.targetType)}{' '}
                {detailsRecord.targetId ? (
                  <span style={{ fontFamily: 'monospace' }}>
                    #{detailsRecord.targetId}
                  </span>
                ) : null}
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                <span style={{ fontFamily: 'monospace' }}>
                  {orDash(detailsRecord.ipAddress)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Time">
                {formatDateTime(detailsRecord.createdAt)}
              </Descriptions.Item>
            </Descriptions>
            {detailsEntries.length === 0 ? (
              <Empty description="No additional details" />
            ) : (
              <Descriptions
                title="Payload"
                size="small"
                column={{ xs: 1, sm: 1 }}
                bordered
              >
                {detailsEntries.map(([k, v]) => (
                  <Descriptions.Item key={k} label={k}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {formatValue(v)}
                    </span>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};

export default AuditLogPage;

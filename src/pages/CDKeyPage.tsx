import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Popconfirm,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  DatePicker,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  ReloadOutlined,
  SearchOutlined,
  CopyOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatDateTime } from '../utils/format';
import { csvEscape } from '../utils/csv';

interface CDKeyRecord {
  id: number;
  cdKey: string;
  awardType: string;
  awardAmount: number;
  maxUses: number;
  usedCount: number;
  expiredAt: string;
  status: number;
  createdAt: string;
}

interface BulkForm {
  qty: number;
  awardType: string;
  awardAmount: number;
  maxUses: number;
  expiredAt?: dayjs.Dayjs | null;
}

const CDKeyPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CDKeyRecord[]>([]);
  const [filtered, setFiltered] = useState<CDKeyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CDKeyRecord | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm] = Form.useForm<BulkForm>();
  const [bulkLoading, setBulkLoading] = useState(false);

  const applyFilters = (list: CDKeyRecord[], s?: string, st?: number) => {
    let f = list;
    if (s)
      f = f.filter((c) => c.cdKey?.toLowerCase().includes(s.toLowerCase()));
    if (st !== undefined) f = f.filter((c) => c.status === st);
    setFiltered(f);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, CDKeyRecord[] | null>('cdkeys');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilters(list, search, filterStatus);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to load CD keys';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  };

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      cdKey: generateKey(),
      awardType: 'balance',
      awardAmount: 100,
      maxUses: 1,
      status: 1,
    });
    setModalOpen(true);
  };

  const openBulk = () => {
    bulkForm.resetFields();
    bulkForm.setFieldsValue({
      qty: 10,
      awardType: 'balance',
      awardAmount: 100,
      maxUses: 1,
    });
    setBulkOpen(true);
  };

  const openEdit = (r: CDKeyRecord) => {
    setEditRecord(r);
    form.setFieldsValue({
      ...r,
      expiredAt: r.expiredAt ? dayjs(r.expiredAt) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('cdkeys', {
        ...values,
        expiredAt: values.expiredAt
          ? dayjs(values.expiredAt).toISOString()
          : null,
        id: editRecord?.id,
      });
      message.success(editRecord ? 'CD Key updated' : 'CD Key created');
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const values = await bulkForm.validateFields();
      const requested = Number(values.qty);
      if (!Number.isFinite(requested) || requested < 1) {
        message.error('Quantity must be at least 1');
        return;
      }
      const qty = Math.max(1, Math.min(500, requested));
      setBulkLoading(true);
      const expiredIso = values.expiredAt
        ? dayjs(values.expiredAt).toISOString()
        : null;
      let okCount = 0;
      let failCount = 0;
      for (let i = 0; i < qty; i++) {
        try {
          await api.post('cdkeys', {
            cdKey: generateKey(),
            awardType: values.awardType,
            awardAmount: values.awardAmount,
            maxUses: values.maxUses,
            expiredAt: expiredIso,
            status: 1,
          });
          okCount += 1;
        } catch {
          failCount += 1;
        }
      }
      if (failCount === 0) {
        message.success(`Generated ${okCount} keys`);
      } else {
        message.warning(`Generated ${okCount} of ${qty} keys (${failCount} failed)`);
      }
      setBulkOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`cdkeys/${id}`);
      message.success('Deleted');
      fetchData();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to delete';
      message.error(m);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    message.success('Copied to clipboard');
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      message.warning('No keys to export');
      return;
    }
    const header = [
      'cdKey',
      'awardType',
      'awardAmount',
      'usedCount',
      'maxUses',
      'expiredAt',
      'status',
      'createdAt',
    ];
    const lines = filtered.map((r) =>
      [
        r.cdKey,
        r.awardType,
        r.awardAmount,
        r.usedCount,
        r.maxUses,
        r.expiredAt,
        r.status,
        r.createdAt,
      ]
        .map(csvEscape)
        .join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdkeys-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderAwardAmount = (record: CDKeyRecord) => {
    if (record.awardType === 'balance') {
      return <MoneyText value={record.awardAmount} variant="positive" />;
    }
    if (record.awardType === 'spin') {
      return (
        <span className="amount-positive">
          {Number(record.awardAmount)} × spins
        </span>
      );
    }
    return (
      <span className="amount-positive">{Number(record.awardAmount)}</span>
    );
  };

  const columns: ColumnsType<CDKeyRecord> = [
    {
      title: 'CD Key',
      dataIndex: 'cdKey',
      key: 'cdKey',
      width: 240,
      render: (v: string) => (
        <Space>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {v}
          </span>
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyKey(v)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Award',
      dataIndex: 'awardType',
      key: 'awardType',
      width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Amount',
      key: 'awardAmount',
      width: 140,
      render: (_: unknown, r: CDKeyRecord) => renderAwardAmount(r),
    },
    {
      title: 'Uses',
      key: 'uses',
      width: 100,
      render: (_: unknown, r: CDKeyRecord) => (
        <span>
          {r.usedCount}/{r.maxUses}
        </span>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      width: 140,
      render: (v: string) =>
        v ? (
          formatDate(v)
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Never</span>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => <StatusBadge kind="config" status={v} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, r: CDKeyRecord) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            >
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete?"
            onConfirm={() => handleDelete(r.id)}
            okType="danger"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const awardType = Form.useWatch('awardType', form);
  const bulkAwardType = Form.useWatch('awardType', bulkForm);

  return (
    <div className="page-container">
      <PageHeader
        title="CD Key Management"
        subtitle={`${filtered.length} keys`}
        icon={<KeyOutlined />}
        iconBg="var(--gradient-purple)"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button icon={<ThunderboltOutlined />} onClick={openBulk}>
              Bulk Generate
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Generate Key
            </Button>
          </Space>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input
              placeholder="Search by key..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => {
                setSearch(e.target.value);
                applyFilters(data, e.target.value, filterStatus);
              }}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => {
                setFilterStatus(v);
                applyFilters(data, search, v);
              }}
              value={filterStatus}
              options={[
                { value: 1, label: 'Active' },
                { value: 0, label: 'Disabled' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No CD keys generated. Create redemption codes for promotions.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Generate First CD Key
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="modern-table"
          scroll={{ x: 1100 }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit CD Key' : 'Generate CD Key'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={520}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="cdKey" label="CD Key" rules={[{ required: true }]}>
            <Input
              addonAfter={
                !editRecord && (
                  <Button
                    type="text"
                    size="small"
                    onClick={() =>
                      form.setFieldsValue({ cdKey: generateKey() })
                    }
                  >
                    Regenerate
                  </Button>
                )
              }
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="awardType"
                label="Award Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'balance', label: 'Balance' },
                    { value: 'spin', label: 'Spin' },
                    { value: 'coupon', label: 'Coupon' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="awardAmount"
                label={
                  awardType === 'spin' ? 'Spins' : 'Amount'
                }
                rules={[{ required: true }]}
              >
                <InputNumber
                  addonBefore={awardType === 'balance' ? '₹' : undefined}
                  addonAfter={awardType === 'spin' ? '× spins' : undefined}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="maxUses" label="Max Uses">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="expiredAt" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                valuePropName="checked"
                getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                getValueProps={(v) => ({ checked: v === 1 })}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Bulk Generate CD Keys"
        open={bulkOpen}
        onOk={handleBulkGenerate}
        onCancel={() => setBulkOpen(false)}
        confirmLoading={bulkLoading}
        okText="Generate N keys"
        width={520}
        destroyOnHidden
      >
        <Form form={bulkForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="qty"
                label="Quantity"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="awardType"
                label="Award Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'balance', label: 'Balance' },
                    { value: 'spin', label: 'Spin' },
                    { value: 'coupon', label: 'Coupon' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="awardAmount"
                label={bulkAwardType === 'spin' ? 'Spins' : 'Amount'}
                rules={[{ required: true }]}
              >
                <InputNumber
                  addonBefore={
                    bulkAwardType === 'balance' ? '₹' : undefined
                  }
                  addonAfter={
                    bulkAwardType === 'spin' ? '× spins' : undefined
                  }
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="maxUses" label="Max Uses (per key)">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="expiredAt" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Calls the existing create endpoint in a loop. Up to 500 per batch.
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CDKeyPage;

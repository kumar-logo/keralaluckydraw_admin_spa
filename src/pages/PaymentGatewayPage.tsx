import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  Statistic,
  Image,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ApiOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { formatMoney, formatPercent } from '../utils/format';
import { resolveAssetUrl } from '../utils/assetUrl';

interface GatewayRecord {
  id: number;
  gatewayName: string;
  providerCode: string;
  gatewayType?: string;
  mode: string;
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  callbackUrl: string;
  webhookSecret: string;
  minAmount: number;
  maxAmount: number;
  feeRate: number;
  feeFixed: number;
  supportedMethods: string[];
  iconUrl: string;
  qrImageUrl?: string;
  sortOrder: number;
  requireProof: number;
  additionalVerification: number;
  manualFallback: number;
  status: number;
}

const methodColors: Record<string, string | undefined> = {
  upi: 'green',
  bank: 'blue',
  card: 'purple',
  wallet: 'orange',
};

const PaymentGatewayPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GatewayRecord[]>([]);
  const [filtered, setFiltered] = useState<GatewayRecord[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<GatewayRecord | null>(null);
  const [form] = Form.useForm();
  const selectedMode = Form.useWatch('mode', form);
  const [submitLoading, setSubmitLoading] = useState(false);

  const applyFilter = (list: GatewayRecord[], s?: string) => {
    if (!s) {
      setFiltered(list);
      return;
    }
    setFiltered(
      list.filter(
        (g) =>
          g.gatewayName.toLowerCase().includes(s.toLowerCase()) ||
          g.providerCode.toLowerCase().includes(s.toLowerCase()),
      ),
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, GatewayRecord[] | null>(
        'payment-gateways',
      );
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilter(list, search);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to load gateways';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      gatewayType: 'ypayment',
      mode: 'auto',
      minAmount: 100,
      maxAmount: 50000,
      feeRate: 0,
      feeFixed: 0,
      supportedMethods: ['upi'],
      sortOrder: 0,
      requireProof: 1,
      additionalVerification: 0,
      manualFallback: 0,
      status: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (r: GatewayRecord) => {
    setEditRecord(r);
    form.setFieldsValue({ ...r, supportedMethods: r.supportedMethods });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('payment-gateways', { ...values, id: editRecord?.id });
      message.success(editRecord ? 'Gateway updated' : 'Gateway created');
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`payment-gateways/${id}`);
      message.success('Deleted');
      fetchData();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to delete';
      message.error(m);
    }
  };

  const handleTestConnection = (r: GatewayRecord) => {
    // No /test endpoint yet on the backend; placeholder calls test endpoint when wired.
    console.warn('Test gateway connection placeholder', {
      id: r.id,
      providerCode: r.providerCode,
    });
    message.info(
      `Test connection for "${r.gatewayName}" — endpoint not wired yet.`,
    );
  };

  const activeCount = data.filter((g) => g.status === 1).length;

  const columns: ColumnsType<GatewayRecord> = [
    {
      title: 'Icon',
      dataIndex: 'iconUrl',
      key: 'icon',
      width: 50,
      render: (v: string) =>
        v ? (
          <Image
            src={resolveAssetUrl(v)}
            width={32}
            height={32}
            style={{ borderRadius: 6 }}
            preview={false}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iI2UyZThmMCIvPjwvc3ZnPg=="
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BankOutlined style={{ color: 'var(--text-muted)' }} />
          </div>
        ),
    },
    {
      title: 'Gateway',
      dataIndex: 'gatewayName',
      key: 'gatewayName',
      width: 230,
      render: (v: string, r: GatewayRecord) => {
        const hasCreds = !!r.apiKey && !!r.apiSecret;
        return (
          <div>
            <Space size={6} align="center">
              <span style={{ fontWeight: 600 }}>{v}</span>
              <Tooltip
                title={
                  hasCreds
                    ? 'API key and secret are set'
                    : 'Missing API key or secret'
                }
              >
                <Tag
                  icon={
                    hasCreds ? <CheckCircleFilled /> : <CloseCircleFilled />
                  }
                  color={hasCreds ? 'green' : 'red'}
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {hasCreds ? 'Credentials set' : 'No credentials'}
                </Tag>
              </Tooltip>
            </Space>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
              }}
            >
              {r.providerCode}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'manual' ? 'gold' : 'green'} style={{ margin: 0 }}>
          {v === 'manual' ? 'Manual' : 'Auto'}
        </Tag>
      ),
    },
    {
      title: 'Methods',
      dataIndex: 'supportedMethods',
      key: 'methods',
      width: 160,
      render: (v: string[]) => (
        <Space size={4} wrap>
          {v.map((m) => (
            <Tag
              key={m}
              color={methodColors[m]}
              style={{ margin: 0, fontSize: 10, textTransform: 'uppercase' }}
            >
              {m}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'QR',
      dataIndex: 'qrImageUrl',
      key: 'qrImageUrl',
      width: 56,
      render: (v: string | undefined) =>
        v ? (
          <Image
            src={resolveAssetUrl(v)}
            width={32}
            height={32}
            style={{ borderRadius: 6, objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Amount Range',
      key: 'range',
      width: 200,
      render: (_: unknown, r: GatewayRecord) => (
        <span style={{ fontSize: 12 }}>
          <MoneyText value={r.minAmount} variant="neutral" /> –{' '}
          <MoneyText value={r.maxAmount} variant="neutral" />
        </span>
      ),
    },
    {
      title: 'Fee',
      key: 'fee',
      width: 140,
      render: (_: unknown, r: GatewayRecord) => {
        const rate = Number(r.feeRate);
        const fixed = Number(r.feeFixed);
        if (rate === 0 && fixed === 0) {
          return <span className="text-success">Free</span>;
        }
        return (
          <span style={{ fontSize: 12 }}>
            {rate > 0 ? formatPercent(rate * 100, 1) : null}
            {rate > 0 && fixed > 0 ? ' + ' : null}
            {fixed > 0 ? formatMoney(fixed) : null}
          </span>
        );
      },
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
      width: 170,
      render: (_: unknown, r: GatewayRecord) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
          </Tooltip>
          <Tooltip title="Test Connection">
            <Button
              type="link"
              size="small"
              icon={<ApiOutlined />}
              onClick={() => handleTestConnection(r)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete?"
            onConfirm={() => handleDelete(r.id)}
            okType="danger"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Payment Gateways"
        subtitle={`${data.length} gateways (${activeCount} active)`}
        icon={<BankOutlined />}
        iconBg="var(--gradient-green)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Gateway
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card">
            <Statistic title="Total Gateways" value={data.length} />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card">
            <Statistic
              title="Active"
              value={activeCount}
              valueStyle={{ color: 'var(--success)' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card">
            <Statistic
              title="Methods"
              value={
                [...new Set(data.flatMap((g) => g.supportedMethods))].length
              }
              valueStyle={{ color: 'var(--primary)' }}
            />
          </div>
        </Col>
      </Row>

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input
              placeholder="Search gateways..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => {
                setSearch(e.target.value);
                applyFilter(data, e.target.value);
              }}
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
        <Empty description="No payment gateways configured. Integrate a payment gateway to process transactions.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add First Gateway
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
          scroll={{ x: 1000 }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Gateway' : 'Add Gateway'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="gatewayName"
                label="Gateway Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="providerCode"
                label="Provider Code"
                rules={[{ required: true }]}
                extra="Unique id for this gateway instance (e.g. ypayment, keralaluckydraw)."
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="gatewayType"
                label="Gateway Type (Integration)"
                rules={[{ required: true }]}
                extra="Which API integration this gateway uses."
              >
                <Select
                  options={[
                    { value: 'ypayment', label: 'YPayment (UPI gateway API)' },
                    { value: 'cashfree', label: 'Cashfree' },
                    { value: 'razorpay', label: 'Razorpay' },
                    { value: 'manual', label: 'Manual (admin approval)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="mode"
                label="Settlement Mode"
                rules={[{ required: true }]}
                extra="Auto = via gateway API. Manual = admin approval queue."
              >
                <Select
                  options={[
                    { value: 'auto', label: 'Auto — gateway API' },
                    { value: 'manual', label: 'Manual — admin approval' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          {selectedMode === 'manual' && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="requireProof"
                  label="Require Payment Proof Screenshot"
                  valuePropName="checked"
                  getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                  getValueProps={(v) => ({ checked: v === 1 })}
                  extra="When off, users recharge without uploading a screenshot. The UTR reference is still required."
                >
                  <Switch
                    checkedChildren="Required"
                    unCheckedChildren="Optional"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          {selectedMode === 'auto' && (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="additionalVerification"
                  label="Additional Verification"
                  valuePropName="checked"
                  getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                  getValueProps={(v) => ({ checked: v === 1 })}
                  extra="When on, successful payments through this gateway are HELD as Pending for a manual admin approve/reject in Deposit History — the balance is credited only on approval. When off, payments auto-credit on the gateway callback."
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="manualFallback"
                  label="Manual Fallback"
                  valuePropName="checked"
                  getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                  getValueProps={(v) => ({ checked: v === 1 })}
                  extra="When on, the auto approve/reject flow continues UNCHANGED (payments still auto-credit on the gateway callback) AND admins get manual Approve/Reject buttons on Pending deposits to resolve any the auto flow left stuck. It is a fallback, not a hold. When off, no manual buttons appear for this auto gateway."
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="apiUrl" label="API URL">
                <Input placeholder="https://api.provider.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="callbackUrl" label="Callback URL">
                <Input placeholder="https://yourdomain.com/callback" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="apiKey" label="API Key">
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="apiSecret" label="API Secret">
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="webhookSecret" label="Webhook Secret">
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="minAmount" label="Min Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="maxAmount" label="Max Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="feeRate" label="Fee Rate (0.02 = 2%)">
                <InputNumber
                  min={0}
                  max={1}
                  step={0.001}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="feeFixed" label="Fixed Fee">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="supportedMethods" label="Supported Methods">
                <Select
                  mode="multiple"
                  options={[
                    { value: 'upi', label: 'UPI' },
                    { value: 'bank', label: 'Bank Transfer' },
                    { value: 'card', label: 'Card' },
                    { value: 'wallet', label: 'Wallet' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
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
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="iconUrl" label="Gateway Icon">
                <ImageUpload
                  folder="icons"
                  urlPlaceholder="/uploads/gateways/icon.png"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="qrImageUrl"
                label="Payment QR Code"
                extra="Shown to users for manual gateways."
              >
                <ImageUpload
                  folder="gateways"
                  urlPlaceholder="/uploads/gateways/qr.png"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentGatewayPage;

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Tag,
  Popconfirm,
  Empty,
  Modal,
  Row,
  Col,
  Card,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { formatPercent } from '../utils/format';
import { resolveAssetUrl } from '../utils/assetUrl';

interface VipRecord {
  id: number;
  level: number;
  levelName: string;
  levelIcon?: string;
  levelColor?: string;
  minRecharge: number;
  minBet: number;
  dailyReward: number;
  monthlyReward: number;
  rebateRate: number;
  withdrawLimit: number;
  status: number;
}

const DEFAULT_COLOR = '#f59e0b';

const VipConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VipRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<VipRecord | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [colorPreview, setColorPreview] = useState<string>(DEFAULT_COLOR);

  const fetchVipConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, VipRecord[] | { list?: VipRecord[] }>(
        'vip/config',
      );
      if (Array.isArray(res)) {
        setData(res);
      } else {
        setData(Array.isArray(res?.list) ? res.list : []);
      }
    } catch {
      message.error('Failed to load VIP configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVipConfigs();
  }, []);

  const openForm = (record?: VipRecord) => {
    setEditRecord(record ? record : null);
    form.resetFields();
    const defaults: Partial<VipRecord> = record || {
      status: 1,
      level: data.length,
      dailyReward: 0,
      monthlyReward: 0,
      rebateRate: 0,
      withdrawLimit: 5000,
      levelColor: DEFAULT_COLOR,
    };
    form.setFieldsValue(defaults);
    setIconPreview(record && record.levelIcon ? record.levelIcon : '');
    setColorPreview(
      record && record.levelColor ? record.levelColor : DEFAULT_COLOR,
    );
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post('vip/config', { ...values, id: editRecord?.id });
      message.success(editRecord ? 'VIP config updated' : 'VIP config created');
      setModalOpen(false);
      fetchVipConfigs();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to save';
      message.error(m);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`vip/config/${id}`);
      message.success('Deleted');
      fetchVipConfigs();
    } catch {
      message.error('Delete failed');
    }
  };

  const columns: ColumnsType<VipRecord> = [
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      sorter: (a, b) => a.level - b.level,
      render: (v: number, r: VipRecord) => (
        <Space size={8}>
          {r.levelIcon ? (
            <Image
              src={resolveAssetUrl(r.levelIcon)}
              width={24}
              height={24}
              preview={false}
              style={{ borderRadius: 4, objectFit: 'cover' }}
            />
          ) : null}
          <Tag color="gold" style={{ background: r.levelColor }}>
            VIP {v}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'levelName',
      key: 'levelName',
      width: 140,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Min Recharge',
      dataIndex: 'minRecharge',
      key: 'minRecharge',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Min Bet',
      dataIndex: 'minBet',
      key: 'minBet',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Daily Reward',
      dataIndex: 'dailyReward',
      key: 'dailyReward',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Monthly Reward',
      dataIndex: 'monthlyReward',
      key: 'monthlyReward',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Rebate Rate',
      dataIndex: 'rebateRate',
      key: 'rebateRate',
      width: 110,
      render: (v: number) => formatPercent(Number(v) * 100, 2),
    },
    {
      title: 'Withdraw Limit',
      dataIndex: 'withdrawLimit',
      key: 'withdrawLimit',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: number) => <StatusBadge kind="config" status={s} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: VipRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openForm(record)}
          />
          <Popconfirm
            title="Delete this VIP level?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="VIP Configuration"
        subtitle={`${data.length} levels`}
        icon={<CrownOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchVipConfigs}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openForm()}
            >
              Add Level
            </Button>
          </Space>
        }
      />

      {!loading && data.length === 0 ? (
        <Empty description="No VIP levels configured. Add your first VIP level to define membership tiers and rewards.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openForm()}
          >
            Add First VIP Level
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
          className="modern-table"
          scroll={{ x: 1200 }}
        />
      )}

      <Modal
        title={
          editRecord ? `Edit VIP Level ${editRecord.level}` : 'Add VIP Level'
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        width={720}
        destroyOnHidden
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Card
            size="small"
            title="Level Info"
            style={{ marginBottom: 16, background: 'var(--bg-card-alt)' }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="level"
                  label="VIP Level"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  name="levelName"
                  label="Level Name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="e.g., Bronze, Silver, Gold" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="levelIcon"
                  label="Level Icon"
                  getValueFromEvent={(url: string) => {
                    setIconPreview(url);
                    return url;
                  }}
                >
                  <ImageUpload folder="icons" urlPlaceholder="/uploads/vip/icon.png" />
                </Form.Item>
              </Col>
              <Col
                xs={12}
                sm={8}
                md={4}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {iconPreview ? (
                  <Image
                    src={resolveAssetUrl(iconPreview)}
                    width={56}
                    height={56}
                    style={{
                      borderRadius: 10,
                      objectFit: 'cover',
                      border: '1px solid var(--border-default)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      border: '2px dashed var(--text-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <CrownOutlined style={{ fontSize: 22 }} />
                  </div>
                )}
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Form.Item
                  name="levelColor"
                  label="Accent Color"
                  getValueFromEvent={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) => {
                    const v = e.target.value;
                    setColorPreview(v);
                    return v;
                  }}
                >
                  <Input
                    type="color"
                    style={{ width: '100%', padding: 4, height: 40 }}
                    aria-label="Accent color"
                  />
                </Form.Item>
                <div
                  style={{
                    width: 32,
                    height: 12,
                    background: colorPreview,
                    borderRadius: 4,
                    margin: '0 auto',
                  }}
                />
              </Col>
            </Row>
          </Card>
          <Card
            size="small"
            title="Requirements"
            style={{ marginBottom: 16, background: 'var(--bg-card-alt)' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="minRecharge"
                  label="Min Cumulative Recharge"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    addonBefore="₹"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="minBet"
                  label="Min Cumulative Bet"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    addonBefore="₹"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card
            size="small"
            title="Rewards & Limits"
            style={{ background: 'var(--bg-card-alt)' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="dailyReward" label="Daily Reward">
                  <InputNumber
                    addonBefore="₹"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="monthlyReward" label="Monthly Reward">
                  <InputNumber
                    addonBefore="₹"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="rebateRate"
                  label="Rebate Rate (0.02 = 2%)"
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.001}
                    precision={4}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="withdrawLimit" label="Daily Withdraw Limit">
                  <InputNumber
                    addonBefore="₹"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default VipConfigPage;

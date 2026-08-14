import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Empty,
  Modal,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatPercent } from '../utils/format';
import { useConfigStore } from '../store/configStore';

interface CommissionRecord {
  id: number;
  level: number;
  rate: number;
  gameType: string | null;
  status: number;
}

const levelLabels: Record<number, string> = {
  1: 'L1 (Direct)',
  2: 'L2 (Indirect)',
  3: 'L3 (3rd Level)',
};

const ALL_GAMES_VALUE = '__all__';

const CommissionConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CommissionRecord | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const gameTypes = useConfigStore((s) => s.gameTypes);
  const fetchConfigMeta = useConfigStore((s) => s.fetchConfig);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get<
        unknown,
        CommissionRecord[] | { list?: CommissionRecord[] }
      >('commission/config');
      if (Array.isArray(res)) {
        setData(res);
      } else {
        setData(Array.isArray(res?.list) ? res.list : []);
      }
    } catch {
      message.error('Failed to load commission configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigMeta();
    fetchConfigs();
  }, []);

  const openForm = (record?: CommissionRecord) => {
    setEditRecord(record ? record : null);
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        ...record,
        gameType: record.gameType || ALL_GAMES_VALUE,
      });
    } else {
      form.setFieldsValue({
        status: 1,
        level: 1,
        rate: 0.05,
        gameType: ALL_GAMES_VALUE,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const gameType =
        values.gameType === ALL_GAMES_VALUE ? null : values.gameType;
      const duplicate = data.find(
        (d) =>
          d.id !== editRecord?.id &&
          d.level === values.level &&
          (d.gameType ? d.gameType : null) === gameType,
      );
      if (duplicate) {
        message.error(
          `A rule for ${levelLabels[values.level] || `Level ${values.level}`} + ${
            gameType ? gameType : 'All Games'
          } already exists`,
        );
        return;
      }
      setSaving(true);
      await api.post('commission/config', {
        ...values,
        gameType,
        id: editRecord?.id,
      });
      message.success(editRecord ? 'Updated' : 'Created');
      setModalOpen(false);
      fetchConfigs();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`commission/config/${id}`);
      message.success('Deleted');
      fetchConfigs();
    } catch {
      message.error('Delete failed');
    }
  };

  const gameTypeOptions = [
    { value: ALL_GAMES_VALUE, label: 'All Games' },
    ...gameTypes.map((g) => ({ value: g.value, label: g.label })),
  ];

  const columns: ColumnsType<CommissionRecord> = [
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 160,
      render: (l: number) => (
        <Tag color="purple">{levelLabels[l] || `Level ${l}`}</Tag>
      ),
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (v: number) => (
        <span className="text-purple">
          {formatPercent(Number(v) * 100, 2)}
        </span>
      ),
    },
    {
      title: 'Game Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 140,
      render: (t: string | null) => {
        if (!t) return <Tag color="blue">All Games</Tag>;
        const meta = gameTypes.find((g) => g.value === t);
        return <Tag>{meta?.label || t}</Tag>;
      },
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
      render: (_: unknown, record: CommissionRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openForm(record)}
          />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Commission Config"
        subtitle={`${data.length} rules`}
        icon={<ShareAltOutlined />}
        iconBg="var(--gradient-purple)"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openForm()}
            >
              Add
            </Button>
          </Space>
        }
      />

      {!loading && data.length === 0 ? (
        <Empty description="No commission rules configured. Set up referral commission rates for your affiliate system.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openForm()}
          >
            Add First Commission Rule
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
          scroll={{ x: 'max-content' }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Commission Rule' : 'Add Commission Rule'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="level"
                label="Referral Level"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 1, label: 'L1 - Direct Referral' },
                    { value: 2, label: 'L2 - Indirect Referral' },
                    { value: 3, label: 'L3 - 3rd Level Referral' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="rate"
                label="Commission Rate (0.02 = 2%)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="gameType"
            label="Game Type"
            rules={[{ required: true }]}
          >
            <Select options={gameTypeOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommissionConfigPage;

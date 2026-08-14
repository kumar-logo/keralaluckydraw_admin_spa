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
  Empty,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { formatPercent } from '../utils/format';

interface AwardRecord {
  id: number;
  awardName: string;
  awardType: string;
  minAmount: number;
  maxAmount: number;
  bonusRate: number;
  bonusFixed: number;
  maxBonus: number;
  sortOrder: number;
  status: number;
  startTime?: string | null;
  endTime?: string | null;
}

const typeOpts = [
  { value: 'first_recharge', label: 'First Recharge' },
  { value: 'daily_recharge', label: 'Daily Recharge' },
  { value: 'vip_recharge', label: 'VIP Recharge' },
  { value: 'weekend_bonus', label: 'Weekend Bonus' },
];

const typeColors: Record<string, string | undefined> = {
  first_recharge: 'green',
  daily_recharge: 'blue',
  vip_recharge: 'gold',
  weekend_bonus: 'purple',
};

const RechargeAwardsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AwardRecord[]>([]);
  const [filtered, setFiltered] = useState<AwardRecord[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AwardRecord | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const applyFilter = (list: AwardRecord[], type?: string) => {
    if (!type) {
      setFiltered(list);
      return;
    }
    setFiltered(list.filter((a) => a.awardType === type));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, AwardRecord[] | null>(
        'recharge-awards',
      );
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilter(list, filterType);
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load recharge awards';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTypeFilter = (v: string | undefined) => {
    setFilterType(v);
    applyFilter(data, v);
  };

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      awardType: 'first_recharge',
      minAmount: 100,
      maxAmount: 999999,
      bonusRate: 0.05,
      bonusFixed: 0,
      maxBonus: 5000,
      sortOrder: 0,
      status: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (r: AwardRecord) => {
    setEditRecord(r);
    form.setFieldsValue({
      ...r,
      startTime: r.startTime ? dayjs(r.startTime) : undefined,
      endTime: r.endTime ? dayjs(r.endTime) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('recharge-awards', {
        ...values,
        startTime: values.startTime
          ? dayjs(values.startTime).toISOString()
          : null,
        endTime: values.endTime ? dayjs(values.endTime).toISOString() : null,
        id: editRecord?.id,
      });
      message.success(editRecord ? 'Award updated' : 'Award created');
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
      await api.delete(`recharge-awards/${id}`);
      message.success('Award deleted');
      fetchData();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to delete';
      message.error(m);
    }
  };

  const columns: ColumnsType<AwardRecord> = [
    { title: 'Name', dataIndex: 'awardName', key: 'awardName', width: 200 },
    {
      title: 'Type',
      dataIndex: 'awardType',
      key: 'awardType',
      width: 140,
      render: (v: string) => (
        <Tag color={typeColors[v]}>{v?.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Amount Range',
      key: 'range',
      width: 200,
      render: (_: unknown, r: AwardRecord) => (
        <span>
          <MoneyText value={r.minAmount} variant="neutral" /> –{' '}
          <MoneyText value={r.maxAmount} variant="neutral" />
        </span>
      ),
    },
    {
      title: 'Bonus Rate',
      dataIndex: 'bonusRate',
      key: 'bonusRate',
      width: 110,
      render: (v: number) => (
        <span className="text-primary-c">
          {formatPercent(Number(v) * 100, 1)}
        </span>
      ),
    },
    {
      title: 'Bonus Fixed',
      dataIndex: 'bonusFixed',
      key: 'bonusFixed',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Max Bonus',
      dataIndex: 'maxBonus',
      key: 'maxBonus',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    { title: 'Order', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
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
      render: (_: unknown, r: AwardRecord) => (
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
            title="Delete this award?"
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
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

  return (
    <div className="page-container">
      <PageHeader
        title="Recharge Awards"
        subtitle={`${filtered.length} awards configured`}
        icon={<GiftOutlined />}
        iconBg="var(--gradient-green)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Award
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="180px">
            <Select
              placeholder="Award Type"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTypeFilter}
              value={filterType}
              options={typeOpts}
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
        <Empty description="No recharge bonus tiers configured. Create bonus rules to reward user deposits.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add First Recharge Award
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
          scroll={{ x: 900 }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Recharge Award' : 'Add Recharge Award'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="awardName"
                label="Award Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="awardType"
                label="Award Type"
                rules={[{ required: true }]}
              >
                <Select options={typeOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="minAmount"
                label="Min Amount"
                rules={[{ required: true }]}
              >
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="maxAmount" label="Max Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="bonusRate"
                label="Bonus Rate (0.02 = 2%)"
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
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="bonusFixed" label="Fixed Bonus">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="maxBonus" label="Max Bonus">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="startTime" label="Start Date (optional)">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endTime" label="End Date (optional)">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
            getValueProps={(v) => ({ checked: v === 1 })}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RechargeAwardsPage;

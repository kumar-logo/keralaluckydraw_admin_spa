import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
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
  Empty,
  Card,
  Statistic,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatMoney } from '../utils/format';

interface CheckinConfigRecord {
  id: number;
  dayNum: number;
  awardType: string;
  awardNum: number;
  status: number;
}

interface CheckinUserRecord {
  id: number;
  userId: string;
  username: string;
  dayNum: number;
  awardNum: number;
  createdAt: string;
}

const typeColors: Record<string, string | undefined> = {
  chip: 'gold',
  coupon: 'green',
  spin: 'purple',
};

const CheckinConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckinConfigRecord[]>([]);
  const [filtered, setFiltered] = useState<CheckinConfigRecord[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CheckinConfigRecord | null>(
    null,
  );
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [records, setRecords] = useState<CheckinUserRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordSummary, setRecordSummary] = useState({
    totalClaims: 0,
    totalAmount: 0,
    uniqueUsers: 0,
  });

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await api.get<
        unknown,
        {
          records: CheckinUserRecord[];
          totalClaims: number;
          totalAmount: number;
          uniqueUsers: number;
        }
      >('checkin/records');
      setRecords(Array.isArray(res.records) ? res.records : []);
      setRecordSummary({
        totalClaims: res.totalClaims,
        totalAmount: res.totalAmount,
        uniqueUsers: res.uniqueUsers,
      });
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load check-in records';
      message.error(m);
    } finally {
      setRecordsLoading(false);
    }
  };

  const applyFilter = (list: CheckinConfigRecord[], type?: string) => {
    if (!type) {
      setFiltered(list);
      return;
    }
    setFiltered(list.filter((c) => c.awardType === type));
  };

  const fetchCheckinConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, CheckinConfigRecord[] | null>(
        'checkin/config',
      );
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilter(list, filterType);
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load check-in config';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckinConfig();
    fetchRecords();
  }, []);

  const handleTypeFilter = (v: string | undefined) => {
    setFilterType(v);
    applyFilter(data, v);
  };

  const openCreateModal = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      dayNum: 1,
      awardType: 'chip',
      awardNum: 0,
      status: 1,
    });
    setModalOpen(true);
  };
  const openEditModal = (record: CheckinConfigRecord) => {
    setEditRecord(record);
    form.setFieldsValue({
      dayNum: record.dayNum,
      awardType: record.awardType,
      awardNum: record.awardNum,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('checkin/config', { ...values, id: editRecord?.id });
      message.success(
        editRecord ? 'Check-in config updated' : 'Check-in config created',
      );
      setModalOpen(false);
      fetchCheckinConfig();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`checkin/config/${id}`);
      message.success('Check-in config deleted');
      fetchCheckinConfig();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to delete config';
      message.error(m);
    }
  };

  const totalReward = filtered.reduce((sum, c) => sum + c.awardNum, 0);

  const renderAwardAmount = (type: string, value: number) => {
    if (type === 'chip') {
      return <MoneyText value={value} variant="positive" />;
    }
    if (type === 'spin') {
      return (
        <span className="amount-positive">{Number(value)} × spins</span>
      );
    }
    return <span className="amount-positive">{Number(value)}</span>;
  };

  const columns: ColumnsType<CheckinConfigRecord> = [
    {
      title: 'Day',
      dataIndex: 'dayNum',
      key: 'dayNum',
      width: 100,
      sorter: (a, b) => a.dayNum - b.dayNum,
      defaultSortOrder: 'ascend',
      render: (v: number) => <Tag color="blue">Day {v}</Tag>,
    },
    {
      title: 'Award Type',
      dataIndex: 'awardType',
      key: 'awardType',
      width: 130,
      render: (val: string) => <Tag color={typeColors[val]}>{val}</Tag>,
    },
    {
      title: 'Award Amount',
      key: 'awardNum',
      width: 160,
      render: (_: unknown, r: CheckinConfigRecord) =>
        renderAwardAmount(r.awardType, r.awardNum),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: number) => <StatusBadge kind="config" status={val} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: CheckinConfigRecord) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this config?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
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

  const recordColumns: ColumnsType<CheckinUserRecord> = [
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (v: string, r: CheckinUserRecord) => (
        <span>
          {v}{' '}
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            ({r.userId})
          </span>
        </span>
      ),
    },
    {
      title: 'Day',
      dataIndex: 'dayNum',
      key: 'dayNum',
      width: 90,
      render: (v: number) => <Tag color="blue">Day {v}</Tag>,
    },
    {
      title: 'Claimed Amount',
      dataIndex: 'awardNum',
      key: 'awardNum',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 190,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Check-in Config"
        subtitle={`${filtered.length} day configs | Total reward: ${formatMoney(totalReward)}`}
        icon={<CalendarOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add Day Config
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="160px">
            <Select
              placeholder="Award Type"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTypeFilter}
              value={filterType}
              options={[
                { value: 'chip', label: 'Chip' },
                { value: 'coupon', label: 'Coupon' },
                { value: 'spin', label: 'Spin' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchCheckinConfig} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No check-in rewards configured. Set up daily check-in rewards to encourage user retention.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add First Day Config
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
          scroll={{ x: 700 }}
        />
      )}

      <Divider orientation="left" style={{ marginTop: 32 }}>
        User Check-ins
      </Divider>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Total Claims" value={recordSummary.totalClaims} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Unique Users"
              value={recordSummary.uniqueUsers}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Claimed"
              value={recordSummary.totalAmount}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button icon={<ReloadOutlined />} onClick={fetchRecords}>
          Refresh
        </Button>
      </div>
      {!recordsLoading && records.length === 0 ? (
        <Empty description="No check-in claims yet." />
      ) : (
        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          loading={recordsLoading}
          className="modern-table"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 700 }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Check-in Config' : 'Add Check-in Config'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="dayNum"
                label="Day Number"
                rules={[{ required: true, message: 'Please enter day number' }]}
              >
                <InputNumber min={1} max={7} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="awardType"
                label="Award Type"
                rules={[
                  { required: true, message: 'Please select award type' },
                ]}
              >
                <Select
                  options={[
                    { value: 'chip', label: 'Chip' },
                    { value: 'coupon', label: 'Coupon' },
                    { value: 'spin', label: 'Spin' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev.awardType !== curr.awardType
                }
              >
                {({ getFieldValue }) => {
                  const t = getFieldValue('awardType') as string;
                  return (
                    <Form.Item
                      name="awardNum"
                      label={t === 'spin' ? 'Spins' : 'Award Amount'}
                      rules={[
                        {
                          required: true,
                          message: 'Please enter award amount',
                        },
                      ]}
                    >
                      <InputNumber
                        addonBefore={t === 'chip' ? '₹' : undefined}
                        addonAfter={t === 'spin' ? '× spins' : undefined}
                        min={0}
                        step={t === 'spin' ? 1 : 0.01}
                        precision={t === 'spin' ? 0 : 2}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? 1 : 0)}
                getValueProps={(val) => ({ checked: val === 1 })}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CheckinConfigPage;

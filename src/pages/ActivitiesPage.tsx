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
  DatePicker,
  Image,
  Popconfirm,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  Empty,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ImageUpload from '../components/ImageUpload';
import { formatDateTimeShort } from '../utils/format';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';
import MoneyText from '../components/MoneyText';
import { resolveAssetUrl } from '../utils/assetUrl';

type ActivityType =
  | 'checkin'
  | 'recharge_bonus'
  | 'referral'
  | 'spin'
  | 'custom';

interface ActivityRecord {
  id: number;
  activityName: string;
  activityType: ActivityType | string;
  description: string;
  imageUrl: string;
  configJson: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  status: number;
}

interface CheckinRewardRow {
  day: number;
  amount: number;
}

interface ActivityConfig {
  bonusRate?: number;
  minAmount?: number;
  maxBonus?: number;
  checkinRewards?: CheckinRewardRow[];
}

interface ActivityFormValues {
  activityName: string;
  activityType: string;
  description?: string;
  imageUrl?: string;
  config?: ActivityConfig;
  sortOrder: number;
  status: number;
  startTime?: dayjs.Dayjs | null;
  endTime?: dayjs.Dayjs | null;
}

const typeColors: Record<string, string | undefined> = {
  checkin: 'blue',
  recharge_bonus: 'green',
  referral: 'orange',
  spin: 'purple',
  custom: 'cyan',
};

const DEFAULT_CHECKIN_ROWS: CheckinRewardRow[] = Array.from(
  { length: 7 },
  (_, i) => ({ day: i + 1, amount: 0 }),
);

const parseConfig = (raw: unknown): ActivityConfig => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as ActivityConfig;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ActivityConfig;
    } catch {
      return {};
    }
  }
  return {};
};

const ActivitiesPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ActivityRecord[]>([]);
  const [filtered, setFiltered] = useState<ActivityRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ActivityRecord | null>(null);
  const [form] = Form.useForm<ActivityFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeType, setActiveType] = useState<string>('custom');

  const applyFilters = (list: ActivityRecord[], q: string, type?: string) => {
    let result = list;
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(
        (a) =>
          a.activityName?.toLowerCase().includes(lq) ||
          a.description?.toLowerCase().includes(lq),
      );
    }
    if (type) result = result.filter((a) => a.activityType === type);
    setFiltered(result);
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, ActivityRecord[]>('activities');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilters(list, search, filterType);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load activities'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    applyFilters(data, v, filterType);
  };
  const handleTypeFilter = (v: string | undefined) => {
    setFilterType(v);
    applyFilters(data, search, v);
  };

  const openCreateModal = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0,
      status: 1,
      activityType: 'custom',
      config: {},
    });
    setActiveType('custom');
    setModalOpen(true);
  };
  const openEditModal = (record: ActivityRecord) => {
    setEditRecord(record);
    const configObj = parseConfig(record.configJson);
    if (
      record.activityType === 'checkin' &&
      (!configObj.checkinRewards || configObj.checkinRewards.length === 0)
    ) {
      configObj.checkinRewards = DEFAULT_CHECKIN_ROWS;
    }
    form.setFieldsValue({
      activityName: record.activityName,
      activityType: record.activityType,
      description: record.description,
      imageUrl: record.imageUrl,
      config: configObj,
      sortOrder: record.sortOrder,
      status: record.status,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null,
    });
    setActiveType(String(record.activityType));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const configObj: Record<string, unknown> = { ...values.config };
      const cleanConfig: Record<string, unknown> = {};
      Object.entries(configObj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanConfig[k] = v;
      });
      const { config: _config, ...rest } = values;
      void _config;
      const payload = {
        ...rest,
        configJson: JSON.stringify(cleanConfig),
        id: editRecord?.id,
        startTime: values.startTime
          ? values.startTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
        endTime: values.endTime
          ? values.endTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
      };
      await api.post('activities', payload);
      message.success(editRecord ? 'Activity updated' : 'Activity created');
      setModalOpen(false);
      fetchActivities();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save activity'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`activities/${id}`);
      message.success('Activity deleted');
      fetchActivities();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete activity'));
    }
  };

  const columns: ColumnsType<ActivityRecord> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) =>
        url ? (
          <Image
            src={resolveAssetUrl(url)}
            width={60}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iMzAiIHk9IjIzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4IiBmb250LXNpemU9IjEwIj5OL0E8L3RleHQ+PC9zdmc+"
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 40,
              borderRadius: 8,
              background: 'var(--bg-card-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'var(--text-muted)',
            }}
          >
            N/A
          </div>
        ),
    },
    {
      title: 'Name',
      dataIndex: 'activityName',
      key: 'activityName',
      width: 200,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 130,
      render: (val: string) => (
        <Tag color={typeColors[val]}>{val?.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Sort',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: 'Schedule',
      key: 'schedule',
      width: 240,
      render: (_: unknown, r: ActivityRecord) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {r.startTime || r.endTime
            ? `${formatDateTimeShort(r.startTime)} → ${formatDateTimeShort(r.endTime)}`
            : '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val: number) => <StatusBadge kind="config" status={val} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: ActivityRecord) => (
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
            title="Delete this activity?"
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

  return (
    <div className="page-container">
      <PageHeader
        title="Activities"
        subtitle={`${filtered.length} activities`}
        icon={<GiftOutlined />}
        iconBg="var(--gradient-green)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Create Activity
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search by name..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="170px">
            <Select
              placeholder="Activity Type"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTypeFilter}
              value={filterType}
              options={[
                { value: 'checkin', label: 'Check-in' },
                { value: 'recharge_bonus', label: 'Recharge Bonus' },
                { value: 'referral', label: 'Referral' },
                { value: 'spin', label: 'Spin' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchActivities} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No activities. Create a check-in, referral or recharge bonus to engage users.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add First Activity
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
          scroll={{ x: 1180 }}
          locale={{ emptyText: <Empty description="No activities" /> }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Activity' : 'Create Activity'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={680}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          onValuesChange={(changed) => {
            if (changed.activityType) setActiveType(String(changed.activityType));
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name="activityName"
                label="Activity Name"
                rules={[
                  { required: true, message: 'Please enter activity name' },
                ]}
              >
                <Input placeholder="Activity name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="activityType"
                label="Activity Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select
                  options={[
                    { value: 'checkin', label: 'Check-in' },
                    { value: 'recharge_bonus', label: 'Recharge Bonus' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'spin', label: 'Spin' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Activity description" />
          </Form.Item>
          <Form.Item name="imageUrl" label="Activity Image">
            <ImageUpload folder="activities" />
          </Form.Item>

          {activeType === 'checkin' ? (
            <Card
              size="small"
              title="7-Day Check-in Rewards"
              style={{ marginBottom: 16 }}
            >
              <Form.List
                name={['config', 'checkinRewards']}
                initialValue={DEFAULT_CHECKIN_ROWS}
              >
                {(fields) => (
                  <Row gutter={[12, 12]}>
                    {fields.map(({ key, ...field }, idx) => (
                      <Col xs={24} sm={12} md={8} key={key}>
                        <Form.Item
                          {...field}
                          label={`Day ${idx + 1}`}
                          name={[field.name, 'amount']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonBefore="₹"
                          />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                )}
              </Form.List>
              <Form.Item
                shouldUpdate={(prev, cur) =>
                  prev?.config?.checkinRewards !== cur?.config?.checkinRewards
                }
                noStyle
              >
                {({ getFieldValue }) => {
                  const rawRows: unknown = getFieldValue([
                    'config',
                    'checkinRewards',
                  ]);
                  const rows: Partial<CheckinRewardRow>[] = Array.isArray(
                    rawRows,
                  )
                    ? rawRows
                    : [];
                  const total = rows.reduce(
                    (s, r) => s + Number(r?.amount ?? 0),
                    0,
                  );
                  return (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}
                    >
                      7-day total: <MoneyText value={total} variant="neutral" />
                    </div>
                  );
                }}
              </Form.Item>
            </Card>
          ) : (
            <>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                Configuration
              </div>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name={['config', 'bonusRate']} label="Bonus %">
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="e.g., 5"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name={['config', 'minAmount']} label="Min Amount">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="e.g., 100"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name={['config', 'maxBonus']} label="Max Bonus">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="e.g., 500"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="startTime" label="Start Time">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endTime" label="End Time">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
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

export default ActivitiesPage;

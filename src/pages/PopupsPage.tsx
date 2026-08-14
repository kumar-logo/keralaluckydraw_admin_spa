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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  NotificationOutlined,
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
import { resolveAssetUrl } from '../utils/assetUrl';

interface PopupRecord {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
  popupType: string;
  frequency: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  status: number;
}

interface PopupFormValues {
  title: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  popupType: string;
  frequency: string;
  sortOrder: number;
  status: number;
  startTime?: dayjs.Dayjs | null;
  endTime?: dayjs.Dayjs | null;
}

const typeColors: Record<string, string | undefined> = {
  home: 'blue',
  login: 'green',
  game: 'orange',
};
const freqColors: Record<string, string | undefined> = {
  once: 'cyan',
  daily: 'purple',
  always: 'magenta',
};

const PopupsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PopupRecord[]>([]);
  const [filtered, setFiltered] = useState<PopupRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterFreq, setFilterFreq] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PopupRecord | null>(null);
  const [form] = Form.useForm<PopupFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const applyFilters = (
    list: PopupRecord[],
    q: string,
    type?: string,
    freq?: string,
  ) => {
    let result = list;
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(lq) ||
          p.content?.toLowerCase().includes(lq),
      );
    }
    if (type) result = result.filter((p) => p.popupType === type);
    if (freq) result = result.filter((p) => p.frequency === freq);
    setFiltered(result);
  };

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, PopupRecord[]>('popups');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilters(list, search, filterType, filterFreq);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load popups'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    applyFilters(data, v, filterType, filterFreq);
  };
  const handleTypeFilter = (v: string | undefined) => {
    setFilterType(v);
    applyFilters(data, search, v, filterFreq);
  };
  const handleFreqFilter = (v: string | undefined) => {
    setFilterFreq(v);
    applyFilters(data, search, filterType, v);
  };

  const openCreateModal = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0,
      status: 1,
      popupType: 'home',
      frequency: 'always',
    });
    setModalOpen(true);
  };
  const openEditModal = (record: PopupRecord) => {
    setEditRecord(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      imageUrl: record.imageUrl,
      linkUrl: record.linkUrl,
      popupType: record.popupType,
      frequency: record.frequency,
      sortOrder: record.sortOrder,
      status: record.status,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const payload = {
        ...values,
        id: editRecord?.id,
        startTime: values.startTime
          ? values.startTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
        endTime: values.endTime
          ? values.endTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
      };
      await api.post('popups', payload);
      message.success(editRecord ? 'Popup updated' : 'Popup created');
      setModalOpen(false);
      fetchPopups();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save popup'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`popups/${id}`);
      message.success('Popup deleted');
      fetchPopups();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete popup'));
    }
  };

  const columns: ColumnsType<PopupRecord> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
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
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Type / Frequency',
      key: 'typeFreq',
      width: 180,
      render: (_: unknown, r: PopupRecord) => (
        <Space size={4} wrap>
          <Tag color={typeColors[r.popupType]}>{r.popupType}</Tag>
          <Tag color={freqColors[r.frequency]}>{r.frequency}</Tag>
        </Space>
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
      render: (_: unknown, r: PopupRecord) => (
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
      render: (_: unknown, record: PopupRecord) => (
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
            title="Delete this popup?"
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
        title="Popups"
        subtitle={`${filtered.length} popups`}
        icon={<NotificationOutlined />}
        iconBg="var(--gradient-purple)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Create Popup
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search by title..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Type"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTypeFilter}
              value={filterType}
              options={[
                { value: 'home', label: 'Home' },
                { value: 'login', label: 'Login' },
                { value: 'game', label: 'Game' },
              ]}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Frequency"
              allowClear
              style={{ width: '100%' }}
              onChange={handleFreqFilter}
              value={filterFreq}
              options={[
                { value: 'once', label: 'Once' },
                { value: 'daily', label: 'Daily' },
                { value: 'always', label: 'Always' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchPopups} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No popups configured. Create a popup to greet users on launch.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add First Popup
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
          locale={{ emptyText: <Empty description="No popups" /> }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Popup' : 'Create Popup'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Popup title" />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={3} placeholder="Popup content" />
          </Form.Item>
          <Form.Item name="imageUrl" label="Popup Image">
            <ImageUpload folder="popups" />
          </Form.Item>
          <Form.Item name="linkUrl" label="Link URL">
            <Input placeholder="Link URL (optional)" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="popupType"
                label="Popup Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select
                  options={[
                    { value: 'home', label: 'Home' },
                    { value: 'login', label: 'Login' },
                    { value: 'game', label: 'Game' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="frequency"
                label="Frequency"
                rules={[{ required: true, message: 'Please select frequency' }]}
              >
                <Select
                  options={[
                    { value: 'once', label: 'Once' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'always', label: 'Always' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
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

export default PopupsPage;

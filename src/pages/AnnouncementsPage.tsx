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
  Empty,
  DatePicker,
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
import { formatDateTime } from '../utils/format';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';

interface AnnouncementRecord {
  id: number;
  title: string;
  content: string;
  announcementType: string;
  sortOrder: number;
  status: number;
  createdAt?: string;
  startTime?: string | null;
  endTime?: string | null;
}

interface AnnouncementFormValues {
  title: string;
  content: string;
  announcementType: string;
  sortOrder: number;
  status: number;
  startTime?: dayjs.Dayjs | null;
  endTime?: dayjs.Dayjs | null;
}

const typeColors: Record<string, string | undefined> = {
  notice: 'blue',
  alert: 'red',
  promotion: 'green',
  maintenance: 'orange',
  marquee: 'purple',
};

const AnnouncementsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnnouncementRecord[]>([]);
  const [filtered, setFiltered] = useState<AnnouncementRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AnnouncementRecord | null>(null);
  const [form] = Form.useForm<AnnouncementFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, AnnouncementRecord[]>('announcements');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilters(list, search, filterType);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load announcements'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    list: AnnouncementRecord[],
    q: string,
    type?: string,
  ) => {
    let result = list;
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(lq) ||
          a.content?.toLowerCase().includes(lq),
      );
    }
    if (type) result = result.filter((a) => a.announcementType === type);
    setFiltered(result);
  };

  useEffect(() => {
    fetchAnnouncements();
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
      announcementType: 'notice',
      startTime: null,
      endTime: null,
    });
    setModalOpen(true);
  };
  const openEditModal = (record: AnnouncementRecord) => {
    setEditRecord(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      announcementType: record.announcementType,
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
        startTime: values.startTime
          ? values.startTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
        endTime: values.endTime
          ? values.endTime.format('YYYY-MM-DD HH:mm:ss')
          : null,
      };
      if (editRecord) {
        await api.put(`announcements/${editRecord.id}`, payload);
        message.success('Announcement updated');
      } else {
        await api.post('announcements', payload);
        message.success('Announcement created');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save announcement'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`announcements/${id}`);
      message.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete announcement'));
    }
  };

  const columns: ColumnsType<AnnouncementRecord> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      width: 280,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'announcementType',
      key: 'announcementType',
      width: 110,
      render: (val: string) => (
        <Tag color={typeColors[val]}>{val}</Tag>
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a, b) =>
        (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
        (b.createdAt ? new Date(b.createdAt).getTime() : 0),
      render: (t: string | undefined) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDateTime(t)}
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
      render: (_: unknown, record: AnnouncementRecord) => (
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
            title="Delete this announcement?"
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
        title="Announcements"
        subtitle={`${filtered.length} announcements`}
        icon={<NotificationOutlined />}
        iconBg="var(--gradient-blue)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Create Announcement
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="260px">
            <Input.Search
              placeholder="Search by title or content..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="160px">
            <Select
              placeholder="Type"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTypeFilter}
              value={filterType}
              options={[
                { value: 'notice', label: 'Notice' },
                { value: 'alert', label: 'Alert' },
                { value: 'promotion', label: 'Promotion' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'marquee', label: 'Marquee' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchAnnouncements} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No announcements. Create one to broadcast a notice to users.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add First Announcement
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
          scroll={{ x: 1080 }}
          locale={{ emptyText: <Empty description="No announcements" /> }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Announcement' : 'Create Announcement'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={620}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Announcement title" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea rows={4} placeholder="Announcement content" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="startTime" label="Valid From (optional)">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endTime" label="Valid Until (optional)">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="announcementType"
                label="Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'notice', label: 'Notice' },
                    { value: 'alert', label: 'Alert' },
                    { value: 'promotion', label: 'Promotion' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'marquee', label: 'Marquee' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
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

export default AnnouncementsPage;

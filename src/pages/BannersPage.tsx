import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Image,
  Popconfirm,
  Space,
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
  PictureOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ImageUpload from '../components/ImageUpload';
import { formatDateTimeShort, orDash } from '../utils/format';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';

interface BannerRecord {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  sortOrder: number;
  status: number;
  startTime?: string | null;
  endTime?: string | null;
}

interface BannerFormValues {
  title: string;
  imageUrl: string;
  link?: string;
  sortOrder: number;
  status: number;
  startTime?: dayjs.Dayjs | null;
  endTime?: dayjs.Dayjs | null;
}

const BannersPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BannerRecord[]>([]);
  const [filtered, setFiltered] = useState<BannerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BannerRecord | null>(null);
  const [form] = Form.useForm<BannerFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, BannerRecord[]>('banners');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilter(list, search);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load banners'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (list: BannerRecord[], q: string) => {
    if (!q) {
      setFiltered(list);
      return;
    }
    const lq = q.toLowerCase();
    setFiltered(
      list.filter(
        (b) =>
          b.title?.toLowerCase().includes(lq) ||
          b.link?.toLowerCase().includes(lq),
      ),
    );
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    applyFilter(data, v);
  };

  const openCreateModal = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0,
      status: 1,
      startTime: null,
      endTime: null,
    });
    setModalOpen(true);
  };
  const openEditModal = (record: BannerRecord) => {
    setEditRecord(record);
    form.setFieldsValue({
      title: record.title,
      imageUrl: record.imageUrl,
      link: record.link,
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
        await api.put(`banners/${editRecord.id}`, payload);
        message.success('Banner updated');
      } else {
        await api.post('banners', payload);
        message.success('Banner created');
      }
      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save banner'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`banners/${id}`);
      message.success('Banner deleted');
      fetchBanners();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete banner'));
    }
  };

  const columns: ColumnsType<BannerRecord> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) =>
        url ? (
          <Image
            src={resolveAssetUrl(url)}
            width={80}
            height={45}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNDAiIHk9IjI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4IiBmb250LXNpemU9IjEwIj5OL0E8L3RleHQ+PC9zdmc+"
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 45,
              borderRadius: 8,
              background: 'var(--bg-card-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            N/A
          </div>
        ),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      width: 200,
      ellipsis: true,
      render: (val: string) => orDash(val),
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
      width: 220,
      render: (_: unknown, r: BannerRecord) => (
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
      width: 160,
      render: (_: unknown, record: BannerRecord) => (
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
            title="Delete this banner?"
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
        title="Banners"
        subtitle={`${filtered.length} banners`}
        icon={<PictureOutlined />}
        iconBg="var(--gradient-pink)"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Create Banner
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="260px">
            <Input.Search
              placeholder="Search by title..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchBanners} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No banners created. Add promotional banners to display on the app.">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add First Banner
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
          locale={{ emptyText: <Empty description="No banners" /> }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Banner' : 'Create Banner'}
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
            <Input placeholder="Banner title" />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="Banner Image"
            rules={[{ required: true, message: 'Please upload an image' }]}
          >
            <ImageUpload folder="banners" />
          </Form.Item>
          <Form.Item name="link" label="Link">
            <Input placeholder="Link URL (optional)" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="startTime" label="Start Time (optional)">
                <DatePicker showTime={{ use12Hours: true, format: 'hh:mm A' }} format="YYYY-MM-DD hh:mm A" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="endTime" label="End Time (optional)">
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

export default BannersPage;

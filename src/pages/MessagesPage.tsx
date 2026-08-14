import { useState, useEffect, useRef, useCallback, type Key } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Spin,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Empty,
  Image,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MailOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import MultiImageUpload from '../components/MultiImageUpload';
import { resolveAssetUrl } from '../utils/assetUrl';
import { formatDateTime, orDash } from '../utils/format';

const { TextArea } = Input;

interface MessageRecord {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  type: string;
  targetUserId: string | null;
  status: number;
  createdAt: string;
}

interface MessagesListResponse {
  list: MessageRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

type SendTarget = 'all' | 'specific';

interface MessageFormValues {
  title: string;
  content: string;
  type: string;
  sendTarget: SendTarget;
  targetUserId?: string;
  imageUrls?: string[];
}

interface UserPickerRecord {
  userId: string;
  phone: string;
  nickname: string;
}

interface UsersListResponse {
  list: UserPickerRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface UserOption {
  value: string;
  label: string;
}

const typeColors: Record<string, string | undefined> = {
  system: 'blue',
  promotion: 'green',
  alert: 'red',
  notification: 'orange',
};

const MESSAGE_STATUS_TEXT: Record<number, string> = {
  0: 'Unread',
  1: 'Read',
  2: 'Archived',
};

const MessagesPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MessageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<MessageFormValues>();
  const [saving, setSaving] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendTarget>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUserOptions = useCallback(async (q: string) => {
    setUserSearching(true);
    try {
      const res = await api.post<unknown, UsersListResponse>('users/list', {
        pageNo: 1,
        pageSize: 20,
        search: q ? q : undefined,
      });
      setUserOptions(
        res.list.map((u) => ({
          value: u.userId,
          label: `${orDash(u.phone)} · ${orDash(u.nickname)} (${u.userId})`,
        })),
      );
    } catch {
      setUserOptions([]);
    } finally {
      setUserSearching(false);
    }
  }, []);

  const handleUserSearch = useCallback(
    (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        fetchUserOptions(q.trim());
      }, 300);
    },
    [fetchUserOptions],
  );

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const fetchMessages = async (
    page = pageNo,
    size = pageSize,
    q = search,
    type = filterType,
  ) => {
    setLoading(true);
    try {
      const res = await api.post<unknown, MessagesListResponse>(
        'messages/list',
        {
          pageNo: page,
          pageSize: size,
          search: q ? q : undefined,
          type: type ? type : undefined,
        },
      );
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch {
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPageNo(1);
    fetchMessages(1, pageSize, v, filterType);
  };
  const handleTypeFilter = (v: string | undefined) => {
    setFilterType(v);
    setPageNo(1);
    fetchMessages(1, pageSize, search, v);
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ type: 'system', sendTarget: 'all' });
    setSendTarget('all');
    setUserOptions([]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    let values: MessageFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const payload: {
        title: string;
        content: string;
        type: string;
        targetUserId?: string;
        imageUrls?: string[];
      } = {
        title: values.title,
        content: values.content,
        type: values.type,
      };
      if (values.sendTarget === 'specific' && values.targetUserId) {
        payload.targetUserId = values.targetUserId;
      }
      if (values.imageUrls && values.imageUrls.length > 0) {
        payload.imageUrls = values.imageUrls;
      }
      await api.post('messages/create', payload);
      message.success('Message created');
      setModalOpen(false);
      fetchMessages();
    } catch {
      message.error('Failed to create message');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`messages/${id}`);
      message.success('Deleted');
      setSelectedRowKeys((keys) => keys.filter((k) => k !== id));
      fetchMessages();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await api.post('messages/bulk-delete', {
        ids: selectedRowKeys.map(Number),
      });
      message.success(`Deleted ${selectedRowKeys.length} message(s)`);
      setSelectedRowKeys([]);
      fetchMessages();
    } catch {
      message.error('Bulk delete failed');
    }
  };

  const columns: ColumnsType<MessageRecord> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 72,
      render: (url: string | null | undefined) =>
        url ? (
          <Image
            src={resolveAssetUrl(url)}
            width={44}
            height={44}
            style={{ objectFit: 'cover', borderRadius: 6 }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      width: 320,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (t: string) => <Tag color={typeColors[t]}>{t}</Tag>,
    },
    {
      title: 'Audience',
      dataIndex: 'targetUserId',
      key: 'targetUserId',
      width: 140,
      render: (uid: string | null) =>
        uid ? (
          <span className="mono">{uid}</span>
        ) : (
          <Tag color="blue">All Users</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: number) => (
        <StatusBadge
          kind="message"
          status={s}
          fallbackText={MESSAGE_STATUS_TEXT[s] ?? String(s)}
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t: string) => formatDateTime(t),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: MessageRecord) => (
        <Popconfirm
          title="Delete this message?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="System Messages"
        subtitle={`${total} messages`}
        icon={<MailOutlined />}
        iconBg="var(--gradient-blue)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Message
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="220px">
            <Input.Search
              placeholder="Search title or user..."
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
                { value: 'system', label: 'System' },
                { value: 'promotion', label: 'Promotion' },
                { value: 'alert', label: 'Alert' },
                { value: 'notification', label: 'Notification' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchMessages()}
              />
            </Tooltip>
          </Col>
          {selectedRowKeys.length > 0 && (
            <Col>
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} selected message(s)?`}
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={handleBulkDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </Col>
          )}
        </Row>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={data}
        className="modern-table"
        scroll={{ x: 1180 }}
        locale={{ emptyText: <Empty description="No messages" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} messages`,
          onChange: (p, s) => {
            setPageNo(p);
            setPageSize(s);
            fetchMessages(p, s);
          },
        }}
      />

      <Modal
        title="Create System Message"
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Message title" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} placeholder="Message content" />
          </Form.Item>
          <Form.Item
            name="imageUrls"
            label="Images (optional)"
            tooltip="Shown in the app notification and sent as the push-notification picture. The first image is the cover."
          >
            <MultiImageUpload folder="notifications" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'system', label: 'System' },
                { value: 'promotion', label: 'Promotion' },
                { value: 'alert', label: 'Alert' },
                { value: 'notification', label: 'Notification' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="sendTarget"
            label="Send To"
            rules={[{ required: true }]}
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              onChange={(e) => {
                const next = e.target.value as SendTarget;
                setSendTarget(next);
                if (next === 'all') {
                  form.setFieldsValue({ targetUserId: undefined });
                }
              }}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'specific', label: 'Specific User' },
              ]}
            />
          </Form.Item>
          {sendTarget === 'specific' && (
            <Form.Item
              name="targetUserId"
              label="Recipient"
              rules={[{ required: true, message: 'Please select a user' }]}
            >
              <Select
                showSearch
                filterOption={false}
                placeholder="Search by phone, nickname or user ID"
                onSearch={handleUserSearch}
                options={userOptions}
                notFoundContent={
                  userSearching ? (
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <Spin size="small" />
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Type to search users"
                    />
                  )
                }
                allowClear
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MessagesPage;

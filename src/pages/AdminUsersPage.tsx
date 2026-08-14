import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Tooltip,
  Row,
  Col,
  Empty,
  Avatar,
  Popconfirm,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { useAdminStore } from '../store';
import PageHeader from '../components/PageHeader';
import { formatDateTime } from '../utils/format';
import { resolveAssetUrl } from '../utils/assetUrl';
import {
  ROLE_OPTIONS,
  getRoleColor,
  getRoleLabel,
} from '../constants/roles';

interface AdminRecord {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  role: string;
  status: number;
  lastLogin: string | null;
  createdAt: string;
}

interface AdminListResponse {
  list?: AdminRecord[];
  total?: number;
  pageNo?: number;
  pageSize?: number;
}

interface AdminFormValues {
  username: string;
  displayName: string;
  role: string;
  status?: number;
  password?: string;
  newPassword?: string;
}

const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const AdminUsersPage = () => {
  const currentAdmin = useAdminStore((s) => s.admin);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminRecord[]>([]);
  const [filtered, setFiltered] = useState<AdminRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdminRecord | null>(null);
  const [form] = Form.useForm<AdminFormValues>();
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    { value: string; label: string }[]
  >(ROLE_OPTIONS);
  useEffect(() => {
    api
      .get<unknown, { roles: { name: string; displayName: string }[] }>(
        'system/roles',
      )
      .then((res) =>
        setRoleOptions(
          res.roles.map((r) => ({ value: r.name, label: r.displayName })),
        ),
      )
      .catch(() => setRoleOptions(ROLE_OPTIONS));
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.post<unknown, AdminRecord[] | AdminListResponse>(
        'admins/list',
        { pageNo: 1, pageSize: 100 },
      );
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res.list)
          ? res.list
          : [];
      setData(list);
      applyFilters(list, search, filterRole);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load admin users'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list: AdminRecord[], q: string, role?: string) => {
    let result = list;
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(
        (r) =>
          r.username?.toLowerCase().includes(lq) ||
          r.displayName?.toLowerCase().includes(lq),
      );
    }
    if (role) result = result.filter((r) => r.role === role);
    setFiltered(result);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    applyFilters(data, v, filterRole);
  };
  const handleRoleFilter = (v: string | undefined) => {
    setFilterRole(v);
    applyFilters(data, search, v);
  };

  const handleAdd = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({ role: 'admin', status: 1 });
    setModalOpen(true);
  };
  const handleEdit = (record: AdminRecord) => {
    setEditRecord(record);
    form.setFieldsValue({
      username: record.username,
      displayName: record.displayName,
      role: record.role,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editRecord) {
        const { newPassword, ...rest } = values;
        const trimmedPassword = newPassword?.trim();
        const payload: AdminFormValues = trimmedPassword
          ? { ...rest, newPassword: trimmedPassword }
          : rest;
        await api.put(`admins/${editRecord.id}`, payload);
        message.success('Admin user updated');
      } else {
        await api.post('admins/create', values);
        message.success('Admin user created');
      }
      setModalOpen(false);
      fetchAdmins();
    } catch (err) {
      const msg = errorMessage(err, '');
      if (msg) message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: AdminRecord) => {
    try {
      await api.delete(`admins/${record.id}`);
      message.success('Admin user deleted');
      fetchAdmins();
    } catch (err) {
      message.error(errorMessage(err, 'Failed to delete admin user'));
    }
  };

  const columns: ColumnsType<AdminRecord> = [
    {
      title: '',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 56,
      render: (v: string | null) =>
        v ? (
          <Avatar size={36} src={resolveAssetUrl(v)} />
        ) : (
          <Avatar size={36} icon={<UserOutlined />} />
        ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 150,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (r: string) => (
        <Tag color={getRoleColor(r)}>{getRoleLabel(r)}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: number) =>
        s === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Inactive</span>
        ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (t: string | null) =>
        t ? (
          formatDateTime(t)
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Never</span>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t: string) => formatDateTime(t),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this admin?"
            description="This action cannot be undone."
            okType="danger"
            okText="Delete"
            disabled={record.id === currentAdmin?.id}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip
              title={
                record.id === currentAdmin?.id
                  ? 'You cannot delete your own account'
                  : 'Delete'
              }
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.id === currentAdmin?.id}
              >
                Delete
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Users"
        subtitle={`${filtered.length} admins`}
        icon={<TeamOutlined />}
        iconBg="var(--gradient-red)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Admin
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="240px">
            <Input.Search
              placeholder="Search username or name..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="180px">
            <Select
              placeholder="Role"
              allowClear
              style={{ width: '100%' }}
              onChange={handleRoleFilter}
              value={filterRole}
              options={roleOptions}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchAdmins} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={false}
        className="modern-table"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No admin users found"
            />
          ),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editRecord ? 'Edit Admin User' : 'Create Admin User'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editRecord} placeholder="admin_username" />
          </Form.Item>
          {!editRecord && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, min: 6 }]}
            >
              <Input.Password placeholder="Minimum 6 characters" />
            </Form.Item>
          )}
          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Display name" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          {editRecord && (
            <Form.Item
              name="newPassword"
              label="New Password (leave empty to keep current)"
            >
              <Input.Password placeholder="Leave empty if unchanged" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;

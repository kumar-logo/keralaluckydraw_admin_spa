import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
  Row,
  Col,
  Tooltip,
  Empty,
  Avatar,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  UserAddOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  CrownOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { useAdminStore } from '../store';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import MoneyText from '../components/MoneyText';
import ImageUpload from '../components/ImageUpload';
import { formatDateTimeShort } from '../utils/format';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';
import { roleLevel, SUPER_ADMIN_LEVEL } from '../constants/roles';

interface UserRecord {
  id: number;
  userId: string;
  phone: string;
  nickname: string;
  avatar: string;
  balance: number;
  bonusBalance: number;
  withdrawableBalance: number;
  inviteCode: string;
  invitedBy: string;
  vipLevel: number;
  status: number;
  createdAt: string;
}

interface UsersListResponse {
  list: UserRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface EditFormValues {
  nickname: string;
  avatar: string;
  status: number;
  vipLevel: number;
}

interface CreateFormValues {
  phone: string;
  password: string;
  inviteCode?: string;
}

interface PasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const admin = useAdminStore((s) => s.admin);
  const isSuperAdmin = roleLevel(admin?.role) >= SUPER_ADMIN_LEVEL;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UserRecord | null>(null);
  const [editForm] = Form.useForm<EditFormValues>();
  const [editLoading, setEditLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreateFormValues>();
  const [createLoading, setCreateLoading] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordRecord, setPasswordRecord] = useState<UserRecord | null>(null);
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async (
    page = pageNo,
    size = pageSize,
    q = search,
    st = statusFilter,
  ) => {
    setLoading(true);
    try {
      const res = await api.post<unknown, UsersListResponse>('users/list', {
        pageNo: page,
        pageSize: size,
        search: q ? q : undefined,
        status: st,
      });
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPageNo(1);
    fetchUsers(1, pageSize, value, statusFilter);
  };
  const handleStatusFilter = (v: number | undefined) => {
    setStatusFilter(v);
    setPageNo(1);
    fetchUsers(1, pageSize, search, v);
  };

  const openEditModal = (record: UserRecord) => {
    setEditRecord(record);
    editForm.setFieldsValue({
      nickname: record.nickname,
      avatar: record.avatar,
      status: record.status,
      vipLevel: record.vipLevel,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editRecord) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await api.put(`users/${editRecord.userId}`, values);
      message.success('User updated successfully');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to update user'));
      }
    } finally {
      setEditLoading(false);
    }
  };

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await api.post('users/create', {
        phone: values.phone,
        password: values.password,
        inviteCode: values.inviteCode ? values.inviteCode : undefined,
      });
      message.success('User created successfully');
      setCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to create user'));
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const openPasswordModal = (record: UserRecord) => {
    setPasswordRecord(record);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handleSetPassword = async () => {
    if (!passwordRecord) return;
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);
      await api.post(`users/${passwordRecord.userId}/password`, {
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully');
      setPasswordModalOpen(false);
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to update password'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const hasMoney = (record: UserRecord): boolean =>
    Number(record.balance) !== 0 ||
    Number(record.bonusBalance) !== 0 ||
    Number(record.withdrawableBalance) !== 0;

  const handleDelete = async (record: UserRecord) => {
    setDeletingUserId(record.userId);
    try {
      await api.delete(`users/${record.userId}`);
      message.success('User deleted');
      fetchUsers();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete user'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const summary = useMemo(() => {
    let active = 0;
    let vip = 0;
    let totalBalance = 0;
    for (const u of data) {
      if (u.status === 1) active += 1;
      if (u.vipLevel > 0) vip += 1;
      totalBalance += Number(u.balance);
    }
    return { active, vip, totalBalance };
  }, [data]);

  const columns: ColumnsType<UserRecord> = [
    {
      title: '',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 56,
      render: (v: string) =>
        v ? (
          <Avatar size={36} src={resolveAssetUrl(v)} />
        ) : (
          <Avatar size={36} icon={<UserOutlined />} />
        ),
    },
    {
      title: 'Referral ID',
      dataIndex: 'inviteCode',
      key: 'inviteCode',
      width: 150,
      render: (v: string, record: UserRecord) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto', fontFamily: 'monospace' }}
          onClick={() => navigate(`/users/${record.userId}`)}
        >
          {v ? v : '—'}
        </Button>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: 'Nickname',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      sorter: (a, b) => a.balance - b.balance,
      render: (val: number) => <MoneyText value={val} variant="positive" />,
    },
    {
      title: 'VIP',
      dataIndex: 'vipLevel',
      key: 'vipLevel',
      width: 80,
      render: (val: number) =>
        val != null ? <Tag color="gold">VIP {val}</Tag> : <Tag>—</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val: number) => (
        <span className={`status-badge ${val === 1 ? 'active' : 'inactive'}`}>
          {val === 1 ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      title: 'Registered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val: string) => formatDateTimeShort(val),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/users/${record.userId}`)}
            >
              View
            </Button>
          </Tooltip>
          {isSuperAdmin && (
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
          )}
          {isSuperAdmin && (
            <Tooltip title="Change Password">
              <Button
                type="link"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => openPasswordModal(record)}
              />
            </Tooltip>
          )}
          {isSuperAdmin && (
            <Tooltip
              title={
                hasMoney(record)
                  ? 'Cannot delete: user has a wallet balance'
                  : 'Delete user'
              }
            >
              <Popconfirm
                title="Delete this user?"
                description="This action cannot be undone."
                okText="Delete"
                okButtonProps={{ danger: true }}
                disabled={hasMoney(record)}
                onConfirm={() => handleDelete(record)}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={hasMoney(record)}
                  loading={deletingUserId === record.userId}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        subtitle={`${total} total users`}
        icon={<UserOutlined />}
        iconBg="var(--gradient-blue)"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={openCreateModal}
          >
            Create User
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} lg={6}>
          <StatsCard
            title="Total Users"
            value={total}
            icon={<UserOutlined />}
            color="blue"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatsCard
            title="Active (this page)"
            value={summary.active}
            icon={<CheckCircleOutlined />}
            color="green"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatsCard
            title="Total Balance (this page)"
            value={summary.totalBalance}
            icon={<WalletOutlined />}
            color="cyan"
            prefix="₹"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatsCard
            title="VIP Users (this page)"
            value={summary.vip}
            icon={<CrownOutlined />}
            color="orange"
          />
        </Col>
      </Row>

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="280px">
            <Input.Search
              placeholder="Search by User ID, Phone, or Nickname"
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusFilter}
              value={statusFilter}
              options={[
                { value: 1, label: 'Active' },
                { value: 0, label: 'Disabled' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="modern-table"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No users found"
            />
          ),
        }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} users`,
          onChange: (page, size) => {
            setPageNo(page);
            setPageSize(size);
            fetchUsers(page, size);
          },
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Create User"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        confirmLoading={createLoading}
        okText="Create"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { min: 6, max: 20, message: 'Phone must be 6-20 characters' },
            ]}
          >
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, max: 100, message: 'Password must be at least 6 chars' },
            ]}
          >
            <Input.Password placeholder="Password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="inviteCode"
            label="Invite Code"
            tooltip="Referrer's invite code (optional)"
          >
            <Input placeholder="e.g. ARA1234567 (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit User"
        open={editModalOpen}
        onOk={handleEdit}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={editLoading}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="avatar" label="Avatar">
            <ImageUpload folder="avatars" urlPlaceholder="https://… or upload" />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="Nickname"
            rules={[{ required: true, message: 'Please enter nickname' }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value={1}>Active</Select.Option>
                  <Select.Option value={0}>Disabled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="vipLevel"
                label="VIP Level"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`Change Password - ${
          passwordRecord ? passwordRecord.userId : ''
        }`}
        open={passwordModalOpen}
        onOk={handleSetPassword}
        onCancel={() => setPasswordModalOpen(false)}
        confirmLoading={passwordLoading}
        okText="Update Password"
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, max: 100, message: 'Password must be at least 6 chars' },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="New password"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default UsersPage;

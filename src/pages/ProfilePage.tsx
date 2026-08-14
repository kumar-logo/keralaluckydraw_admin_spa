import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Descriptions,
  Row,
  Col,
  Tag,
  message,
} from 'antd';
import {
  IdcardOutlined,
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { useAdminStore } from '../store';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import ImageUpload from '../components/ImageUpload';
import { formatDateTime } from '../utils/format';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getRoleColor, getRoleLabel } from '../constants/roles';

interface AdminProfile {
  id: number;
  username: string;
  displayName: string;
  role: string;
  avatar?: string;
  lastLogin: string;
  createdAt: string;
}

interface ProfileFormValues {
  displayName: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const ProfilePage = () => {
  const { admin, setAuth } = useAdminStore();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  const fetchProfile = async () => {
    if (!admin) return;
    setLoading(true);
    try {
      const res = await api.get<unknown, AdminProfile>(`admins/${admin.id}`);
      setProfile(res);
      profileForm.setFieldsValue({ displayName: res.displayName });
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!admin) return;
    try {
      const values = await profileForm.validateFields();
      setSavingProfile(true);
      await api.put(`admins/${admin.id}`, { displayName: values.displayName });
      const token = localStorage.getItem('admin_token');
      if (token) {
        setAuth({ ...admin, displayName: values.displayName }, token);
      }
      setProfile((prev) =>
        prev ? { ...prev, displayName: values.displayName } : prev,
      );
      message.success('Display name updated');
    } catch (err) {
      const msg = errorMessage(err, '');
      if (msg) message.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAvatar = async (url: string) => {
    if (!admin) return;
    try {
      await api.put(`admins/${admin.id}`, { avatar: url });
      const token = localStorage.getItem('admin_token');
      if (token) {
        setAuth({ ...admin, avatar: url }, token);
      }
      setProfile((prev) => (prev ? { ...prev, avatar: url } : prev));
      message.success('Avatar updated');
    } catch (err) {
      message.error(errorMessage(err, 'Failed to update avatar'));
    }
  };

  const handleChangePassword = async () => {
    if (!admin) return;
    try {
      const values = await passwordForm.validateFields();
      setSavingPassword(true);
      await api.put(`admins/${admin.id}`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success('Password changed successfully');
    } catch (err) {
      const msg = errorMessage(err, '');
      if (msg) message.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account settings"
          icon={<IdcardOutlined />}
          iconBg="var(--gradient-indigo)"
        />
        <PageLoader cards={2} table={false} />
      </div>
    );
  }

  const displayData = profile || admin;
  const roleMeta = getRoleLabel(displayData?.role);
  const roleTagColor = getRoleColor(displayData?.role);
  const avatarUrl = profile?.avatar;

  return (
    <div className="page-container">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account settings"
        icon={<IdcardOutlined />}
        iconBg="var(--gradient-indigo)"
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card style={{ textAlign: 'center' }}>
            {avatarUrl ? (
              <Avatar
                size={96}
                src={resolveAssetUrl(avatarUrl)}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Avatar
                size={96}
                icon={<UserOutlined />}
                style={{
                  background: 'var(--gradient-purple)',
                  marginBottom: 16,
                }}
              />
            )}
            <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>
              {displayData?.displayName || displayData?.username}
            </h3>
            <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              @{displayData?.username}
            </div>
            <Tag
              color={roleTagColor}
              style={{ fontSize: 13, padding: '2px 12px' }}
            >
              {roleMeta}
            </Tag>
          </Card>

          <Card
            title="Avatar"
            style={{ marginTop: 24 }}
            styles={{ body: { padding: 16 } }}
          >
            <ImageUpload
              value={avatarUrl}
              onChange={handleUpdateAvatar}
              urlPlaceholder="https://… or upload"
              folder="avatars"
            />
          </Card>

          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Session Info
              </span>
            }
            style={{ marginTop: 24 }}
          >
            <Descriptions
              column={{ xs: 1, sm: 1 }}
              size="small"
              labelStyle={{ fontWeight: 500, color: 'var(--text-muted)' }}
            >
              <Descriptions.Item label="Admin ID">
                {displayData?.id}
              </Descriptions.Item>
              <Descriptions.Item label="Role">{roleMeta}</Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {formatDateTime(profile?.lastLogin)}
              </Descriptions.Item>
              <Descriptions.Item label="Account Created">
                {formatDateTime(profile?.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                <EditOutlined style={{ marginRight: 8 }} />
                Edit Profile
              </span>
            }
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item label="Username">
                <Input
                  value={displayData?.username}
                  disabled
                  prefix={<UserOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="displayName"
                label="Display Name"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your display name',
                  },
                  {
                    min: 2,
                    message: 'Display name must be at least 2 characters',
                  },
                  {
                    max: 50,
                    message: 'Display name must not exceed 50 characters',
                  },
                ]}
              >
                <Input
                  placeholder="Enter display name"
                  prefix={<IdcardOutlined />}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={savingProfile}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card
            title={
              <span>
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                Change Password
              </span>
            }
            style={{ marginTop: 24 }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your current password',
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter current password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter new password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  {
                    required: true,
                    message: 'Please confirm your new password',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error('Passwords do not match'),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={savingPassword}
                  danger
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;

import { useEffect, useState } from 'react';
import { Card, Tag, Badge, Row, Col, Avatar, Empty, Button, Tooltip, message } from 'antd';
import {
  SafetyCertificateOutlined,
  CrownOutlined,
  UserOutlined,
  EyeOutlined,
  ToolOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import RoleFormModal, {
  RoleFormMode,
  RoleRecord,
} from '../components/RoleFormModal';
import { PermissionOption } from '../components/PermissionSelector';
import { AdminRole, getRoleColor } from '../constants/roles';

interface RoleApiItem {
  id: number;
  name: string;
  displayName: string;
  level: number;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

interface PermissionApiItem {
  code: string;
  name: string;
  groupName: string | null;
}

interface RolesApiResponse {
  roles: RoleApiItem[];
  permissions: PermissionApiItem[];
  allPermissions: string[];
}

const ROLE_ICONS: Record<string, ReactNode> = {
  [AdminRole.SuperAdmin]: <CrownOutlined />,
  [AdminRole.Admin]: <ToolOutlined />,
  [AdminRole.Operator]: <UserOutlined />,
  [AdminRole.Viewer]: <EyeOutlined />,
};

const ROLE_GRADIENTS: Record<string, string> = {
  [AdminRole.SuperAdmin]: 'var(--gradient-orange)',
  [AdminRole.Admin]: 'var(--gradient-blue)',
  [AdminRole.Operator]: 'var(--gradient-green)',
  [AdminRole.Viewer]:
    'linear-gradient(135deg, var(--text-muted) 0%, var(--text-light) 100%)',
};

const DEFAULT_ROLE_GRADIENT = 'var(--gradient-purple)';
const DEFAULT_ROLE_ICON: ReactNode = <SafetyCertificateOutlined />;

const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const permissionLabel = (
  permissions: PermissionOption[],
  code: string,
): string => permissions.find((p) => p.code === code)?.name ?? code;

const RolesPage = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<RoleFormMode>(RoleFormMode.Create);
  const [activeRole, setActiveRole] = useState<RoleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, RolesApiResponse>('system/roles');
      const roleList = res.roles.map<RoleRecord>((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
        level: r.level,
        description: r.description,
        permissions: r.permissions,
        userCount: r.userCount,
        isSystem: r.isSystem,
      }));
      const permissionList = res.permissions.map<PermissionOption>((p) => ({
        code: p.code,
        name: p.name,
        groupName: p.groupName ? p.groupName : '',
      }));
      setRoles(roleList);
      setPermissions(permissionList);
      setAllPermissions(res.allPermissions);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load roles & permissions'));
      setRoles([]);
      setPermissions([]);
      setAllPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setFormMode(RoleFormMode.Create);
    setActiveRole(null);
    setFormOpen(true);
  };

  const openEdit = (role: RoleRecord) => {
    setFormMode(RoleFormMode.Edit);
    setActiveRole(role);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`system/roles/${deleteTarget.id}`);
      message.success('Role deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      message.error(errorMessage(err, 'Failed to delete role'));
    } finally {
      setDeleting(false);
    }
  };

  const deleteBlockReason = (role: RoleRecord): string | null => {
    if (role.isSystem) return 'System roles cannot be deleted.';
    if (role.userCount > 0)
      return `This role is assigned to ${role.userCount} admin user(s) and cannot be deleted.`;
    return null;
  };

  const blockReason = deleteTarget ? deleteBlockReason(deleteTarget) : null;

  if (!loading && roles.length === 0) {
    return (
      <div className="page-container">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Role hierarchy: Super Admin → Admin → Operator → Viewer"
          icon={<SafetyCertificateOutlined />}
          iconBg="var(--gradient-purple)"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Create Role
            </Button>
          }
        />
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 60 } }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No roles configured"
          />
        </Card>
        <RoleFormModal
          open={formOpen}
          mode={formMode}
          role={activeRole}
          permissions={permissions}
          onClose={() => setFormOpen(false)}
          onSaved={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Roles & Permissions"
        subtitle={`${roles.length} roles configured · Super Admin → Admin → Operator → Viewer`}
        icon={<SafetyCertificateOutlined />}
        iconBg="var(--gradient-purple)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Role
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        {roles.map((role) => {
          const tagColor = getRoleColor(role.name);
          return (
            <Col key={role.id} xs={24} sm={12} xl={6}>
              <Card
                style={{ borderRadius: 16, overflow: 'hidden', height: '100%' }}
                styles={{ body: { padding: 0 } }}
                loading={loading}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 4,
                    padding: '12px 12px 0',
                    minHeight: 32,
                    flexWrap: 'wrap',
                  }}
                >
                  {role.isSystem ? (
                    <Tooltip title="System role — locked">
                      <Tag
                        icon={<LockOutlined />}
                        color="default"
                        style={{ margin: 0 }}
                      >
                        System
                      </Tag>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip title="Edit role">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEdit(role)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete role">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setDeleteTarget(role)}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
                <div style={{ padding: '4px 20px 16px', textAlign: 'center' }}>
                  <Avatar
                    size={48}
                    style={{
                      background:
                        ROLE_GRADIENTS[role.name] ?? DEFAULT_ROLE_GRADIENT,
                      marginBottom: 12,
                      fontSize: 22,
                    }}
                  >
                    {ROLE_ICONS[role.name] ?? DEFAULT_ROLE_ICON}
                  </Avatar>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {role.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    {role.description}
                  </div>
                  <Badge count={role.userCount} showZero color={tagColor}>
                    <Tag style={{ margin: 0 }}>Users</Tag>
                  </Badge>
                </div>
                <div
                  style={{
                    padding: '0 20px 16px',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      padding: '12px 0 8px',
                    }}
                  >
                    Permissions ({role.permissions.length}/
                    {allPermissions.length})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {allPermissions.map((perm) => {
                      const has = role.permissions.includes(perm);
                      return (
                        <div
                          key={perm}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: has
                                ? 'var(--text-primary)'
                                : 'var(--text-light)',
                              fontWeight: has ? 500 : 400,
                            }}
                          >
                            {permissionLabel(permissions, perm)}
                          </span>
                          {has ? (
                            <CheckCircleFilled
                              style={{
                                color: 'var(--success)',
                                fontSize: 16,
                              }}
                            />
                          ) : (
                            <CloseCircleFilled
                              style={{
                                color: 'var(--text-light)',
                                fontSize: 16,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card
        style={{ marginTop: 24, borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
        loading={loading}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Permission Matrix
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    borderBottom: '2px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Permission
                </th>
                {roles.map((r) => (
                  <th
                    key={r.id}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'center',
                      borderBottom: '2px solid var(--border-default)',
                      minWidth: 100,
                    }}
                  >
                    <Tag
                      color={getRoleColor(r.name)}
                      style={{ margin: 0, fontSize: 11 }}
                    >
                      {r.displayName}
                    </Tag>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((perm) => (
                <tr key={perm}>
                  <td
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {permissionLabel(permissions, perm)}
                  </td>
                  {roles.map((r) => (
                    <td
                      key={r.id}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      {r.permissions.includes(perm) ? (
                        <CheckCircleFilled
                          style={{ color: 'var(--success)', fontSize: 18 }}
                        />
                      ) : (
                        <CloseCircleFilled
                          style={{ color: 'var(--text-light)', fontSize: 18 }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RoleFormModal
        open={formOpen}
        mode={formMode}
        role={activeRole}
        permissions={permissions}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={blockReason ? 'Cannot Delete Role' : 'Delete Role'}
        description={
          blockReason ??
          `Are you sure you want to delete the "${deleteTarget?.displayName}" role? This action cannot be undone.`
        }
        okText={blockReason ? 'Understood' : 'Delete'}
        loading={deleting}
        danger={!blockReason}
        onConfirm={blockReason ? () => setDeleteTarget(null) : handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default RolesPage;

import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import api from '../services/api';
import PermissionSelector, { PermissionOption } from './PermissionSelector';

export enum RoleFormMode {
  Create = 'create',
  Edit = 'edit',
}

export interface RoleRecord {
  id: number;
  name: string;
  displayName: string;
  level: number;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

interface RoleFormValues {
  name: string;
  displayName: string;
  level: number;
  description: string;
}

interface CreateRolePayload {
  name: string;
  displayName: string;
  level: number;
  description?: string;
  permissionCodes: string[];
}

interface UpdateRolePayload {
  displayName: string;
  level: number;
  description: string;
}

interface SetPermissionsPayload {
  permissionCodes: string[];
}

interface RoleFormModalProps {
  open: boolean;
  mode: RoleFormMode;
  role: RoleRecord | null;
  permissions: PermissionOption[];
  onClose: () => void;
  onSaved: () => void;
}

const ROLE_LEVEL_MIN = 0;
const ROLE_LEVEL_MAX = 100;
const NAME_MIN = 2;
const NAME_MAX = 50;
const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 100;
const DESCRIPTION_MAX = 255;
const NAME_PATTERN = /^[a-z0-9_]+$/;

const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const RoleFormModal = ({
  open,
  mode,
  role,
  permissions,
  onClose,
  onSaved,
}: RoleFormModalProps) => {
  const [form] = Form.useForm<RoleFormValues>();
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === RoleFormMode.Edit;

  useEffect(() => {
    if (!open) return;
    if (isEdit && role) {
      form.setFieldsValue({
        name: role.name,
        displayName: role.displayName,
        level: role.level,
        description: role.description,
      });
      setSelectedCodes(role.permissions);
      return;
    }
    form.resetFields();
    setSelectedCodes([]);
  }, [open, isEdit, role, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (isEdit && role) {
        const updatePayload: UpdateRolePayload = {
          displayName: values.displayName,
          level: values.level,
          description: values.description,
        };
        await api.put(`system/roles/${role.id}`, updatePayload);
        const permissionsPayload: SetPermissionsPayload = {
          permissionCodes: selectedCodes,
        };
        await api.put(
          `system/roles/${role.id}/permissions`,
          permissionsPayload,
        );
        message.success('Role updated');
      } else {
        const createPayload: CreateRolePayload = {
          name: values.name,
          displayName: values.displayName,
          level: values.level,
          description: values.description ? values.description : undefined,
          permissionCodes: selectedCodes,
        };
        await api.post('system/roles', createPayload);
        message.success('Role created');
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = errorMessage(err, '');
      if (msg) message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Role' : 'Create Role'}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={saving}
      okText={isEdit ? 'Save Changes' : 'Create Role'}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Role Key"
          rules={[
            { required: true, message: 'Role key is required' },
            {
              min: NAME_MIN,
              max: NAME_MAX,
              message: `Role key must be ${NAME_MIN}-${NAME_MAX} characters`,
            },
            {
              pattern: NAME_PATTERN,
              message: 'Use lowercase letters, numbers and underscores only',
            },
          ]}
        >
          <Input
            disabled={isEdit}
            placeholder="e.g. finance_manager"
          />
        </Form.Item>
        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[
            { required: true, message: 'Display name is required' },
            {
              min: DISPLAY_NAME_MIN,
              max: DISPLAY_NAME_MAX,
              message: `Display name must be ${DISPLAY_NAME_MIN}-${DISPLAY_NAME_MAX} characters`,
            },
          ]}
        >
          <Input placeholder="e.g. Finance Manager" />
        </Form.Item>
        <Form.Item
          name="level"
          label="Level"
          rules={[{ required: true, message: 'Level is required' }]}
        >
          <InputNumber
            min={ROLE_LEVEL_MIN}
            max={ROLE_LEVEL_MAX}
            style={{ width: '100%' }}
            placeholder="0 - 100"
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              max: DESCRIPTION_MAX,
              message: `Description must be at most ${DESCRIPTION_MAX} characters`,
            },
          ]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Short description of what this role can do"
          />
        </Form.Item>
        <Form.Item label="Permissions">
          <PermissionSelector
            permissions={permissions}
            value={selectedCodes}
            onChange={setSelectedCodes}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleFormModal;

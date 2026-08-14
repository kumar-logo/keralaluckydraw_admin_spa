import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Form,
  InputNumber,
  Switch,
  Popconfirm,
  Space,
  message,
  Row,
  Col,
  Tooltip,
  Card,
  Image,
  Empty,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SmileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';

interface AvatarRecord {
  id: number;
  avatarUrl: string;
  sortOrder: number;
  status: number;
  usageCount?: number;
}

interface AvatarFormValues {
  avatarUrl: string;
  sortOrder: number;
  status: number;
}

const AvatarManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AvatarRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AvatarRecord | null>(null);
  const [form] = Form.useForm<AvatarFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, AvatarRecord[]>('avatars');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load avatars'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      avatarUrl: '',
      sortOrder: data.length + 1,
      status: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (r: AvatarRecord) => {
    setEditRecord(r);
    form.setFieldsValue({
      avatarUrl: r.avatarUrl,
      sortOrder: r.sortOrder,
      status: r.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('avatars', { ...values, id: editRecord?.id });
      message.success(editRecord ? 'Avatar updated' : 'Avatar created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save avatar'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`avatars/${id}`);
      message.success('Avatar deleted');
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete'));
    }
  };

  const activeCount = data.filter((a) => a.status === 1).length;
  const hasUsage = data.some((a) => typeof a.usageCount === 'number');

  return (
    <div className="page-container">
      <PageHeader
        title="Avatar Management"
        subtitle={`${data.length} avatars (${activeCount} active)`}
        icon={<SmileOutlined />}
        iconBg="var(--gradient-cyan)"
        extra={
          <Space>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Avatar
            </Button>
          </Space>
        }
      />

      {data.length === 0 && !loading ? (
        <Empty description="No avatars in library. Upload avatars for users to choose from.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add First Avatar
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {data.map((avatar) => (
            <Col key={avatar.id} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                size="small"
                style={{
                  textAlign: 'center',
                  opacity: avatar.status === 1 ? 1 : 0.5,
                }}
                styles={{ body: { padding: 12 } }}
                actions={[
                  <Tooltip title="Edit" key="edit">
                    <EditOutlined onClick={() => openEdit(avatar)} />
                  </Tooltip>,
                  <Popconfirm
                    key="del"
                    title="Delete avatar?"
                    onConfirm={() => handleDelete(avatar.id)}
                    okType="danger"
                  >
                    <DeleteOutlined style={{ color: 'var(--danger)' }} />
                  </Popconfirm>,
                ]}
              >
                <Image
                  src={resolveAssetUrl(avatar.avatarUrl)}
                  width={64}
                  height={64}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjMyIiB5PSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0YTNiOCIgZm9udC1zaXplPSIyMCI+PzwvdGV4dD48L3N2Zz4="
                  preview={false}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  #{avatar.sortOrder}
                </div>
                {hasUsage && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue" style={{ fontSize: 10 }}>
                      {avatar.usageCount ?? 0} users
                    </Tag>
                  </div>
                )}
                {avatar.status !== 1 && (
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--danger)',
                      fontWeight: 600,
                    }}
                  >
                    DISABLED
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editRecord ? 'Edit Avatar' : 'Add Avatar'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="avatarUrl"
            label="Avatar Image"
            rules={[
              {
                required: true,
                message: 'Please upload an image or enter a URL',
              },
            ]}
          >
            <ImageUpload folder="avatars" urlPlaceholder="https://… or upload" />
          </Form.Item>
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
                getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                getValueProps={(v) => ({ checked: v === 1 })}
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

export default AvatarManagementPage;

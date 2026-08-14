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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';
import { resolveAssetUrl } from '../utils/assetUrl';

interface SharePosterRecord {
  id: number;
  imageUrl: string;
  sortOrder: number;
  status: number;
}

interface SharePosterFormValues {
  imageUrl: string;
  sortOrder: number;
  status: number;
}

const SharePostersPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SharePosterRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SharePosterRecord | null>(null);
  const [form] = Form.useForm<SharePosterFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, SharePosterRecord[]>('share-posters');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load share posters'));
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
    form.setFieldsValue({ imageUrl: '', sortOrder: data.length + 1, status: 1 });
    setModalOpen(true);
  };

  const openEdit = (r: SharePosterRecord) => {
    setEditRecord(r);
    form.setFieldsValue({
      imageUrl: r.imageUrl,
      sortOrder: r.sortOrder,
      status: r.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('share-posters', { ...values, id: editRecord?.id });
      message.success(editRecord ? 'Poster updated' : 'Poster created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save poster'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`share-posters/${id}`);
      message.success('Poster deleted');
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete'));
    }
  };

  const activeCount = data.filter((p) => p.status === 1).length;

  return (
    <div className="page-container">
      <PageHeader
        title="Share Posters"
        subtitle={`${data.length} posters (${activeCount} active) — shown in the user app Invite/Share modal`}
        icon={<PictureOutlined />}
        iconBg="var(--gradient-cyan)"
        extra={
          <Space>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Poster
            </Button>
          </Space>
        }
      />

      {data.length === 0 && !loading ? (
        <Empty description="No share posters. Upload 9:13.5 (portrait) poster designs shown in the user app's Invite to Earn modal.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add First Poster
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {data.map((poster) => (
            <Col key={poster.id} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                size="small"
                style={{
                  textAlign: 'center',
                  opacity: poster.status === 1 ? 1 : 0.5,
                }}
                styles={{ body: { padding: 12 } }}
                actions={[
                  <Tooltip title="Edit" key="edit">
                    <EditOutlined onClick={() => openEdit(poster)} />
                  </Tooltip>,
                  <Popconfirm
                    key="del"
                    title="Delete poster?"
                    onConfirm={() => handleDelete(poster.id)}
                    okType="danger"
                  >
                    <DeleteOutlined style={{ color: 'var(--danger)' }} />
                  </Popconfirm>,
                ]}
              >
                <Image
                  src={resolveAssetUrl(poster.imageUrl)}
                  width={100}
                  height={150}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                  preview={false}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  #{poster.sortOrder}
                </div>
                {poster.status !== 1 && (
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
        title={editRecord ? 'Edit Poster' : 'Add Poster'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="imageUrl"
            label="Poster Image (portrait, ~9:13.5)"
            rules={[{ required: true, message: 'Please upload a poster image' }]}
          >
            <ImageUpload folder="referral" urlPlaceholder="https://… or upload" />
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

export default SharePostersPage;

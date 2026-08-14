import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  message,
  Tooltip,
  Empty,
  Segmented,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  BellOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';

interface TemplateRecord {
  id: number;
  code: string;
  channel: string;
  title: string | null;
  body: string | null;
  status: number;
}

interface TemplateFormValues {
  title: string;
  body: string;
  status: number;
}

interface TestFormValues {
  destination: string;
  variables?: string;
}

const channelColors: Record<string, string | undefined> = {
  sms: 'blue',
  whatsapp: 'green',
  in_app: 'purple',
  inapp: 'purple',
  email: 'gold',
};

type ChannelFilter = 'all' | 'sms' | 'whatsapp' | 'inapp' | 'email';

const CHANNEL_OPTIONS: { label: string; value: ChannelFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'SMS', value: 'sms' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'In-App', value: 'inapp' },
  { label: 'Email', value: 'email' },
];

const matchChannel = (ch: string, filter: ChannelFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'inapp') return ch === 'in_app' || ch === 'inapp';
  return ch === filter;
};

const NotificationTemplatePage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TemplateRecord[]>([]);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TemplateRecord | null>(null);
  const [form] = Form.useForm<TemplateFormValues>();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testRecord, setTestRecord] = useState<TemplateRecord | null>(null);
  const [testForm] = Form.useForm<TestFormValues>();
  const [testLoading, setTestLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, TemplateRecord[]>(
        'notification-templates',
      );
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load templates'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(
    () => data.filter((t) => matchChannel(t.channel, channelFilter)),
    [data, channelFilter],
  );

  const openEdit = (r: TemplateRecord) => {
    setEditRecord(r);
    form.setFieldsValue({
      title: r.title ?? '',
      body: r.body ?? '',
      status: r.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      await api.post('notification-templates', {
        id: editRecord?.id,
        code: editRecord?.code,
        channel: editRecord?.channel,
        ...values,
      });
      message.success('Template saved');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to save template'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const openTest = (r: TemplateRecord) => {
    setTestRecord(r);
    testForm.resetFields();
    setTestOpen(true);
  };

  const handleSendTest = async () => {
    if (!testRecord) return;
    try {
      const values = await testForm.validateFields();
      setTestLoading(true);
      let parsedVars: Record<string, string> = {};
      if (values.variables) {
        try {
          parsedVars = JSON.parse(values.variables) as Record<string, string>;
        } catch {
          message.error('Variables must be valid JSON');
          setTestLoading(false);
          return;
        }
      }
      try {
        await api.post('notification-templates/test', {
          id: testRecord.id,
          code: testRecord.code,
          channel: testRecord.channel,
          destination: values.destination,
          variables: parsedVars,
        });
        message.success('Test message sent');
        setTestOpen(false);
      } catch (apiErr) {
        message.error(getApiErrorMessage(apiErr, 'Test endpoint not wired yet'));
      }
    } finally {
      setTestLoading(false);
    }
  };

  const columns: ColumnsType<TemplateRecord> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 200 },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (v: string) => <Tag color={channelColors[v]}>{v}</Tag>,
    },
    { title: 'Title', dataIndex: 'title', key: 'title', width: 220 },
    {
      title: 'Body',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (v: string | null) => (
        <span className="text-muted-c">{v}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) => <StatusBadge kind="config" status={v} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, r: TemplateRecord) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Send test">
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => openTest(r)}
            >
              Test
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Notification Templates"
        subtitle={`${data.length} templates configured`}
        icon={<BellOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={fetchData} />
          </Tooltip>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Segmented
              value={channelFilter}
              onChange={(v) => setChannelFilter(v as ChannelFilter)}
              options={CHANNEL_OPTIONS}
            />
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No notification templates found." />
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="modern-table"
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description="No templates" /> }}
        />
      )}

      <Modal
        title={
          editRecord
            ? `Edit Template — ${editRecord.code} (${editRecord.channel})`
            : 'Edit Template'
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title">
            <Input />
          </Form.Item>
          <Form.Item
            name="body"
            label="Body ({{otp}}, {{minutes}} placeholders supported)"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
            getValueProps={(v) => ({ checked: v === 1 })}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          testRecord
            ? `Send Test — ${testRecord.code} (${testRecord.channel})`
            : 'Send Test'
        }
        open={testOpen}
        onOk={handleSendTest}
        onCancel={() => setTestOpen(false)}
        confirmLoading={testLoading}
        okText="Send"
        width={520}
        destroyOnHidden
      >
        <Form form={testForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="destination"
            label="Destination (phone / user id / email)"
            rules={[{ required: true, message: 'Please enter a destination' }]}
          >
            <Input placeholder="e.g. +91987... or user id" />
          </Form.Item>
          <Form.Item
            name="variables"
            label="Template Variables (JSON, optional)"
            extra='Example: {"otp":"123456","minutes":"5"}'
          >
            <Input.TextArea rows={3} placeholder='{"otp":"123456"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationTemplatePage;

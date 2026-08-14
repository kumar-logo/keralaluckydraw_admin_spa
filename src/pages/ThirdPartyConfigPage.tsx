import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  message,
  Card,
} from 'antd';
import {
  ApiOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

interface ThirdPartyConfigRecord {
  id: number;
  agencyUid: string;
  memberPrefix: string;
  memberSuffix: string;
  currency: string;
  language: string;
  platform: number;
  launchUrl: string;
  homeUrl: string;
  callbackSecret: string | null;
  enabled: number;
}

const ThirdPartyConfigPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, ThirdPartyConfigRecord>(
        'third-party/config',
      );
      form.setFieldsValue(res);
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load third-party config';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post('third-party/config', values);
      message.success('Third-party config saved');
      load();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Third-Party Integration"
        subtitle="Aggregator seamless-wallet launch credentials (24game)"
        icon={<ApiOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>
        }
      />

      <Card loading={loading} style={{ maxWidth: 880 }}>
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card-alt, #f0f7ff)',
            border: '1px solid #bae0ff',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <InfoCircleOutlined style={{ marginRight: 6 }} /> These credentials
          authenticate game launches and the seamless-wallet callback with the
          aggregator. Member ID is built as{' '}
          <strong>prefix + user id + suffix</strong>.
        </div>

        <Form form={form} layout="vertical" disabled={loading}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="agencyUid"
                label="Agency UID"
                rules={[{ required: true }]}
              >
                <Input placeholder="e8d127ea3e224game48ce40c0f558" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="memberPrefix" label="Member Prefix">
                <Input placeholder="h86457" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="memberSuffix" label="Member Suffix">
                <Input placeholder="10356" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="currency" label="Currency">
                <Input placeholder="INR" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="language" label="Language">
                <Input placeholder="en" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="platform" label="Platform">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="launchUrl"
                label="Launch URL"
                rules={[{ required: true }]}
              >
                <Input placeholder="https://24gameapi.org/api/seamless/v1/launch.php" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="homeUrl"
                label="Home URL (registered domain)"
                extra="Whitelisted domain sent as home_url (blank = auto)."
              >
                <Input placeholder="https://keralaluckydraw.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="callbackSecret"
                label="Callback Secret"
                extra="Optional shared secret used to verify inbound seamless callbacks."
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="enabled"
                label="Enabled"
                valuePropName="checked"
                getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                getValueProps={(v) => ({ checked: v === 1 })}
              >
                <Switch
                  checkedChildren="Enabled"
                  unCheckedChildren="Disabled"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default ThirdPartyConfigPage;

import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, message, Card } from 'antd';
import {
  BellOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

interface FirebaseConfigRecord {
  id: number;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  vapidKey: string;
  serviceAccountJson: string | null;
}

const validateServiceAccountJson = (
  _rule: unknown,
  value: string | undefined,
): Promise<void> => {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) return Promise.resolve();
  try {
    JSON.parse(trimmed);
    return Promise.resolve();
  } catch {
    return Promise.reject(
      new Error('Service account must be valid JSON (or left empty)'),
    );
  }
};

const FirebaseConfigPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, FirebaseConfigRecord>(
        'firebase/config',
      );
      form.setFieldsValue({
        ...res,
        serviceAccountJson: res.serviceAccountJson ?? '',
      });
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load Firebase config';
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
      await api.post('firebase/config', values);
      message.success('Firebase config saved');
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
        title="Firebase (Push Notifications)"
        subtitle="Web SDK config + Admin service-account for FCM device push"
        icon={<BellOutlined />}
        iconBg="var(--gradient-orange, #fa8c16)"
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
            background: 'var(--bg-card-alt, #fff7e6)',
            border: '1px solid #ffd591',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <InfoCircleOutlined style={{ marginRight: 6 }} /> The web-config fields
          initialize the Firebase web SDK in the user app + service worker. The{' '}
          <strong>Service Account JSON</strong> is the Firebase Admin SDK
          private key used by the backend to deliver pushes when admins send a
          notification. The <strong>Web Push VAPID Key</strong> is required for
          browser push — without it the app cannot obtain a device token. While
          the service account is empty, in-app notifications still work and
          device push is skipped. All three (web config + VAPID key + service
          account) must belong to the same Firebase project.
        </div>

        <Form form={form} layout="vertical" disabled={loading}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="apiKey" label="API Key">
                <Input placeholder="AIza..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="authDomain" label="Auth Domain">
                <Input placeholder="project.firebaseapp.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="projectId" label="Project ID">
                <Input placeholder="project-id" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="storageBucket" label="Storage Bucket">
                <Input placeholder="project.firebasestorage.app" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="messagingSenderId" label="Messaging Sender ID">
                <Input placeholder="780407124905" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="measurementId" label="Measurement ID">
                <Input placeholder="G-XXXXXXXXXX" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="appId" label="App ID">
                <Input placeholder="1:780407124905:web:..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="vapidKey"
                label="Web Push VAPID Key"
                extra="Required for browser push. Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Key pair (generate if none)."
              >
                <Input placeholder="B... (Web Push certificate key pair)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="serviceAccountJson"
                label="Service Account JSON (Firebase Admin SDK)"
                extra="Paste the full service-account JSON. Leave empty to disable device push (in-app notifications keep working)."
                rules={[{ validator: validateServiceAccountJson }]}
              >
                <Input.TextArea
                  rows={10}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder='{ "type": "service_account", "project_id": "keralawinz", "private_key": "-----BEGIN PRIVATE KEY-----...", "client_email": "...@keralawinz.iam.gserviceaccount.com" }'
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default FirebaseConfigPage;

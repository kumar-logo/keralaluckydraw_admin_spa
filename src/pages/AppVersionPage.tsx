import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Switch } from 'antd';
import {
  MobileOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

interface AppVersionRecord {
  version: string;
  forceUpdate: boolean;
  minSupportedVersion: string;
  storeUrl: string;
  androidPackageName: string;
  updateMessage: string;
}

const AppVersionPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, AppVersionRecord>('app-version');
      form.setFieldsValue({
        version: res.version,
        forceUpdate: res.forceUpdate,
        minSupportedVersion: res.minSupportedVersion,
        storeUrl: res.storeUrl,
        androidPackageName: res.androidPackageName,
        updateMessage: res.updateMessage,
      });
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load app version';
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
      await api.post('app-version', {
        version: values.version.trim(),
        forceUpdate: !!values.forceUpdate,
        minSupportedVersion: values.minSupportedVersion.trim(),
        storeUrl: values.storeUrl.trim(),
        androidPackageName: values.androidPackageName.trim(),
        updateMessage: values.updateMessage.trim(),
      });
      message.success('App version updated');
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
        title="App Version"
        subtitle="Current published version shown to the mobile / PWA app"
        icon={<MobileOutlined />}
        iconBg="var(--gradient-blue, #1677ff)"
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

      <Card loading={loading} style={{ maxWidth: 560 }}>
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card-alt, #e6f4ff)',
            border: '1px solid #91caff',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <InfoCircleOutlined style={{ marginRight: 6 }} /> The app reads this
          value from <code>GET /hall/api/oper/v1/app/version</code> (also in{' '}
          <code>/app/config</code>) to decide whether to prompt an update. Bump
          it when you publish a new build. Set a minimum supported version (or
          turn on Force update) to require the update before the app can be used.
        </div>

        <Form form={form} layout="vertical" disabled={loading}>
          <Form.Item
            name="version"
            label="Latest version"
            rules={[
              { required: true, message: 'Version is required' },
              { max: 200, message: 'Version must be 200 characters or fewer' },
            ]}
          >
            <Input placeholder="1.0.4" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="forceUpdate"
            label="Force update"
            valuePropName="checked"
            tooltip="When on, every user is forced to update before using the app"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="minSupportedVersion"
            label="Minimum supported version"
            tooltip="Users below this version are forced to update"
            rules={[
              { max: 200, message: 'Must be 200 characters or fewer' },
            ]}
          >
            <Input placeholder="1.0.0" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="storeUrl"
            label="Play Store URL"
            rules={[
              { max: 500, message: 'Must be 500 characters or fewer' },
            ]}
          >
            <Input
              placeholder="https://play.google.com/store/apps/details?id=..."
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="androidPackageName"
            label="Android package name"
            tooltip="Used to build the Play Store link when the URL is empty"
            rules={[
              { max: 200, message: 'Must be 200 characters or fewer' },
            ]}
          >
            <Input placeholder="com.example.app" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="updateMessage"
            label="Update message"
            rules={[
              { max: 500, message: 'Must be 500 characters or fewer' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="A new version is available. Please update for the best experience."
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AppVersionPage;

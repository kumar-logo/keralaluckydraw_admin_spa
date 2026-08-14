import { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Row,
  Col,
  message,
  Tabs,
  Modal,
  Tooltip,
  Space,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';

const RESULT_MODE_OPTIONS = [
  { label: 'Random', value: 'random' },
  { label: 'Weighted', value: 'weighted' },
  { label: 'Min Payout', value: 'min_payout' },
  { label: 'Max Profit', value: 'max_profit' },
  { label: 'Lowest Risk', value: 'lowest_risk' },
];

const ODDS_POLICY_OPTIONS = [
  { label: 'Use Stored Odds', value: 'use_stored' },
  { label: 'Void Bet', value: 'void_bet' },
  { label: 'Error', value: 'error' },
];

type TestKind = 'sms' | 'whatsapp' | 'google';

const TEST_ENDPOINTS: Record<TestKind, string> = {
  sms: 'app-config/test/sms',
  whatsapp: 'app-config/test/whatsapp',
  google: 'app-config/test/google',
};

const DELIVERY_LABELS: Record<'sms' | 'whatsapp', string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

interface DeliveryTestResult {
  detail: string;
}

const GeneralConfigPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initialValuesRef = useRef<Record<string, unknown>>({});
  const [testing, setTesting] = useState<TestKind | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, Record<string, unknown>>('app-config');
      initialValuesRef.current = res;
      form.setFieldsValue(res);
      setDirty(false);
    } catch {
      message.error('Failed to load app config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Unsaved-changes guard on browser navigation / refresh.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post('app-config', values);
      message.success('App config saved');
      setDirty(false);
      load();
    } catch (e) {
      const err = e as { message?: string };
      if (err?.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runConnectionTest = async (kind: TestKind) => {
    setTesting(kind);
    try {
      const values = form.getFieldsValue();
      await api.post(TEST_ENDPOINTS[kind], values);
      message.success(`${kind.toUpperCase()} connection OK`);
    } catch (e) {
      const err = e as { message?: string };
      message.warning(
        err?.message ||
          `${kind.toUpperCase()} test endpoint not wired yet on the backend.`,
      );
    } finally {
      setTesting(null);
    }
  };

  const runDeliveryTest = (kind: 'sms' | 'whatsapp') => {
    let phone = '';
    Modal.confirm({
      title: `Send a test ${DELIVERY_LABELS[kind]} message`,
      content: (
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 8 }}>
            Enter a phone number to receive a live test message using the
            current {DELIVERY_LABELS[kind]} provider settings.
          </p>
          <Input
            placeholder="Phone number"
            addonBefore="+91"
            onChange={(e) => {
              phone = e.target.value.trim();
            }}
          />
        </div>
      ),
      okText: 'Send test',
      onOk: async () => {
        setTesting(kind);
        try {
          const res = await api.post<unknown, DeliveryTestResult>(
            TEST_ENDPOINTS[kind],
            { ...form.getFieldsValue(), phone },
          );
          message.success(
            `Test message sent — check the phone (${res.detail})`,
          );
        } catch (e) {
          const err = e as { message?: string };
          message.error(err.message || `${DELIVERY_LABELS[kind]} test failed`);
          throw e;
        } finally {
          setTesting(null);
        }
      },
    });
  };

  const testButton = (kind: TestKind, label: string) => (
    <Tooltip title={`Calls backend ${TEST_ENDPOINTS[kind]}`}>
      <Button
        size="small"
        icon={<CheckCircleOutlined />}
        loading={testing === kind}
        onClick={() =>
          kind === 'google'
            ? runConnectionTest(kind)
            : runDeliveryTest(kind)
        }
      >
        {label}
      </Button>
    </Tooltip>
  );

  const text = (
    name: string,
    label: string,
    span = 8,
    opts: Record<string, unknown> = {},
  ) => (
    <Col xs={24} sm={span <= 8 ? 12 : 24} md={span}>
      <Form.Item name={name} label={label}>
        <Input {...opts} />
      </Form.Item>
    </Col>
  );

  const num = (
    name: string,
    label: string,
    span = 8,
    opts: Record<string, unknown> = {},
  ) => (
    <Col xs={24} sm={span <= 8 ? 12 : 24} md={span}>
      <Form.Item name={name} label={label}>
        <InputNumber style={{ width: '100%' }} {...opts} />
      </Form.Item>
    </Col>
  );

  const pass = (
    name: string,
    label: string,
    span = 8,
    opts: Record<string, unknown> = {},
  ) => (
    <Col xs={24} sm={span <= 8 ? 12 : 24} md={span}>
      <Form.Item name={name} label={label}>
        <Input.Password autoComplete="new-password" {...opts} />
      </Form.Item>
    </Col>
  );

  const toggle = (name: string, label: string, span = 8) => (
    <Col xs={24} sm={span <= 8 ? 12 : 24} md={span}>
      <Form.Item
        name={name}
        label={label}
        valuePropName="checked"
        getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
        getValueProps={(v) => ({ checked: v === 1 })}
      >
        <Switch checkedChildren="On" unCheckedChildren="Off" />
      </Form.Item>
    </Col>
  );

  const tabItems = [
    {
      key: 'identity',
      label: 'App Identity',
      children: (
        <>
          <Row gutter={16}>
            {text('appName', 'App Name', 8)}
            {text('siteUrl', 'Site URL', 8)}
            {text('currency', 'Currency Symbol', 8)}
          </Row>
          <Form.Item name="marqueeText" label="Marquee / Ticker Text">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            {toggle('vipEnabled', 'Enable VIP / Weekly Salary', 8)}
            {toggle('rechargeBonusEnabled', 'Show Recharge Bonus Promo', 8)}
          </Row>
        </>
      ),
    },
    {
      key: 'referral',
      label: 'Referral',
      children: (
        <>
          <Row gutter={16}>
            {text('referralPrefix', 'Referral Code Prefix', 8, {
              maxLength: 12,
              placeholder: 'AXN',
            })}
          </Row>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            New signups get invite codes like <b>PREFIX</b>1234567 (e.g.
            AXN1234567 or ARA1234567). Keep it short (max 12 characters).
            Changing this does not alter existing users&apos; codes.
          </p>
        </>
      ),
    },
    {
      key: 'social',
      label: 'Social Links',
      children: (
        <Row gutter={16}>
          {text('tgLink', 'Telegram', 8)}
          {text('waLink', 'WhatsApp', 8)}
          {text('xLink', 'X / Twitter', 8)}
          {text('facebookLink', 'Facebook', 8)}
          {text('instagramLink', 'Instagram', 8)}
        </Row>
      ),
    },
    {
      key: 'support',
      label: 'Support',
      children: (
        <>
          <Row gutter={16}>
            {toggle('supportChatEnabled', 'Live Chat Support', 8)}
            {text('supportChatProvider', 'Chat Provider', 8)}
            {text('supportChatLicense', 'Chat License (SalesSmartly project code)', 8)}
          </Row>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            When enabled, the SalesSmartly chat loads and a floating chat button
            appears in the app. Turn it off to hide the chat button and stop
            loading the widget entirely.
          </p>
          <Row gutter={16}>
            {toggle('supportWhatsappEnabled', 'WhatsApp Support', 8)}
            {text('supportWhatsappUrl', 'WhatsApp Support URL', 16, {
              placeholder: 'https://wa.me/919876543210?text=Hi_I_Need_Help',
            })}
          </Row>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            When enabled, a floating WhatsApp button appears in the app linking
            to this URL. Use a wa.me link, e.g.{' '}
            <b>https://wa.me/91XXXXXXXXXX?text=Hi_I_Need_Help</b>.
          </p>
        </>
      ),
    },
    {
      key: 'sportsbook',
      label: 'Sportsbook',
      children: (
        <>
          <Row gutter={16}>
            {text('sportsGameCode', 'Sportsbook Game Code', 12)}
          </Row>
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <InfoCircleOutlined /> The aggregator game code launched when a user
            opens the Sports tab (/index/sports), e.g. SABA_1. The provider must
            be live + your domain whitelisted in Third-Party Integration. Leave
            blank to hide the sportsbook.
          </span>
        </>
      ),
    },
    {
      key: 'engine',
      label: 'Engine & Timings',
      children: (
        <Row gutter={16}>
          {num('schedulerTickMs', 'Scheduler Tick (ms)', 8, { min: 100 })}
          {num('gameinfoCacheTtlMs', 'Game Info Cache TTL (ms)', 8, { min: 0 })}
          {num('roundCooldownMs', 'Round Cooldown (ms)', 8, { min: 0 })}
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="resultModeDefault" label="Default Result Mode">
              <Select options={RESULT_MODE_OPTIONS} />
            </Form.Item>
          </Col>
          {num('resultHouseEdgeDefault', 'Default House Edge (0-1)', 8, {
            min: 0,
            max: 1,
            step: 0.01,
            precision: 4,
          })}
          {num('resultSampleSize', 'Result Sample Size', 8, { min: 1 })}
          {num('resultDecisionBudgetMs', 'Result Decision Budget (ms)', 8, {
            min: 1,
          })}
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="oddsMissingPolicy" label="Missing Odds Policy">
              <Select options={ODDS_POLICY_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'bigwin',
      label: 'Big-Win Broadcast',
      children: (
        <Row gutter={16}>
          {num('bigwinMinAmount', 'Broadcast Threshold', 8, { min: 0 })}
          {text(
            'bigwinTemplate',
            'Message Template ({user} {amount} {game})',
            16,
          )}
        </Row>
      ),
    },
    {
      key: 'otp',
      label: 'OTP / Verification',
      children: (
        <Row gutter={16}>
          {toggle('otpEnabled', 'OTP Enabled', 8)}
          {num('otpLength', 'OTP Length', 8, { min: 4, max: 10 })}
          {num('otpTtlSeconds', 'OTP TTL (seconds)', 8, { min: 30 })}
          {num('otpResendCooldownSec', 'Resend Cooldown (seconds)', 8, {
            min: 0,
          })}
          {num('otpMaxAttempts', 'Max Verify Attempts', 8, { min: 1 })}
        </Row>
      ),
    },
    {
      key: 'sms',
      label: 'SMS Provider',
      children: (
        <>
          <Row gutter={16}>
            {toggle('smsEnabled', 'SMS Enabled', 8)}
            {text('smsEndpoint', 'SMS Endpoint', 16)}
            {pass('smsApiKey', 'SMS API Key', 8)}
            {text('smsSenderId', 'Sender ID', 8)}
            {text('smsRoute', 'Route', 8)}
            {text('smsTemplateId', 'DLT Template ID', 8)}
          </Row>
          <Space style={{ marginTop: 8 }}>
            {testButton('sms', 'Test SMS connection')}
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <InfoCircleOutlined /> Uses current form values (save first for
              persisted test).
            </span>
          </Space>
        </>
      ),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Provider',
      children: (
        <>
          <Row gutter={16}>
            {toggle('whatsappEnabled', 'WhatsApp Enabled', 8)}
            {text('whatsappEndpoint', 'WhatsApp Endpoint', 16)}
            {pass('whatsappToken', 'WhatsApp Token', 8)}
            {text('whatsappTemplateName', 'Template Name', 8)}
            {text('whatsappLangCode', 'Language Code', 8)}
          </Row>
          <Space style={{ marginTop: 8 }}>
            {testButton('whatsapp', 'Test WhatsApp connection')}
          </Space>
        </>
      ),
    },
    {
      key: 'social-login',
      label: 'Social Login',
      children: (
        <>
          <Row gutter={16}>
            {toggle('socialLoginEnabled', 'Show Social Login (Google / Telegram)', 8)}
            {text('googleClientId', 'Google Client ID', 16)}
            {pass('telegramBotToken', 'Telegram Bot Token', 8)}
          </Row>
          <Space style={{ marginTop: 8 }}>
            {testButton('google', 'Test Google verify')}
          </Space>
        </>
      ),
    },
    {
      key: 'background',
      label: 'Login Background',
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="loginBgLightUrl" label="Light Mode Background">
              <ImageUpload folder="config" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="loginBgDarkUrl" label="Dark Mode Background">
              <ImageUpload folder="config" />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  const handleSaveClick = () => {
    handleSave();
  };

  const handleDiscardClick = () => {
    if (!dirty) return;
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'Your edits will be reverted to the last saved values.',
      okText: 'Discard',
      okType: 'danger',
      onOk: () => {
        form.setFieldsValue(initialValuesRef.current);
        setDirty(false);
      },
    });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="General Configuration"
        subtitle="App identity, social links, support, engine defaults & broadcast"
        icon={<SettingOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Space wrap>
            {dirty && (
              <Tooltip title="Discard unsaved changes">
                <Button onClick={handleDiscardClick}>Discard</Button>
              </Tooltip>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveClick}
            >
              {dirty ? 'Save changes' : 'Save'}
            </Button>
          </Space>
        }
      />
      {dirty && (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card-alt, #fff7e6)',
            border: '1px solid #f0c97a',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <InfoCircleOutlined style={{ marginRight: 6 }} /> You have unsaved
          changes. Leaving this page will lose them.
        </div>
      )}
      <Form
        form={form}
        layout="vertical"
        disabled={loading}
        onValuesChange={() => setDirty(true)}
      >
        <Tabs
          tabPosition="left"
          items={tabItems}
          style={{ minHeight: 480 }}
        />
      </Form>
    </div>
  );
};

export default GeneralConfigPage;

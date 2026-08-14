import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, message } from 'antd';
import { DollarOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { type ConfigResponse, type CashRainDetail } from './cashRainShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: CashRainDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as ConfigResponse;
      const scalar = cfg.scalar ? cfg.scalar : {};
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        payRate: scalar.payRate ?? detail.payRate,
      });
    } catch {
      message.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [detail, form]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
        maxPrize: v.maxPrize,
        payRate: v.payRate,
      });
      await api.put(`games/${detail.id}/config`, {
        maxPrize: v.maxPrize,
        payRate: v.payRate,
      });
      message.success('Configuration saved');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader cards={2} />;

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <DollarOutlined /> Bet Limits &amp; Payout
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="minBet" label="Min Bet" extra="Smallest stake.">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="maxBet" label="Max Bet" extra="Largest stake.">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="sellingPrice"
              label="Ticket Price"
              extra="Base unit / selling price."
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="maxPrize"
              label="Max Prize (display)"
              extra="Headline prize label shown to players."
            >
              <Input placeholder="e.g. ₹1,00,000" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Global payout multiplier (1 = no adjustment)."
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Configuration
        </Button>
      </Card>
    </Form>
  );
};

export default ConfigTab;

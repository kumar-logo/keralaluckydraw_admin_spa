import { useEffect, useState } from 'react';
import { Form, InputNumber, Button, Card, Row, Col, Alert, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { type RaceGameDetail } from './raceShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: RaceGameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      minBet: detail.minBet,
      maxBet: detail.maxBet,
      sellingPrice: detail.sellingPrice,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
      });
      message.success('Limits saved');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ borderRadius: 12, maxWidth: 760 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Betting limits"
        description="Per-bet minimum and maximum stake, plus the ticket selling price for this race game."
      />
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={8}>
            <Form.Item
              name="minBet"
              label="Min Bet"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item
              name="maxBet"
              label="Max Bet"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item name="sellingPrice" label="Selling Price">
              <InputNumber min={0} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
        </Row>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Limits
        </Button>
      </Form>
    </Card>
  );
};

export default LimitsTab;

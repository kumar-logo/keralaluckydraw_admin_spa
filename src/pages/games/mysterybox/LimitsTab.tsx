import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { type BoxDetail } from './mysteryBoxShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: BoxDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      minBet: detail.minBet,
      maxBet: detail.maxBet,
      sellingPrice: detail.sellingPrice,
      maxPrize: detail.maxPrize,
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
      await api.put(`games/${detail.id}/config`, { maxPrize: v.maxPrize });
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
        message="Stake & payout limits"
        description="Min / max bet bound each box stake. Selling price is the box open price. Max prize caps the largest item payout. These also appear in the Config tab and are kept in sync."
      />
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="minBet" label="Min Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="maxBet" label="Max Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="sellingPrice" label="Box Price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="maxPrize" label="Max Prize">
              <Input placeholder="—" />
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

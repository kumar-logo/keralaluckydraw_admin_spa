import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, message } from 'antd';
import { DollarOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { cardStyle, formLayout, type GameDetail } from './keralaShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
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
    <Form {...formLayout} form={form}>
      <Card
        title={
          <>
            <DollarOutlined /> Bet Limits &amp; Pricing
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 880 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={12} md={6}>
            <Form.Item name="minBet" label="Min Bet" extra="Smallest stake">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                prefix="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="maxBet" label="Max Bet" extra="Largest stake">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                prefix="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="sellingPrice"
              label="Ticket / Selling Price"
              extra="Price per ticket"
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                prefix="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Headline prize label (free text)"
            >
              <Input placeholder="e.g. 1 Crore" allowClear />
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
      </Card>
    </Form>
  );
};

export default LimitsTab;

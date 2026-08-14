import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  message,
} from 'antd';
import {
  DollarOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../../../services/api';
import {
  type DigitGameDetail,
} from './digitShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: DigitGameDetail;
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
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        <>
          <DollarOutlined /> Betting Limits &amp; Pricing
        </>
      }
      size="small"
      style={{ borderRadius: 12, maxWidth: 820 }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Per-stake limits"
        description="Min and max apply to each individual bet placed by a player. Ticket price is the unit cost of a single ticket."
      />
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item
              name="minBet"
              label="Min Bet"
              extra="Smallest allowed stake."
              rules={[
                { required: true, message: 'Min bet is required' },
                {
                  type: 'number',
                  min: 0,
                  message: 'Must be 0 or more',
                },
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="maxBet"
              label="Max Bet"
              extra="Largest allowed stake."
              dependencies={['minBet']}
              rules={[
                { required: true, message: 'Max bet is required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const min = getFieldValue('minBet');
                    if (
                      value == null ||
                      min == null ||
                      Number(value) >= Number(min)
                    )
                      return Promise.resolve();
                    return Promise.reject(
                      new Error('Max bet must be at least the min bet'),
                    );
                  },
                }),
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="sellingPrice"
              label="Ticket Selling Price"
              extra="Unit price of one ticket."
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '4px 0 16px' }} />
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

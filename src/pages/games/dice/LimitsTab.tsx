import { useEffect, useState } from 'react';
import { Button, Input, InputNumber, Form, Card, Row, Col, Alert, Divider, message } from 'antd';
import { SaveOutlined, AimOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { DEFAULT_DRAW_DELAY, DEFAULT_STOP_BET_BEFORE, type TabProps } from './diceShared';

const LimitsTab = ({ detail, reload }: TabProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      minBet: detail.minBet,
      maxBet: detail.maxBet,
      sellingPrice: detail.sellingPrice,
      maxPrize: detail.maxPrize,
      payRate: detail.payRate,
      stopBetBeforeSec: detail.stopBetBeforeSec ?? DEFAULT_STOP_BET_BEFORE,
      drawDelaySec: detail.drawDelaySec ?? DEFAULT_DRAW_DELAY,
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
        maxPrize: v.maxPrize,
        payRate: v.payRate,
        stopBetBeforeSec: v.stopBetBeforeSec,
        drawDelaySec: v.drawDelaySec,
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
    <Card
      title={
        <>
          <AimOutlined /> Betting & Payout Limits
        </>
      }
      style={{ borderRadius: 12 }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Betting limits & payout caps"
        description="Min/Max stake and the prize/pay-rate caps applied to every bet on this game."
      />
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="minBet"
              label="Min Bet"
              extra="Smallest stake per bet."
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="maxBet"
              label="Max Bet"
              extra="Largest stake per bet."
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
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
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Display cap (e.g. 1000x)."
            >
              <Input placeholder="e.g. 1000x" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Global payout multiplier."
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="stopBetBeforeSec"
              label="Stop Bet Before"
              extra="Lock bets N seconds before draw."
            >
              <InputNumber
                min={1}
                max={3600}
                style={{ width: '100%' }}
                addonAfter="s"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="drawDelaySec"
              label="Draw Delay"
              extra="Delay N seconds after lock before drawing."
            >
              <InputNumber
                min={0}
                max={300}
                style={{ width: '100%' }}
                addonAfter="s"
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '4px 0 16px' }} />
        <Button
          type="primary"
          size="large"
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

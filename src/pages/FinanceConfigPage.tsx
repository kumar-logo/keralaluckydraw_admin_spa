import { useState, useEffect } from 'react';
import {
  Form,
  InputNumber,
  Input,
  Button,
  Card,
  Row,
  Col,
  message,
} from 'antd';
import {
  DollarOutlined,
  SaveOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

interface RechargePreset {
  sortOrder?: number;
  amount: number;
  mark: string;
  bonusPct: number;
}

interface TransferTier {
  sortOrder?: number;
  minAmount: number;
  maxAmount: number;
  pct: number;
}

interface TransferTierForm {
  minAmount: number;
  maxAmount: number;
  pct: number;
}

interface FinanceConfigResponse {
  withdrawFeeRate?: number;
  withdrawMinAmount?: number;
  withdrawMaxAmount?: number;
  withdrawDailyCount?: number;
  withdrawMinBetMultiplier?: number;
  withdrawExplain?: string;
  rechargeMinAmount?: number;
  rechargeMaxAmount?: number;
  firstRechargeBonus?: number;
  newUserBonus?: number;
  wageRate?: number;
  wageMinBet?: number;
  transferMinAmount?: number;
  transferMaxAmount?: number;
  rechargePresets?: RechargePreset[];
  transferTiers?: TransferTier[];
}

const RATE_HELP = '0.02 = 2%';

interface FinanceConfigFormValues {
  rechargePresets?: RechargePreset[];
  transferTiers?: TransferTierForm[];
  [key: string]: unknown;
}

const toFiniteNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const FinanceConfigPage = () => {
  const [form] = Form.useForm<FinanceConfigFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, FinanceConfigResponse>('finance-config');
      const rechargePresets = Array.isArray(res.rechargePresets)
        ? res.rechargePresets
        : [];
      const transferTiers = Array.isArray(res.transferTiers)
        ? res.transferTiers
        : [];
      const presetList = rechargePresets.map((p, i) => ({
        sortOrder: p.sortOrder ?? i,
        amount: Number(p.amount),
        mark: p.mark,
        bonusPct: p.bonusPct === undefined ? 0 : Number(p.bonusPct),
      }));
      const tierList: TransferTierForm[] = transferTiers.map((t) => ({
        minAmount: Number(t.minAmount),
        maxAmount: Number(t.maxAmount),
        pct: Number(t.pct) * 100,
      }));
      form.setFieldsValue({
        ...res,
        rechargePresets: presetList,
        transferTiers: tierList,
      });
    } catch {
      message.error('Failed to load finance config');
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
      const rawPresets: RechargePreset[] = Array.isArray(values.rechargePresets)
        ? values.rechargePresets
        : [];
      const rawTiers: TransferTierForm[] = Array.isArray(values.transferTiers)
        ? values.transferTiers
        : [];
      const presets: RechargePreset[] = rawPresets.map((p, i) => ({
        sortOrder: i,
        amount: toFiniteNumber(p.amount),
        mark: p.mark ? p.mark : '',
        bonusPct: toFiniteNumber(p.bonusPct),
      }));
      const tiers: TransferTier[] = rawTiers.map((t, i) => ({
        sortOrder: i,
        minAmount: toFiniteNumber(t.minAmount),
        maxAmount: toFiniteNumber(t.maxAmount),
        pct: toFiniteNumber(t.pct) / 100,
      }));
      setSaving(true);
      await api.post('finance-config', {
        ...values,
        rechargePresets: presets,
        transferTiers: tiers,
      });
      message.success('Finance config saved');
      load();
    } catch (e: unknown) {
      if (e instanceof Error && e.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Finance Configuration"
        subtitle="Withdrawal, recharge, wage & transfer settings"
        icon={<DollarOutlined />}
        iconBg="var(--gradient-green)"
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
      <Form form={form} layout="vertical" disabled={loading}>
        <Card title="Withdrawal" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="withdrawFeeRate"
                label={`Fee Rate (${RATE_HELP})`}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.001}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="withdrawMinAmount" label="Min Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="withdrawMaxAmount" label="Max Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="withdrawDailyCount" label="Daily Count">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="withdrawMinBetMultiplier"
                label="Min Bet Multiplier"
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="withdrawExplain"
            label="Withdrawal Instructions (shown to user)"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Card>
        <Card title="Recharge" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="rechargeMinAmount" label="Min Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="rechargeMaxAmount" label="Max Amount">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="firstRechargeBonus"
                label={`First Recharge Bonus (${RATE_HELP})`}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="newUserBonus" label="New User Bonus">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Recharge Quick-Amounts
          </div>
          <Form.List name="rechargePresets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={8}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'amount']}
                        rules={[{ required: true, message: 'Amount' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          addonBefore="₹"
                          min={0}
                          placeholder="Amount"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        {...restField}
                        name={[name, 'mark']}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Mark (e.g. Popular)" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'bonusPct']}
                        style={{ marginBottom: 0 }}
                        tooltip="Extra % credited to the wallet on this amount"
                      >
                        <InputNumber
                          addonAfter="%"
                          min={0}
                          max={100}
                          step={0.5}
                          precision={2}
                          placeholder="Bonus"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ amount: 0, mark: '', bonusPct: 0 })}
                  block
                  icon={<PlusOutlined />}
                  size="small"
                >
                  Add Amount
                </Button>
              </>
            )}
          </Form.List>
        </Card>
        <Card title="Wage & Transfer">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="wageRate" label={`Wage Rate (${RATE_HELP})`}>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.001}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="wageMinBet" label="Wage Min Bet">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="transferMinAmount" label="Transfer Min">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="transferMaxAmount" label="Transfer Max">
                <InputNumber
                  addonBefore="₹"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Transfer Bonus Tiers
          </div>
          <Form.List name="transferTiers">
            {(fields, { add, remove }) => (
              <>
                <Row gutter={8} style={{ marginBottom: 4, fontWeight: 500 }}>
                  <Col span={7}>Min Amount</Col>
                  <Col span={7}>Max Amount</Col>
                  <Col span={6}>Bonus %</Col>
                  <Col span={4} />
                </Row>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={8}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, 'minAmount']}
                        rules={[{ required: true, message: 'Min' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          addonBefore="₹"
                          min={0}
                          placeholder="Min"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, 'maxAmount']}
                        rules={[{ required: true, message: 'Max' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          addonBefore="₹"
                          min={0}
                          placeholder="Max"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'pct']}
                        rules={[{ required: true, message: '%' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          addonAfter="%"
                          min={0}
                          step={0.1}
                          placeholder="Bonus %"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ minAmount: 0, maxAmount: 0, pct: 0 })}
                  block
                  icon={<PlusOutlined />}
                  size="small"
                >
                  Add Tier
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </div>
  );
};

export default FinanceConfigPage;

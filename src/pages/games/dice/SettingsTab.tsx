import { useEffect, useState, useCallback } from 'react';
import { Button, Switch, Select, Input, InputNumber, Form, Card, Row, Col, Space, Alert, ColorPicker, message } from 'antd';
import { SaveOutlined, SettingOutlined, DollarOutlined, ClockCircleOutlined, BgColorsOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { DEFAULT_DRAW_DELAY, DRAW_INTERVAL_OPTIONS, DEFAULT_DRAW_INTERVAL, DEFAULT_STOP_BET_BEFORE, DICE_DEFAULTS, type TabProps, type DiceConfigResponse } from './diceShared';

const SettingsTab = ({ detail, reload }: TabProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [palette, setPalette] = useState<{ colorKey: string; hex: string }[]>(
    [],
  );

  const setHex = (colorKey: string, hex: string) =>
    setPalette((rows) =>
      rows.map((r) => (r.colorKey === colorKey ? { ...r, hex } : r)),
    );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await api.get<unknown, DiceConfigResponse>(
        `games/${detail.id}/config`,
      );
      const scalar = cfg.scalar ? cfg.scalar : {};
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        drawInterval: detail.drawInterval ?? DEFAULT_DRAW_INTERVAL,
        stopBetBeforeSec: detail.stopBetBeforeSec ?? DEFAULT_STOP_BET_BEFORE,
        drawDelaySec: detail.drawDelaySec ?? DEFAULT_DRAW_DELAY,
        autoGenerate: detail.autoGenerate !== 0,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        payRate: scalar.payRate ?? detail.payRate,
        digitCount: scalar.digitCount ?? detail.digitCount,
        quickCycleSec: scalar.quickCycleSec ?? detail.quickCycleSec,
        isQuick: (scalar.isQuick ?? detail.isQuick) === 1,
      });
      setPalette(Array.isArray(cfg.colorPalette) ? cfg.colorPalette : []);
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
        drawInterval: v.drawInterval,
        stopBetBeforeSec: v.stopBetBeforeSec,
        drawDelaySec: v.drawDelaySec,
        autoGenerate: v.autoGenerate ? 1 : 0,
        maxPrize: v.maxPrize,
        payRate: v.payRate,
        digitCount: v.digitCount,
        quickCycleSec: v.quickCycleSec,
        isQuick: v.isQuick ? 1 : 0,
      });
      await api.put(`games/${detail.id}/config`, {
        maxPrize: v.maxPrize,
        payRate: v.payRate,
        digitCount: v.digitCount,
        quickCycleSec: v.quickCycleSec,
        isQuick: v.isQuick ? 1 : 0,
        colorPalette: palette,
      });
      await api.post(`schedule/${detail.id}`, {
        roundDuration: v.drawInterval,
        drawInterval: v.drawInterval,
        stopBetBefore: v.stopBetBeforeSec,
        drawDelay: v.drawDelaySec,
        autoGenerate: v.autoGenerate,
        maxPrize: v.maxPrize,
      });
      message.success('Settings saved');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader cards={3} />;

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <DollarOutlined /> Bet Limits & Pricing
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="minBet"
              label="Min Bet"
              extra="Smallest stake allowed per bet."
            >
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
              name="maxBet"
              label="Max Bet"
              extra="Largest stake allowed per bet."
            >
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
        </Row>
      </Card>

      <Card
        title={
          <>
            <ClockCircleOutlined /> Draw Timing
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="drawInterval" label="Draw Interval (sec)">
              <Select options={DRAW_INTERVAL_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="stopBetBeforeSec" label="Stop Bet Before (sec)">
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="drawDelaySec" label="Draw Delay (sec)">
              <InputNumber min={0} max={300} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="autoGenerate"
              label="Auto Generate"
              valuePropName="checked"
              extra="Auto = scheduler draws. Manual = enter results."
            >
              <Switch checkedChildren="Auto" unCheckedChildren="Manual" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> Dice Mechanics & Payout
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={12} md={8}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Display cap shown to players (e.g. 1000x)."
            >
              <Input placeholder="e.g. 1000x" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Global payout multiplier scalar."
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="digitCount"
              label="Digit Count"
              extra="Generic scalar; dice uses fixed defaults below."
            >
              <InputNumber min={1} max={6} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="quickCycleSec"
              label="Quick Cycle (sec)"
              extra="Cycle length when Quick mode is on."
            >
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="s" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="isQuick"
              label="Quick Mode"
              valuePropName="checked"
              extra="Run shortened quick-draw rounds."
            >
              <Switch checkedChildren="Quick" unCheckedChildren="Normal" />
            </Form.Item>
          </Col>
        </Row>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 4 }}
          message="Dice generation defaults"
          description={`This engine generates ${DICE_DEFAULTS.diceCount} dice with ${DICE_DEFAULTS.diceFaces} faces and a big/small threshold of ${DICE_DEFAULTS.bigSmallThreshold}. These are family defaults and are not editable through this config endpoint; payouts are driven by the Odds table.`}
        />
      </Card>

      {palette.length > 0 && (
        <Card
          title={
            <>
              <BgColorsOutlined /> Colour Palette
            </>
          }
          size="small"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Per-game ball colours"
            description="These colours render this game's number balls in the app and admin. Each game keeps its own palette — changing them here updates only this game."
          />
          <Row gutter={16}>
            {palette.map((row) => (
              <Col key={row.colorKey} xs={12} sm={6} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {row.colorKey}
                </div>
                <Space>
                  <ColorPicker
                    showText
                    value={row.hex}
                    onChange={(c) => setHex(row.colorKey, c.toHexString())}
                  />
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: row.hex,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {row.colorKey.charAt(0).toUpperCase()}
                  </span>
                </Space>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save Settings
      </Button>
    </Form>
  );
};

export default SettingsTab;

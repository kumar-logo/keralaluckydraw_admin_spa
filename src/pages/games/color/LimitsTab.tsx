import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, ColorPicker, Form, Input, InputNumber, Row, Select, Space, message } from 'antd';
import { BgColorsOutlined, DeleteOutlined, DollarOutlined, PercentageOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { type ColorGameDetail } from './colorShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: ColorGameDetail;
  reload: () => void;
}) => {
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

  const [numberColors, setNumberColors] = useState<
    { number: number; colors: string[] }[]
  >([]);

  const setNumberField = (
    index: number,
    field: 'number' | 'colors',
    value: number | string[],
  ) =>
    setNumberColors((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );

  const addNumberRow = () =>
    setNumberColors((rows) => [...rows, { number: rows.length, colors: [] }]);

  const removeNumberRow = (index: number) =>
    setNumberColors((rows) => rows.filter((_, i) => i !== index));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as {
        scalar?: { maxPrize?: string; payRate?: number };
        colorPalette?: { colorKey: string; hex: string }[];
        numberColors?: { number: number; colors: string[] }[];
      };
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        maxPrize: cfg?.scalar?.maxPrize ?? detail.maxPrize,
        payRate: cfg?.scalar?.payRate ?? detail.payRate,
      });
      setPalette(Array.isArray(cfg?.colorPalette) ? cfg.colorPalette : []);
      setNumberColors(Array.isArray(cfg?.numberColors) ? cfg.numberColors : []);
    } catch {
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        maxPrize: detail.maxPrize,
        payRate: detail.payRate,
      });
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
        payRate: v.payRate,
        maxPrize: v.maxPrize,
      });
      await api.put(`games/${detail.id}/config`, {
        maxPrize: v.maxPrize,
        payRate: v.payRate,
        colorPalette: palette,
        numberColors,
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

  if (loading) return <PageLoader cards={2} />;

  return (
    <Form form={form} layout="vertical" requiredMark="optional">
      <Card
        size="small"
        title={
          <>
            <DollarOutlined /> Bet Limits
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="minBet"
              label="Min Bet"
              rules={[{ required: true }]}
              extra="Smallest stake a player may place."
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
              rules={[{ required: true }]}
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
          <Col xs={24} sm={8}>
            <Form.Item
              name="sellingPrice"
              label="Selling Price"
              extra="Default chip / ticket price shown in the lobby."
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

      {palette.length > 0 && (
        <Card
          size="small"
          title={
            <>
              <BgColorsOutlined /> Colour Palette
            </>
          }
          style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
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

      {palette.length > 0 && (
        <Card
          size="small"
          title={
            <>
              <BgColorsOutlined /> Number → Colour
            </>
          }
          style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
          extra={
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={addNumberRow}
            >
              Add Number
            </Button>
          }
        >
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="This decides which numbers win colour bets"
            description="Each number's colour(s) determine red/green/violet bet payouts AND the ball colour. Editing this changes settlement for this game. Add or remove numbers freely; assign one or more colours from this game's palette."
          />
          {numberColors.map((row, index) => (
            <Row
              key={index}
              gutter={8}
              align="middle"
              style={{ marginBottom: 8 }}
            >
              <Col xs={6} sm={4}>
                <InputNumber
                  min={0}
                  value={row.number}
                  onChange={(v) =>
                    setNumberField(index, 'number', Number(v ?? 0))
                  }
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={14} sm={18}>
                <Select
                  mode="multiple"
                  value={row.colors}
                  onChange={(cols) =>
                    setNumberField(index, 'colors', cols as string[])
                  }
                  options={palette.map((p) => ({
                    label: p.colorKey,
                    value: p.colorKey,
                  }))}
                  style={{ width: '100%' }}
                  placeholder="Colours for this number"
                />
              </Col>
              <Col xs={4} sm={2}>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeNumberRow(index)}
                />
              </Col>
            </Row>
          ))}
        </Card>
      )}

      <Card
        size="small"
        title={
          <>
            <PercentageOutlined /> Payout Settings
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Global payout multiplier (1 = no change)."
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="maxPrize"
              label="Max Prize (display)"
              extra="Headline prize label shown to players, e.g. “₹1,00,000”."
            >
              <Input placeholder="e.g. ₹1,00,000" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save Limits &amp; Payout
      </Button>
    </Form>
  );
};

export default LimitsTab;

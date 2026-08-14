import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Switch, message } from 'antd';
import { DollarOutlined, PictureOutlined, ProfileOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import ImageUpload from '../../../components/ImageUpload';
import { DEFAULT_NUMBER_MAX, DEFAULT_NUMBER_MIN, type GameConfig, type GameDetail } from './dubaiShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [iconAssets, setIconAssets] = useState<Record<number, string>>({});
  const [bgAsset, setBgAsset] = useState<string>('');
  const watchedMin = Form.useWatch('numberMin', form);
  const watchedMax = Form.useWatch('numberMax', form);
  const iconRangeMin =
    Number.isInteger(watchedMin) && Number(watchedMin) >= 1
      ? Number(watchedMin)
      : 1;
  const iconRangeMax =
    Number.isInteger(watchedMax) && Number(watchedMax) >= iconRangeMin
      ? Number(watchedMax)
      : 36;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as GameConfig;
      const scalar = cfg.scalar ? cfg.scalar : {};
      const icons: Record<number, string> = {};
      let bg = '';
      (Array.isArray(cfg.assets) ? cfg.assets : []).forEach((a) => {
        if (a.assetType === 'icon' && a.number != null) icons[a.number] = a.url;
        else if (a.assetType === 'background') bg = a.url;
      });
      setIconAssets(icons);
      setBgAsset(bg);
      form.setFieldsValue({
        gameName: detail.gameName,
        groupName: detail.groupName,
        sortOrder: detail.sortOrder ?? 0,
        status: detail.status === 1,
        isHot: detail.isHot === 1,
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        cycleSec: scalar.quickCycleSec ?? detail.quickCycleSec,
        payRate: scalar.payRate ?? detail.payRate,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        numberMin: scalar.numberMin ?? detail.numberMin ?? DEFAULT_NUMBER_MIN,
        numberMax: scalar.numberMax ?? detail.numberMax ?? DEFAULT_NUMBER_MAX,
        isQuick: (scalar.isQuick ?? detail.isQuick) === 1,
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
        gameName: v.gameName,
        groupName: v.groupName,
        sortOrder: v.sortOrder,
        status: v.status ? 1 : 0,
        isHot: v.isHot ? 1 : 0,
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
      });
      const assets = [
        ...Object.entries(iconAssets)
          .filter(([, url]) => url)
          .map(([n, url]) => ({
            assetType: 'icon',
            number: Number(n),
            url,
          })),
        ...(bgAsset
          ? [{ assetType: 'background', number: null, url: bgAsset }]
          : []),
      ];
      await api.put(`games/${detail.id}/config`, {
        quickCycleSec: v.cycleSec,
        payRate: v.payRate,
        maxPrize: v.maxPrize,
        numberMin: Number(v.numberMin),
        numberMax: Number(v.numberMax),
        isQuick: v.isQuick,
        assets,
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

  if (loading) return <PageLoader cards={3} />;

  return (
    <Form form={form} layout="vertical" requiredMark="optional">
      <Card
        title={
          <>
            <ProfileOutlined /> Listing & State
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={10}>
            <Form.Item
              name="gameName"
              label="Display Name"
              rules={[{ required: true, message: 'Name is required' }]}
              extra="Shown to players in the lobby and game header."
            >
              <Input style={{ width: '100%' }} placeholder="Dubai" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="groupName"
              label="Group Name"
              extra="Optional lobby grouping / category label."
            >
              <Input style={{ width: '100%' }} placeholder="—" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="sortOrder"
              label="Sort Order"
              extra="Lower shows first."
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={12} md={6}>
            <Form.Item
              name="status"
              label="Enabled"
              valuePropName="checked"
              extra="Disabled games are hidden from players."
            >
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="isHot"
              label="Hot Badge"
              valuePropName="checked"
              extra="Flags the game as Hot in the lobby."
            >
              <Switch checkedChildren="Hot" unCheckedChildren="Normal" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <DollarOutlined /> Betting Limits & Pricing
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={12} md={8}>
            <Form.Item
              name="minBet"
              label="Minimum Bet"
              extra="Smallest stake a player may place."
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="maxBet"
              label="Maximum Bet"
              extra="Largest stake allowed per bet."
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="sellingPrice"
              label="Ticket / Selling Price"
              extra="Default unit price for a single ticket."
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="₹"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> Dubai Mechanics (Single Digit)
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={12} md={8}>
            <Form.Item
              name="cycleSec"
              label="Draw Cycle"
              extra="Quick-cycle length between automatic draws."
            >
              <InputNumber
                min={0}
                precision={0}
                addonAfter="sec"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Base payout multiplier fallback when no per-digit odds row exists."
            >
              <InputNumber
                min={0}
                step={0.1}
                precision={2}
                addonAfter="x"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Display label for the headline prize (e.g. 30x)."
            >
              <Input style={{ width: '100%' }} placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              name="numberMin"
              label="Number Range — From"
              tooltip="Lowest pickable number (1-based). Dubai never draws 0."
              extra="Start of the playable range."
              rules={[
                { required: true, message: 'From is required' },
                { type: 'number', min: 1, message: 'Must be 1 or greater' },
              ]}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
                placeholder="1"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              name="numberMax"
              label="Number Range — To"
              tooltip="Highest pickable number. Default 36."
              extra="End of the playable range."
              dependencies={['numberMin']}
              rules={[
                { required: true, message: 'To is required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = Number(getFieldValue('numberMin'));
                    if (
                      value == null ||
                      !Number.isFinite(from) ||
                      Number(value) >= from
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('To must be ≥ From'),
                    );
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
                placeholder="36"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="isQuick"
              label="Quick Draw"
              valuePropName="checked"
              extra="Fast back-to-back cycles instead of fixed-interval draws."
            >
              <Switch checkedChildren="Quick" unCheckedChildren="Standard" />
            </Form.Item>
          </Col>
        </Row>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 4 }}
          message="Per-number payouts live in the Odds tab"
          description="Each winning number (number_1 … number_N) carries its own multiplier within the From–To range. Edit those in the Odds tab; Pay Rate above is only the fallback."
        />
      </Card>

      <Card
        title={
          <>
            <PictureOutlined /> Number Icons & Background
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Per-number artwork override"
          description={`Dubai picks one number in the configured range (${iconRangeMin}–${iconRangeMax}, 1-based). Upload an SVG/PNG per number to override the built-in icons for this game; leave blank to keep the default.`}
        />
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Background
        </div>
        <ImageUpload folder="games" value={bgAsset} onChange={setBgAsset} />
        <Divider />
        <Row gutter={[16, 16]}>
          {Array.from(
            { length: iconRangeMax - iconRangeMin + 1 },
            (_, i) => iconRangeMin + i,
          ).map((n) => (
            <Col xs={12} sm={8} md={6} lg={4} key={n}>
              <div
                style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}
              >
                {n}
              </div>
              <ImageUpload
                folder="games"
                value={iconAssets[n]}
                onChange={(url) =>
                  setIconAssets((p) => ({ ...p, [n]: url }))
                }
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save Configuration
      </Button>
    </Form>
  );
};

export default ConfigTab;

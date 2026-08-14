import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Popconfirm, Row, Select, Switch, Table, Tag, message } from 'antd';
import { ClockCircleOutlined, DeleteOutlined, GiftOutlined, PlusOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import ImageUpload from '../../../components/ImageUpload';
import { isOnDemandGame } from '../../../utils/gameTypes';
import { DEFAULT_COIN_TYPE, DEFAULT_DRAW_DELAY, DEFAULT_STOP_BET_BEFORE, str, INTERVAL_PRESETS, DEFAULT_DRAW_INTERVAL, num, type BoxDetail, type BoxItem, type ConfigResponse } from './mysteryBoxShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: BoxDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<BoxItem[]>([]);
  const onDemand = isOnDemandGame(detail.gameType);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(
        `games/${detail.id}/config`,
      )) as ConfigResponse;
      const scalar = cfg.scalar ? cfg.scalar : {};
      const box = cfg.box ? cfg.box : {};
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        drawInterval: detail.drawInterval ?? DEFAULT_DRAW_INTERVAL,
        stopBetBeforeSec: detail.stopBetBeforeSec ?? DEFAULT_STOP_BET_BEFORE,
        drawDelaySec: detail.drawDelaySec ?? DEFAULT_DRAW_DELAY,
        autoGenerate: detail.autoGenerate !== 0,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        coinType: box.coinType ?? DEFAULT_COIN_TYPE,
        freeCount: box.freeCount ?? scalar.freeCount ?? 0,
        iconImgId: box.iconImgId ?? '',
        coverImgId: box.coverImgId ?? '',
        iconUrl: box.iconUrl ?? '',
      });
      setItems(
        (Array.isArray(cfg.boxItems) ? cfg.boxItems : []).map((it, i) => ({
          id: it.id,
          itemId: num(it.itemId),
          name: str(it.name),
          prize: num(it.prize),
          rate: num(it.rate),
          iconUrl: str(it.iconUrl),
          imgId: str(it.imgId),
          linkUrl: str(it.linkUrl),
          sortOrder: it.sortOrder ?? i,
        })),
      );
    } catch {
      message.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [detail, form]);

  useEffect(() => {
    load();
  }, [load]);

  const setItem = (
    i: number,
    key: keyof BoxItem,
    val: string | number,
  ) =>
    setItems((list) =>
      list.map((s, j) => (j === i ? { ...s, [key]: val } : s)),
    );

  const boxPrice = num(
    Form.useWatch('sellingPrice', form) ?? detail.sellingPrice,
  );
  const totalRate = useMemo(
    () => items.reduce((sum, it) => sum + num(it.rate), 0),
    [items],
  );

  const boxColumns: ColumnsType<BoxItem> = [
    {
      title: '#',
      key: 'idx',
      width: 44,
      render: (_v, _r, i) => (
        <span style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Image',
      key: 'image',
      width: 180,
      render: (_v, r, i) => (
        <ImageUpload
          folder="games"
          value={r.iconUrl}
          onChange={(url) => setItem(i, 'iconUrl', url)}
          urlPlaceholder="https://…/prize.png"
        />
      ),
    },
    {
      title: 'Prize Name',
      key: 'name',
      render: (_v, r, i) => (
        <Input
          placeholder="e.g. No Win, 5, 10, 15"
          maxLength={100}
          value={r.name}
          onChange={(e) => setItem(i, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'Prize (₹)',
      key: 'prize',
      width: 130,
      render: (_v, r, i) => (
        <InputNumber
          min={0}
          precision={2}
          value={r.prize}
          onChange={(val) => setItem(i, 'prize', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Weight',
      key: 'weight',
      width: 120,
      render: (_v, r, i) => (
        <InputNumber
          min={0}
          value={r.rate}
          onChange={(val) => setItem(i, 'rate', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Win Chance',
      key: 'chance',
      width: 110,
      render: (_v, r) => {
        const pct = totalRate > 0 ? (num(r.rate) / totalRate) * 100 : 0;
        return <Tag color="blue">{pct.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Odds',
      key: 'odds',
      width: 90,
      render: (_v, r) => {
        const mult = boxPrice > 0 ? num(r.prize) / boxPrice : 0;
        return <Tag>{mult > 0 ? mult.toFixed(2) + '×' : '—'}</Tag>;
      },
    },
    {
      title: 'Sort',
      key: 'sort',
      width: 90,
      render: (_v, r, i) => (
        <InputNumber
          min={0}
          value={r.sortOrder}
          onChange={(val) => setItem(i, 'sortOrder', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 44,
      render: (_v, _r, i) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => setItems((l) => l.filter((_, j) => j !== i))}
        >
          <Button danger type="text" size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
      });
      if (!onDemand) {
        await api.post(`schedule/${detail.id}`, {
          roundDuration: v.drawInterval,
          drawInterval: v.drawInterval,
          stopBetBefore: v.stopBetBeforeSec,
          drawDelay: v.drawDelaySec,
          autoGenerate: v.autoGenerate,
        });
      }
      await api.put(`games/${detail.id}/config`, {
        maxPrize: v.maxPrize,
        box: {
          coinType: v.coinType,
          freeCount: v.freeCount,
          iconImgId: v.iconImgId,
          coverImgId: v.coverImgId,
          iconUrl: v.iconUrl,
        },
        boxItems: items.map((s, i) => ({
          id: s.id,
          itemId: num(s.itemId),
          name: s.name,
          prize: num(s.prize),
          rate: num(s.rate),
          iconUrl: s.iconUrl,
          imgId: s.imgId,
          linkUrl: s.linkUrl,
          sortOrder: s.sortOrder ?? i,
        })),
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
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <SettingOutlined /> Box Settings
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Gift Box Image
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload
                folder="games"
                urlPlaceholder="https://…/gift-box.png"
              />
            </Form.Item>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              The closed gift box shown to players on the mystery box screen.
            </div>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="coinType"
              label="Coin Type"
              extra="Currency / coin id used for this box (default 1)"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="freeCount"
              label="Free Plays"
              extra="Number of free opens (default 0)"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="iconImgId"
              label="Box Icon Image ID"
              extra="Reference to uploaded image"
            >
              <Input placeholder="icon_img_id" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="coverImgId"
              label="Box Cover Image ID"
              extra="Reference to uploaded image"
            >
              <Input placeholder="cover_img_id" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> Bet Limits &amp; Pricing
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
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
      </Card>

      {!onDemand && (
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
            <Col xs={24} md={8}>
              <Form.Item name="drawInterval" label="Draw Interval (sec)">
                <Select options={INTERVAL_PRESETS} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="stopBetBeforeSec" label="Stop Bet Before (sec)">
                <InputNumber min={0} max={3600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="drawDelaySec" label="Draw Delay (sec)">
                <InputNumber min={0} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="autoGenerate"
            label="Draw Mode"
            valuePropName="checked"
            extra="Auto draws on schedule; Manual = enter results."
          >
            <Switch checkedChildren="Auto" unCheckedChildren="Manual" />
          </Form.Item>
        </Card>
      )}

      <Card
        title={
          <>
            <GiftOutlined /> Box Items (Prizes, Weights &amp; Odds)
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() =>
              setItems((l) => [
                ...l,
                {
                  itemId: l.reduce((m, x) => Math.max(m, x.itemId), 0) + 1,
                  name: '',
                  prize: 0,
                  rate: 0,
                  iconUrl: '',
                  imgId: '',
                  linkUrl: '',
                  sortOrder: l.length,
                },
              ])
            }
          >
            Add Item
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Weight sets each prize's draw probability — Win Chance = weight ÷ total weight. Odds is the Prize ÷ Box Price multiplier. Realized payouts are still capped by the house-edge profit guard."
        />
        <Table
          rowKey={(_r, i) => String(i)}
          columns={boxColumns}
          dataSource={items}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No box items configured"
              />
            ),
          }}
        />
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

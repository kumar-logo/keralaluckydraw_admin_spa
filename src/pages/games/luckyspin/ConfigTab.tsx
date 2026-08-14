import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Switch, Table, Tag, Tooltip, message } from 'antd';
import { ClockCircleOutlined, DeleteOutlined, DollarOutlined, GiftOutlined, PlusOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { isOnDemandGame } from '../../../utils/gameTypes';
import { segmentColor, DEFAULT_DRAW_INTERVAL, DEFAULT_ITEM_COUNT, num, DEFAULT_MULTIPLE_COUNT, nextSegmentKey, DEFAULT_DRAW_DELAY, DEFAULT_STOP_BET_BEFORE, INTERVAL_PRESETS, cardStyle, type ConfigFormValues, type SpinDetail, type WheelSegment, type ConfigResponse } from './luckySpinShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: SpinDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm<ConfigFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const onDemand = isOnDemandGame(detail.gameType);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(
        `games/${detail.id}/config`,
      )) as ConfigResponse;
      const scalar = cfg.scalar ? cfg.scalar : {};
      const wheel = cfg.wheel ? cfg.wheel : {};
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        payRate: scalar.payRate ?? detail.payRate,
        drawInterval: detail.drawInterval ?? DEFAULT_DRAW_INTERVAL,
        stopBetBeforeSec: detail.stopBetBeforeSec ?? DEFAULT_STOP_BET_BEFORE,
        drawDelaySec: detail.drawDelaySec ?? DEFAULT_DRAW_DELAY,
        autoGenerate: detail.autoGenerate !== 0,
        itemCount: wheel.itemCount ?? DEFAULT_ITEM_COUNT,
        multipleCount: wheel.multipleCount ?? DEFAULT_MULTIPLE_COUNT,
        freeSpins: wheel.freeSpins ?? 0,
        isQuick: (scalar.isQuick ?? detail.isQuick) === 1,
        quickCycleSec: scalar.quickCycleSec ?? detail.quickCycleSec,
      });
      setSegments(
        (Array.isArray(cfg.segments) ? cfg.segments : []).map((s, i) => ({
          key: nextSegmentKey(),
          id: s.id,
          name: s.name ?? '',
          prize: num(s.prize),
          weight: num(s.weight),
          odds: num(s.odds),
          sortOrder: s.sortOrder ?? i,
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

  const setSeg = (
    key: string,
    field: keyof WheelSegment,
    value: string | number,
  ) =>
    setSegments((list) =>
      list.map((s) => (s.key === key ? { ...s, [field]: value } : s)),
    );

  const addSegment = () =>
    setSegments((list) => [
      ...list,
      {
        key: nextSegmentKey(),
        name: '',
        prize: 0,
        weight: 0,
        odds: 0,
        sortOrder: list.length,
      },
    ]);

  const removeSegment = (key: string) =>
    setSegments((list) => list.filter((s) => s.key !== key));

  const totalWeight = useMemo(
    () => segments.reduce((sum, s) => sum + num(s.weight), 0),
    [segments],
  );

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
        payRate: v.payRate,
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
        payRate: v.payRate,
        isQuick: v.isQuick ? 1 : 0,
        quickCycleSec: v.quickCycleSec,
        wheel: {
          itemCount: v.itemCount,
          multipleCount: v.multipleCount,
          freeSpins: v.freeSpins,
        },
        segments: segments.map((s, i) => ({
          id: s.id,
          name: s.name,
          prize: num(s.prize),
          weight: num(s.weight),
          odds: num(s.odds),
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

  const segmentColumns: ColumnsType<WheelSegment> = [
    {
      title: '#',
      key: 'idx',
      width: 56,
      render: (_: unknown, _r: WheelSegment, i: number) => (
        <Space size={6}>
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 4,
              background: segmentColor(i),
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
        </Space>
      ),
    },
    {
      title: 'Label',
      key: 'name',
      render: (_: unknown, r: WheelSegment) => (
        <Input
          placeholder="e.g. x2"
          value={r.name}
          maxLength={20}
          onChange={(e) => setSeg(r.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'Prize',
      key: 'prize',
      width: 150,
      render: (_: unknown, r: WheelSegment) => (
        <InputNumber
          min={0}
          step={1}
          precision={2}
          value={r.prize}
          onChange={(val) => setSeg(r.key, 'prize', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: (
        <Tooltip title="Relative draw probability. Chance = weight / total weight.">
          <span>Weight</span>
        </Tooltip>
      ),
      key: 'weight',
      width: 130,
      render: (_: unknown, r: WheelSegment) => (
        <InputNumber
          min={0}
          step={1}
          value={r.weight}
          onChange={(val) => setSeg(r.key, 'weight', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Win Chance',
      key: 'chance',
      width: 110,
      render: (_: unknown, r: WheelSegment) => {
        const pct = totalWeight > 0 ? (num(r.weight) / totalWeight) * 100 : 0;
        return <Tag color="blue">{pct.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Odds',
      key: 'odds',
      width: 130,
      render: (_: unknown, r: WheelSegment) => (
        <InputNumber
          min={0}
          step={0.1}
          precision={2}
          value={r.odds}
          onChange={(val) => setSeg(r.key, 'odds', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Sort',
      key: 'sortOrder',
      width: 100,
      render: (_: unknown, r: WheelSegment) => (
        <InputNumber
          min={0}
          value={r.sortOrder}
          onChange={(val) => setSeg(r.key, 'sortOrder', num(val))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 56,
      render: (_: unknown, r: WheelSegment) => (
        <Popconfirm
          title="Remove this segment?"
          onConfirm={() => removeSegment(r.key)}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <DollarOutlined /> Bet Limits & Pricing
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="minBet" label="Min Bet" extra="Lowest stake / spin">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="maxBet"
              label="Max Bet"
              extra="Highest stake / spin"
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="sellingPrice"
              label="Spin Price"
              extra="Cost of one spin"
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Display cap label"
            >
              <Input placeholder="e.g. 100000" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="payRate"
              label="Pay Rate"
              extra="Global payout multiplier (optional)"
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
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
          style={cardStyle}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="drawInterval"
                label="Draw Interval"
                extra="Spin round cadence"
              >
                <Select options={INTERVAL_PRESETS} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="stopBetBeforeSec"
                label="Stop Bet Before (sec)"
                extra="Lock betting ahead of draw"
              >
                <InputNumber min={0} max={3600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="drawDelaySec"
                label="Draw Delay (sec)"
                extra="Settle delay after draw"
              >
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
            <SettingOutlined /> Wheel Mechanics
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="itemCount"
              label="Item Count"
              extra="Segments on the wheel (default 12)"
            >
              <InputNumber min={2} max={48} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="multipleCount"
              label="Multiple Count"
              extra="Spin multiplier cap (default 30)"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="freeSpins"
              label="Free Spins Allowed"
              extra="Daily free spins (default 0)"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="isQuick"
              label="Quick Mode"
              valuePropName="checked"
              extra="Enable fast-cycle spins"
            >
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="quickCycleSec"
              label="Quick Cycle (sec)"
              extra="Interval when quick mode is on"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <GiftOutlined /> Wheel Segments (Prizes, Weights &amp; Odds)
          </>
        }
        size="small"
        style={cardStyle}
        extra={
          <Space wrap>
            <Tag>{segments.length} segments</Tag>
            <Button size="small" icon={<PlusOutlined />} onClick={addSegment}>
              Add Segment
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Each segment is a slice of the wheel."
          description="Weight sets the win probability (chance = weight ÷ total weight). Prize is the payout; Odds is the displayed multiplier. The colour swatch is a visual guide only."
        />
        <Table
          rowKey="key"
          columns={segmentColumns}
          dataSource={segments}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 760 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No segments configured — add the first slice."
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

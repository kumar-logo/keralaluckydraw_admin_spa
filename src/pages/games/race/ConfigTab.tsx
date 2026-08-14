import { useCallback, useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Select, Button, Card, Row, Col, Empty, Alert, Divider, ColorPicker, message } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DollarOutlined, BgColorsOutlined, ClockCircleOutlined, FlagOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { DEFAULT_RUNNER_COUNT, RaceLanePreview, DEFAULT_RACE_FRAMES, type RaceGameDetail, type GameConfigResponse } from './raceShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: RaceGameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runners, setRunners] = useState<
    { name: string; nameShort: string; colorHex: string; spriteKey: string | null }[]
  >([]);
  const runnerWatch = Form.useWatch('runnerCount', form) ?? DEFAULT_RUNNER_COUNT;

  const setField = (
    index: number,
    field: 'name' | 'nameShort' | 'colorHex' | 'spriteKey',
    value: string,
  ) =>
    setRunners((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );

  const addRunner = () =>
    setRunners((rows) => [
      ...rows,
      { name: '', nameShort: '', colorHex: '#000000', spriteKey: null },
    ]);

  const removeRunner = (index: number) =>
    setRunners((rows) => rows.filter((_, i) => i !== index));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(
        `games/${detail.id}/config`,
      )) as GameConfigResponse;
      form.setFieldsValue({
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        maxPrize: cfg.scalar?.maxPrize ?? detail.maxPrize,
        runnerCount: cfg.race?.runnerCount ?? DEFAULT_RUNNER_COUNT,
        raceFrames: cfg.race?.raceFrames ?? DEFAULT_RACE_FRAMES,
        drawInterval: detail.drawInterval,
        stopBetBeforeSec: detail.stopBetBeforeSec,
        drawDelaySec: detail.drawDelaySec,
        autoGenerate: detail.autoGenerate !== 0,
      });
      setRunners(Array.isArray(cfg?.raceRunners) ? cfg.raceRunners : []);
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
      });
      await api.put(`games/${detail.id}/config`, {
        maxPrize: v.maxPrize,
        race: { runnerCount: v.runnerCount, raceFrames: v.raceFrames },
        raceRunners: runners,
      });
      await api.post(`schedule/${detail.id}`, {
        roundDuration: v.drawInterval,
        drawInterval: v.drawInterval,
        stopBetBefore: v.stopBetBeforeSec,
        drawDelay: v.drawDelaySec,
        autoGenerate: !!v.autoGenerate,
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
            <FlagOutlined /> Race Mechanics
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Core race settings"
          description="Runner count controls how many lanes (states) appear and how results are validated. Race frames drive the finish-line animation length."
        />
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="runnerCount"
              label="Runner Count"
              extra="Number of lanes / states (2 - 20)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={2} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="raceFrames"
              label="Race Frames"
              extra="Animation frame count (1 - 500)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} max={500} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="maxPrize"
              label="Max Prize"
              extra="Display label shown to players (e.g. x90)"
            >
              <Input placeholder="e.g. x90" />
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left" style={{ margin: '4px 0 12px' }}>
          Lane Preview
        </Divider>
        <RaceLanePreview count={runnerWatch} />
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Runners / Countries
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 960 }}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={addRunner}>
            Add Runner
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Per-game runner names & colours"
          description="The number of runners should match this game's Runner Count above. These names and colours render the race lanes / badges in the app. Sprite Key is optional."
        />
        {runners.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No runners configured — add the first runner."
            style={{ margin: '12px 0 20px' }}
          />
        )}
        {runners.map((row, index) => (
          <Row
            key={index}
            gutter={8}
            align="middle"
            style={{ marginBottom: 8 }}
          >
            <Col xs={24} sm={8}>
              <Input
                value={row.name}
                placeholder="Name (e.g. Kerala)"
                onChange={(e) => setField(index, 'name', e.target.value)}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Input
                value={row.nameShort}
                maxLength={4}
                placeholder="Short (KL)"
                onChange={(e) => setField(index, 'nameShort', e.target.value)}
              />
            </Col>
            <Col xs={12} sm={4}>
              <ColorPicker
                showText
                value={row.colorHex}
                onChange={(c) => setField(index, 'colorHex', c.toHexString())}
              />
            </Col>
            <Col xs={20} sm={6}>
              <Input
                value={row.spriteKey ?? ''}
                placeholder="Sprite key (optional)"
                onChange={(e) =>
                  setField(index, 'spriteKey', e.target.value)
                }
              />
            </Col>
            <Col xs={4} sm={2}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeRunner(index)}
              />
            </Col>
          </Row>
        ))}
      </Card>

      <Card
        title={
          <>
            <DollarOutlined /> Limits & Pricing
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
      >
        <Row gutter={16}>
          <Col xs={8} md={8}>
            <Form.Item name="minBet" label="Min Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="maxBet" label="Max Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={8}>
            <Form.Item name="sellingPrice" label="Ticket / Selling Price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <ClockCircleOutlined /> Draw Schedule
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16, maxWidth: 920 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="drawInterval"
              label="Draw Interval"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                options={[
                  { value: 30, label: '30 Seconds' },
                  { value: 60, label: '1 Minute' },
                  { value: 120, label: '2 Minutes' },
                  { value: 180, label: '3 Minutes' },
                  { value: 300, label: '5 Minutes' },
                  { value: 600, label: '10 Minutes' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="stopBetBeforeSec" label="Stop Bet Before (sec)">
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="drawDelaySec" label="Draw Delay (sec)">
              <InputNumber min={0} max={300} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="autoGenerate"
              label="Auto Generate"
              valuePropName="checked"
              extra="Auto draws on schedule; Manual = enter results."
            >
              <Switch checkedChildren="Auto" unCheckedChildren="Manual" />
            </Form.Item>
          </Col>
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

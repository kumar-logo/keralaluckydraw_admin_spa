import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Select, Space, Switch, message } from 'antd';
import { BgColorsOutlined, ClockCircleOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { useConfigStore } from '../../../store/configStore';
import { DEFAULT_DRAW_INTERVAL, COLOR_OPTIONS, Ball, DEFAULT_STOP_BET_BEFORE, isBallColor, DEFAULT_DRAW_DELAY, type BallColor, type ColorMapRow, type ScheduleConfig, type DigitColorRow } from './colorShared';

const ColorMapTab = ({ gameId }: { gameId: number }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [digits, setDigits] = useState<DigitColorRow[]>([]);
  const [scheduleForm] = Form.useForm();
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const { intervalPresets } = useConfigStore();
  const intervals =
    intervalPresets.length > 0
      ? intervalPresets
      : [
          { value: 30, label: '30 Seconds' },
          { value: 60, label: '1 Minute' },
          { value: 120, label: '2 Minutes' },
          { value: 180, label: '3 Minutes' },
          { value: 300, label: '5 Minutes' },
          { value: 600, label: '10 Minutes' },
        ];

  const loadColorMap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('ui-config');
      const list = ((res as { colorMap?: ColorMapRow[] })?.colorMap ||
        (Array.isArray(res) ? res : [])) as ColorMapRow[];
      const byDigit = new Map<number, ColorMapRow[]>();
      for (const r of list) {
        const d = Number(r.digit);
        const arr = byDigit.get(d) ?? [];
        arr.push(r);
        byDigit.set(d, arr);
      }
      setDigits(
        Array.from({ length: 10 }, (_, d) => {
          const rows = (byDigit.get(d) ?? [])
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const colors = rows
            .map((r) => (r.color || '').toLowerCase())
            .filter(isBallColor);
          return { digit: d, colors };
        }),
      );
    } catch {
      message.error('Failed to load colour map');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = (await api.get(`schedule/${gameId}`)) as {
        config?: ScheduleConfig;
        drawInterval?: number;
      };
      const c = res.config ? res.config : {};
      scheduleForm.setFieldsValue({
        drawInterval: c.roundDuration || res.drawInterval || DEFAULT_DRAW_INTERVAL,
        stopBetBefore: c.stopBetBefore ?? DEFAULT_STOP_BET_BEFORE,
        drawDelay: c.drawDelay ?? DEFAULT_DRAW_DELAY,
        autoGenerate: c.autoGenerate !== false,
      });
    } catch {
      message.error('Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [gameId, scheduleForm]);

  useEffect(() => {
    loadColorMap();
    loadSchedule();
  }, [loadColorMap, loadSchedule]);

  const setPrimary = (digit: number, color: BallColor) =>
    setDigits((list) =>
      list.map((r) =>
        r.digit === digit
          ? { ...r, colors: [color, ...r.colors.slice(1)] }
          : r,
      ),
    );

  const setSecondary = (digit: number, color: BallColor | null) =>
    setDigits((list) =>
      list.map((r) =>
        r.digit === digit
          ? {
              ...r,
              colors: color ? [r.colors[0], color] : r.colors.slice(0, 1),
            }
          : r,
      ),
    );

  const saveColorMap = async () => {
    const missing = digits.find((d) => d.colors.length === 0);
    if (missing) {
      message.error(`Pick a colour for digit ${missing.digit}`);
      return;
    }
    setSaving(true);
    try {
      const colorMap = digits.flatMap((d) =>
        d.colors.map((color, i) => ({
          digit: d.digit,
          color,
          sortOrder: i,
        })),
      );
      await api.post('ui-config', { colorMap });
      message.success('Colour map saved');
      loadColorMap();
    } catch {
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    try {
      const v = await scheduleForm.validateFields();
      setScheduleSaving(true);
      await api.post(`schedule/${gameId}`, {
        roundDuration: v.drawInterval,
        drawInterval: v.drawInterval,
        stopBetBefore: v.stopBetBefore,
        drawDelay: v.drawDelay,
        autoGenerate: v.autoGenerate,
      });
      message.success('Schedule updated');
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('Save failed');
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Colour game mechanics"
        description="Digits 0–9 are mapped to balls shared globally with the player app (UiColorMap). Pick one colour for a solid ball, or two for a split ball (rendered as a 315° gradient). Big = 5–9, Small = 0–4 (fixed)."
      />

      <Card
        size="small"
        title={
          <>
            <SettingOutlined /> Number Range &amp; Big/Small
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Number Range</div>
            <Input value="0 – 9" disabled style={{ width: '100%' }} />
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Big / Small Threshold
            </div>
            <Input value="5  (Big: 5–9, Small: 0–4)" disabled style={{ width: '100%' }} />
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Bets per Round</div>
            <Input value="Colour · Big/Small · Number" disabled style={{ width: '100%' }} />
          </Col>
        </Row>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          The number range and threshold are fixed by the Color game engine and
          cannot be changed here. Odds for each bet are set on the Odds tab.
        </div>
      </Card>

      <Card
        size="small"
        title={
          <>
            <ClockCircleOutlined /> Draw Schedule
          </>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        {scheduleLoading ? (
          <PageLoader cards={1} />
        ) : (
          <Form
            form={scheduleForm}
            layout="vertical"
            requiredMark="optional"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="drawInterval"
                  label="Draw Interval"
                  rules={[{ required: true }]}
                  extra="Time between automatic draws."
                >
                  <Select
                    style={{ width: '100%' }}
                    options={intervals.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="stopBetBefore"
                  label="Stop Bet Before (sec)"
                  rules={[{ required: true }]}
                  extra="Betting closes this many seconds before draw."
                >
                  <InputNumber min={1} max={3600} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="drawDelay"
                  label="Draw Delay (sec)"
                  rules={[{ required: true }]}
                  extra="Delay after close before result is drawn."
                >
                  <InputNumber min={0} max={300} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="autoGenerate"
                  label="Draw Mode"
                  valuePropName="checked"
                  extra="Auto schedules rounds; Manual needs admin draw."
                >
                  <Switch checkedChildren="Auto" unCheckedChildren="Manual" />
                </Form.Item>
              </Col>
            </Row>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveSchedule}
              loading={scheduleSaving}
            >
              Save Schedule
            </Button>
          </Form>
        )}
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Colour Balls (0–9)
          </>
        }
        style={{ borderRadius: 12 }}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveColorMap}
            loading={saving}
          >
            Save Colour Balls
          </Button>
        }
      >
        {loading ? (
          <PageLoader cards={1} />
        ) : (
          <Row gutter={[16, 16]}>
            {digits.map((d) => (
              <Col xs={24} sm={12} md={8} lg={6} xxl={4} key={d.digit}>
                <Card
                  size="small"
                  style={{ borderRadius: 12, height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Ball digit={d.digit} colors={d.colors} size={56} />
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      Digit {d.digit}
                    </div>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Primary colour
                  </div>
                  <Select
                    style={{ width: '100%', marginBottom: 10 }}
                    value={d.colors[0]}
                    placeholder="Select colour"
                    onChange={(v: BallColor) => setPrimary(d.digit, v)}
                    options={COLOR_OPTIONS.map((o) => ({
                      value: o.value,
                      label: (
                        <Space>
                          <Ball digit="" colors={[o.value]} size={16} />
                          {o.label}
                        </Space>
                      ),
                    }))}
                  />
                  <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Second colour (split)
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    allowClear
                    value={d.colors[1]}
                    placeholder="None"
                    disabled={!d.colors[0]}
                    onChange={(v: BallColor | undefined) =>
                      setSecondary(d.digit, v ?? null)
                    }
                    options={COLOR_OPTIONS.filter(
                      (o) => o.value !== d.colors[0],
                    ).map((o) => ({
                      value: o.value,
                      label: (
                        <Space>
                          <Ball digit="" colors={[o.value]} size={16} />
                          {o.label}
                        </Space>
                      ),
                    }))}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </>
  );
};

export default ColorMapTab;

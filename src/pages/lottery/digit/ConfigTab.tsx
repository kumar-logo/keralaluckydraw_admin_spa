import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  ColorPicker,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Tooltip,
  message,
} from 'antd';
import {
  BgColorsOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ProfileOutlined,
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { toScheduleConfigForm } from '../../../services/scheduleConfig';
import { getApiErrorMessage } from '../../../utils/apiError';
import PageLoader from '../../../components/PageLoader';
import {
  SLAT_POSITION_ORDER,
  type PositionColorRow,
} from '../draw/drawTypes';
import { useConfigStore } from '../../../store/configStore';
import {
  SlatMatchMode,
  DEFAULT_SLAT_DIGIT_COUNT,
  defaultPositionColor,
  usesPick4Pricing,
  usesSlatPricing,
  usesInsurance,
  parsePositions,
  formatPositions,
  slatLabelSpan,
  deriveSlatLabels,
  toHex,
  ENGINE_LABEL_STYLE,
  type DigitGameDetail,
  type PrizeTier,
  type SlatTierDto,
  type SlatProductDto,
  type GameConfigResponse,
  type ScheduleResponse,
} from './digitShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: DigitGameDetail;
  reload: () => void;
}) => {
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>([]);
  const [slatProducts, setSlatProducts] = useState<SlatProductDto[]>([]);
  const [positionColorRows, setPositionColorRows] = useState<
    PositionColorRow[]
  >([]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg: GameConfigResponse = await api.get(
        `games/${detail.id}/config`,
      );
      const scalar = cfg.scalar || {};
      const sched: ScheduleResponse = await api.get(`schedule/${detail.id}`);
      const sc = sched.config;
      form.setFieldsValue({
        digitCount: scalar.digitCount ?? detail.digitCount,
        maxPrize: scalar.maxPrize ?? detail.maxPrize,
        payRate: scalar.payRate ?? detail.payRate,
        numberMin: scalar.numberMin ?? detail.numberMin ?? 1,
        numberMax: scalar.numberMax ?? detail.numberMax ?? 36,
        isQuick: scalar.isQuick != null ? !!scalar.isQuick : !!detail.isQuick,
        quickCycleSec: scalar.quickCycleSec ?? detail.quickCycleSec,
        pick4Price: cfg.pick4?.pick4Price,
        pick5Price: cfg.pick4?.pick5Price,
        groupName: detail.groupName,
        isHot: detail.isHot === 1,
        sortOrder: detail.sortOrder ?? 0,
        canInsurance: !!cfg.punjab?.canInsurance,
        ...toScheduleConfigForm(sched),
        scheduledDrawTimes:
          Array.isArray(sc?.scheduledDrawTimes) && sc.scheduledDrawTimes.length
            ? sc.scheduledDrawTimes.map((t) => dayjs(t))
            : sc?.scheduledDrawTime
              ? [dayjs(sc.scheduledDrawTime)]
              : undefined,
        startDate: sc?.startDate ? dayjs(sc.startDate) : null,
      });
      setPrizeTiers(
        (cfg.prizeTiers || []).map((t) => ({
          level: t.level,
          prizeLabel: t.prize,
          prizeValue: Number(t.intPrize) || 0,
        })),
      );
      setSlatProducts(cfg.slatProducts ?? []);
      setPositionColorRows(cfg.positionColors ?? []);
    } catch {
      message.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [detail, form]);

  useEffect(() => {
    load();
  }, [load]);

  const slatPositionCount = Math.max(
    Number(detail.digitCount) || 0,
    slatProducts.reduce(
      (m, p) =>
        p.tiers.reduce(
          (tm, t) =>
            Math.max(tm, slatLabelSpan(t), ...t.positions.map((n) => n + 1)),
          m,
        ),
      0,
    ),
    positionColorRows.reduce((m, r) => Math.max(m, r.position + 1), 0),
    DEFAULT_SLAT_DIGIT_COUNT,
  );

  const saveConfig = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const configPayload: Record<string, unknown> = {
        digitCount: v.digitCount,
        maxPrize: v.maxPrize,
        prizeTiers: prizeTiers
          .filter((t) => t.level !== undefined && t.level !== null)
          .map((t) => ({
            level: Number(t.level),
            prizeLabel: t.prizeLabel,
            prizeValue: Number(t.prizeValue) || 0,
          })),
      };
      if (v.payRate !== undefined && v.payRate !== null)
        configPayload.payRate = v.payRate;
      if (detail.gameType === 'dubai') {
        if (v.numberMin !== undefined && v.numberMin !== null)
          configPayload.numberMin = Number(v.numberMin);
        if (v.numberMax !== undefined && v.numberMax !== null)
          configPayload.numberMax = Number(v.numberMax);
      }
      const isQuick = !!v.isQuick;
      configPayload.isQuick = isQuick ? 1 : 0;
      if (isQuick && v.quickCycleSec)
        configPayload.quickCycleSec = Number(v.quickCycleSec);
      if (usesPick4Pricing(detail.gameType)) {
        configPayload.pick4 = {
          pick4Price: Number(v.pick4Price) || 0,
          pick5Price: Number(v.pick5Price) || 0,
        };
      }
      if (usesInsurance(detail.gameType)) {
        configPayload.punjab = { canInsurance: v.canInsurance ? 1 : 0 };
      }
      if (usesSlatPricing(detail.gameType)) {
        configPayload.slatProducts = slatProducts;
        configPayload.positionColors = Array.from(
          { length: slatPositionCount },
          (_, position) => {
            const row = positionColorRows.find((r) => r.position === position);
            return {
              position,
              color: row?.color || defaultPositionColor(position),
              ...(row?.gradient ? { gradient: row.gradient } : {}),
            };
          },
        );
      }
      const gamePayload: Record<string, unknown> = {
        groupName: v.groupName || null,
        isHot: v.isHot ? 1 : 0,
        sortOrder: Number(v.sortOrder) || 0,
      };
      const calls: Promise<unknown>[] = [
        api.put(`games/${detail.id}/config`, configPayload),
        api.put(`games/${detail.id}`, gamePayload),
      ];
      if (isQuick && v.quickCycleSec) {
        const cycle = Number(v.quickCycleSec);
        calls.push(
          api.post(`schedule/${detail.id}`, {
            roundDuration: cycle,
            drawInterval: cycle,
            stopBetBefore: v.stopBetBefore ?? 10,
            drawDelay: v.drawDelay ?? 5,
            autoGenerate: true,
          }),
        );
      }
      await Promise.all(calls);
      message.success('Configuration saved');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error(getApiErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    try {
      const isManual = form.getFieldValue('autoGenerate') === false;
      const fields = isManual
        ? ['autoGenerate', 'scheduledDrawTimes', 'stopBetBefore', 'startDate']
        : ['autoGenerate', 'drawInterval', 'stopBetBefore', 'drawDelay'];
      const v = await form.validateFields(fields);
      const scheduledDrawTimes =
        isManual && Array.isArray(v.scheduledDrawTimes)
          ? (v.scheduledDrawTimes as dayjs.Dayjs[])
              .filter(Boolean)
              .map((d) => d.toISOString())
          : undefined;
      const startDate =
        isManual && v.startDate
          ? (v.startDate as dayjs.Dayjs).toISOString()
          : null;
      const roundDuration = isManual ? 0 : v.drawInterval;
      setSavingSchedule(true);
      await api.post(`schedule/${detail.id}`, {
        roundDuration,
        drawInterval: roundDuration,
        stopBetBefore: v.stopBetBefore,
        drawDelay: v.drawDelay ?? 5,
        autoGenerate: v.autoGenerate,
        scheduledDrawTimes,
        startDate,
      });
      message.success('Schedule saved');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('Schedule save failed');
    } finally {
      setSavingSchedule(false);
    }
  };

  const setTier = (
    i: number,
    k: keyof PrizeTier,
    val: PrizeTier[keyof PrizeTier],
  ) =>
    setPrizeTiers((list) =>
      list.map((t, j) => (j === i ? { ...t, [k]: val } : t)),
    );

  const setSlatProduct = <K extends keyof SlatProductDto>(
    pi: number,
    key: K,
    val: SlatProductDto[K],
  ) =>
    setSlatProducts((list) =>
      list.map((p, j) => (j === pi ? { ...p, [key]: val } : p)),
    );

  const setSlatTier = <K extends keyof SlatTierDto>(
    pi: number,
    ti: number,
    key: K,
    val: SlatTierDto[K],
  ) =>
    setSlatProducts((list) =>
      list.map((p, j) =>
        j === pi
          ? {
              ...p,
              tiers: p.tiers.map((t, k) =>
                k === ti ? { ...t, [key]: val } : t,
              ),
            }
          : p,
      ),
    );

  const addSlatTier = (pi: number) =>
    setSlatProducts((list) =>
      list.map((p, j) =>
        j === pi
          ? {
              ...p,
              tiers: [
                ...p.tiers,
                { label: '', positions: [], winAmount: 0, tierRank: 0 },
              ],
            }
          : p,
      ),
    );

  const removeSlatTier = (pi: number, ti: number) =>
    setSlatProducts((list) =>
      list.map((p, j) =>
        j === pi
          ? { ...p, tiers: p.tiers.filter((_, k) => k !== ti) }
          : p,
      ),
    );

  const addSlatProduct = () =>
    setSlatProducts((list) => [
      ...list,
      {
        digitCount: DEFAULT_SLAT_DIGIT_COUNT,
        price: 0,
        matchMode: SlatMatchMode.Ladder,
        title: '',
        status: 1,
        tiers: [],
      },
    ]);

  const removeSlatProduct = (pi: number) =>
    setSlatProducts((list) => list.filter((_, j) => j !== pi));

  const setPositionColor = (position: number, color: string) =>
    setPositionColorRows((rows) => {
      const idx = rows.findIndex((r) => r.position === position);
      if (idx === -1) return [...rows, { position, color }];
      return rows.map((r, j) => (j === idx ? { ...r, color } : r));
    });

  if (loading) return <PageLoader cards={3} />;

  const slatPositionLabels = deriveSlatLabels(slatPositionCount, slatProducts);
  const positionColorFor = (position: number): string =>
    positionColorRows.find((r) => r.position === position)?.color || '';
  const addPositionColor = () =>
    setPositionColorRows((rows) => {
      const next = rows.reduce((m, r) => Math.max(m, r.position + 1), 0);
      return [...rows, { position: next, color: defaultPositionColor(next) }];
    });
  const removePositionColor = (position: number) =>
    setPositionColorRows((rows) =>
      rows
        .filter((r) => r.position !== position)
        .map((r) => (r.position > position ? { ...r, position: r.position - 1 } : r)),
    );

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <SettingOutlined /> Digit Mechanics &amp; Payout
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="digitCount"
              label="Digit Count"
              tooltip="Number of digits drawn (3, 4 or 5)."
              extra="Fixed at creation; edit with care."
              rules={[
                { required: true, message: 'Digit count is required' },
                {
                  type: 'number',
                  min: 1,
                  max: 6,
                  message: 'Must be between 1 and 6',
                },
              ]}
            >
              <InputNumber
                min={1}
                max={6}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={9}>
            <Form.Item
              name="maxPrize"
              label="Max Prize (display label)"
              extra="Shown to players as the headline jackpot — display only."
            >
              <Input placeholder="e.g. 1 Crore" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={9}>
            <Form.Item
              name="payRate"
              label="Pay Rate (multiplier)"
              extra="Base payout multiplier when bet-type odds are not used."
            >
              <InputNumber
                min={0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="e.g. 9.00"
              />
            </Form.Item>
          </Col>
          {detail.gameType === 'dubai' && (
            <>
              <Col xs={12} sm={6} md={6}>
                <Form.Item
                  name="numberMin"
                  label="Number Range — From"
                  tooltip="Lowest pickable number (1-based). Dubai never draws 0."
                  extra="Start of the playable number range."
                  rules={[
                    { required: true, message: 'From is required' },
                    {
                      type: 'number',
                      min: 1,
                      message: 'Must be 1 or greater',
                    },
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
              <Col xs={12} sm={6} md={6}>
                <Form.Item
                  name="numberMax"
                  label="Number Range — To"
                  tooltip="Highest pickable number. Default 36."
                  extra="End of the playable number range."
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
                          new Error('To must be greater than or equal to From'),
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
            </>
          )}
          {usesPick4Pricing(detail.gameType) && (
            <>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="pick4Price"
                  label="4-Digit Ticket Price"
                  extra="Unit price for a 4-digit pick."
                >
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="₹"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="pick5Price"
                  label="5-Digit Ticket Price"
                  extra="Unit price for a 5-digit pick."
                >
                  <InputNumber
                    min={0}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    addonBefore="₹"
                  />
                </Form.Item>
              </Col>
            </>
          )}
          {usesInsurance(detail.gameType) && (
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="canInsurance"
                label="Insurance Enabled"
                valuePropName="checked"
                extra="Allow players to insure their tickets."
              >
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Card>

      <Card
        title={
          <>
            <ProfileOutlined /> Lobby &amp; Visibility
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={10}>
            <Form.Item
              name="groupName"
              label="Group Name"
              extra="Optional lobby grouping label (e.g. State Games)."
            >
              <Input placeholder="Ungrouped" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Form.Item
              name="sortOrder"
              label="Sort Order"
              extra="Lower shows first."
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Form.Item
              name="isHot"
              label="Hot Badge"
              valuePropName="checked"
              extra="Flag as a featured game."
            >
              <Switch checkedChildren="Hot" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <ThunderboltOutlined /> Quick Mode
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Auto-cycling quick game"
          description="Quick mode turns this into a fast auto-drawing game shown as a cycle tab (1.5 / 3 / 5 min) alongside its sibling quick games — like the colour game's 1/3/5-min tabs. The selected cycle drives the draw interval and forces auto-generate on. Turn Quick mode off to run the manual draw schedule below."
        />
        <Row gutter={[16, 0]} align="bottom">
          <Col xs={24} sm={10} md={8}>
            <Form.Item
              name="isQuick"
              label="Quick Mode"
              valuePropName="checked"
              extra="On = auto-cycling quick tab. Off = manual draw schedule."
            >
              <Switch
                checkedChildren="Quick"
                unCheckedChildren="Standard"
                onChange={(checked) => {
                  if (checked) {
                    const cycle = form.getFieldValue('quickCycleSec') || 180;
                    form.setFieldsValue({
                      quickCycleSec: cycle,
                      autoGenerate: true,
                      drawInterval: cycle,
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.isQuick !== cur.isQuick}
          >
            {({ getFieldValue }) =>
              getFieldValue('isQuick') ? (
                <Col xs={24} sm={14} md={10}>
                  <Form.Item
                    name="quickCycleSec"
                    label="Cycle"
                    extra="Draw cycle length for this quick game."
                    rules={[
                      {
                        required: true,
                        message: 'Select a cycle for quick mode',
                      },
                    ]}
                  >
                    <Select
                      onChange={(val) =>
                        form.setFieldsValue({
                          drawInterval: val,
                          autoGenerate: true,
                        })
                      }
                      options={[
                        { value: 90, label: '1.5 Minutes (90s)' },
                        { value: 180, label: '3 Minutes (180s)' },
                        { value: 300, label: '5 Minutes (300s)' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              ) : null
            }
          </Form.Item>
        </Row>
      </Card>

      <Card
        title={
          <>
            <ClockCircleOutlined /> Draw Schedule
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={saveSchedule}
            loading={savingSchedule}
          >
            Save Schedule
          </Button>
        }
      >
        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.isQuick !== cur.isQuick}
        >
          {({ getFieldValue }) =>
            getFieldValue('isQuick') ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Schedule driven by Quick cycle"
                description="Quick mode is on — the draw interval and auto-generate are locked to the selected cycle. Turn Quick mode off to set a manual schedule."
              />
            ) : null
          }
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) =>
            prev.isQuick !== cur.isQuick ||
            prev.autoGenerate !== cur.autoGenerate
          }
        >
          {({ getFieldValue }) =>
            !getFieldValue('isQuick') &&
            getFieldValue('autoGenerate') === false ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Manual one-time lottery"
                description="Tickets sell until the draw time you set below. When that time is reached, open the lottery and trigger the single draw from the Result & Draw tab. It runs once and does not repeat."
              />
            ) : null
          }
        </Form.Item>
        <Row gutter={16}>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) =>
              prev.isQuick !== cur.isQuick ||
              prev.autoGenerate !== cur.autoGenerate
            }
          >
            {({ getFieldValue }) =>
              !getFieldValue('isQuick') &&
              getFieldValue('autoGenerate') === false ? (
                <>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="startDate"
                      label="Start Date"
                      extra="Lottery goes live only after this date & time. Leave empty to be live immediately."
                    >
                      <DatePicker
                        showTime={{ format: 'hh:mm A', use12Hours: true }}
                        format="YYYY-MM-DD hh:mm A"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                  <Form.Item
                    label="Draw Times"
                    extra="Each draw is held once at the time you set."
                    required
                  >
                    <Form.List
                      name="scheduledDrawTimes"
                      rules={[
                        {
                          validator: async (_, times) => {
                            if (!times || times.filter(Boolean).length < 1) {
                              return Promise.reject(
                                new Error('Add at least one draw time'),
                              );
                            }
                          },
                        },
                      ]}
                    >
                      {(fields, { add, remove }, { errors }) => (
                        <>
                          {fields.map(({ key, ...field }) => (
                            <Row
                              gutter={8}
                              key={key}
                              align="middle"
                              style={{ marginBottom: 8 }}
                            >
                              <Col flex="auto">
                                <Form.Item
                                  {...field}
                                  noStyle
                                  rules={[
                                    {
                                      required: true,
                                      message: 'Pick the draw date and time',
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    showTime={{
                                      format: 'hh:mm A',
                                      use12Hours: true,
                                    }}
                                    format="YYYY-MM-DD hh:mm A"
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="32px" style={{ textAlign: 'center' }}>
                                <MinusCircleOutlined
                                  onClick={() => remove(field.name)}
                                />
                              </Col>
                            </Row>
                          ))}
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            Add draw time
                          </Button>
                          <Form.ErrorList errors={errors} />
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                  </Col>
                </>
              ) : (
                <Col xs={24} md={8}>
                  <Form.Item
                    name="drawInterval"
                    label="Draw Interval (seconds)"
                    rules={[{ required: true }]}
                  >
                    <Select
                      disabled={!!getFieldValue('isQuick')}
                      options={intervals.map((p) => ({
                        value: p.value,
                        label: p.label,
                      }))}
                    />
                  </Form.Item>
                </Col>
              )
            }
          </Form.Item>
          <Col xs={12} md={5}>
            <Form.Item
              name="stopBetBefore"
              label="Stop Bet Before (sec)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={86400} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) =>
              prev.isQuick !== cur.isQuick ||
              prev.autoGenerate !== cur.autoGenerate
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('autoGenerate') === false &&
              !getFieldValue('isQuick') ? null : (
                <Col xs={12} md={5}>
                  <Form.Item
                    name="drawDelay"
                    label="Draw Delay (sec)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={300} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              )
            }
          </Form.Item>
          <Col xs={24} md={6}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.isQuick !== cur.isQuick}
            >
              {({ getFieldValue }) => (
                <Form.Item
                  name="autoGenerate"
                  label="Auto Generate (Draw Mode)"
                  valuePropName="checked"
                  extra="Auto = scheduler draws. Manual = one-time draw at set time."
                >
                  <Switch
                    disabled={!!getFieldValue('isQuick')}
                    checkedChildren="Auto Draw"
                    unCheckedChildren="Manual Draw"
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> Prize Tiers
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ranked prize ladder"
          description="Each tier maps a draw rank to a fixed payout. Level 1 is the top prize."
        />
        {prizeTiers.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No prize tiers configured"
            style={{ margin: '8px 0 16px' }}
          />
        ) : (
          <Row
            gutter={[12, 0]}
            style={{
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <Col xs={5} md={4}>
              Level
            </Col>
            <Col xs={9} md={9}>
              Display Label
            </Col>
            <Col xs={8} md={9}>
              Prize Amount
            </Col>
            <Col xs={2} md={2} />
          </Row>
        )}
        {prizeTiers.map((t, i) => (
          <Row
            key={i}
            gutter={[12, 0]}
            align="middle"
            style={{ marginBottom: 10 }}
          >
            <Col xs={5} md={4}>
              <InputNumber
                placeholder="Level"
                min={1}
                precision={0}
                value={t.level}
                onChange={(val) => setTier(i, 'level', val as number)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={9} md={9}>
              <Input
                placeholder="e.g. 1st Prize"
                value={t.prizeLabel}
                onChange={(e) => setTier(i, 'prizeLabel', e.target.value)}
              />
            </Col>
            <Col xs={8} md={9}>
              <InputNumber
                placeholder="Prize amount"
                min={0}
                precision={2}
                addonBefore="₹"
                value={t.prizeValue}
                onChange={(val) => setTier(i, 'prizeValue', val as number)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={2} md={2} style={{ textAlign: 'right' }}>
              <Tooltip title="Remove tier">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    setPrizeTiers((l) => l.filter((_, j) => j !== i))
                  }
                />
              </Tooltip>
            </Col>
          </Row>
        ))}
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          style={{ marginTop: 4 }}
          onClick={() =>
            setPrizeTiers((l) => [
              ...l,
              { level: l.length + 1, prizeLabel: '', prizeValue: 0 },
            ])
          }
        >
          Add Tier
        </Button>
      </Card>

      {usesSlatPricing(detail.gameType) && (
        <Card
          title={
            <>
              <DollarOutlined /> Slat / Positional Prices
            </>
          }
          size="small"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Positional price products"
            description="Each product sets a unit price for a digit-count slat and a list of winning tiers. Positions are 0-based indices into the drawn digits. Ladder tiers must form a nested trailing chain; group tiers keep rank 0."
          />
          {slatProducts.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No slat products configured"
              style={{ margin: '8px 0 16px' }}
            />
          ) : (
            slatProducts.map((product, pi) => (
              <Card
                key={pi}
                type="inner"
                size="small"
                style={{ marginBottom: 16, borderRadius: 10 }}
                title={`Product ${pi + 1}`}
                extra={
                  <Tooltip title="Remove product">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeSlatProduct(pi)}
                    />
                  </Tooltip>
                }
              >
                <Row gutter={[12, 12]} align="bottom">
                  <Col xs={12} md={5}>
                    <div style={ENGINE_LABEL_STYLE}>Price</div>
                    <InputNumber
                      min={0}
                      precision={2}
                      addonBefore="₹"
                      value={product.price}
                      onChange={(val) =>
                        setSlatProduct(pi, 'price', (val as number) ?? 0)
                      }
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={12} md={5}>
                    <div style={ENGINE_LABEL_STYLE}>Match Mode</div>
                    <Select
                      value={product.matchMode}
                      onChange={(val) => setSlatProduct(pi, 'matchMode', val)}
                      style={{ width: '100%' }}
                      options={[
                        { value: SlatMatchMode.Group, label: 'Group' },
                        { value: SlatMatchMode.Ladder, label: 'Ladder' },
                      ]}
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <div style={ENGINE_LABEL_STYLE}>Title</div>
                    <Input
                      placeholder="e.g. Straight"
                      value={product.title}
                      onChange={(e) =>
                        setSlatProduct(pi, 'title', e.target.value)
                      }
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <div style={ENGINE_LABEL_STYLE}>Active</div>
                    <Switch
                      checked={product.status === 1}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                      onChange={(checked) =>
                        setSlatProduct(pi, 'status', checked ? 1 : 0)
                      }
                    />
                  </Col>
                </Row>

                <Divider orientation="left" style={{ fontSize: 12 }}>
                  Tiers
                </Divider>
                {product.tiers.length > 0 && (
                  <Row
                    gutter={[12, 0]}
                    style={{
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Col xs={6} md={5}>
                      Label
                    </Col>
                    <Col xs={10} md={8}>
                      Positions (0-based, comma-separated)
                    </Col>
                    <Col xs={8} md={6}>
                      Win Amount
                    </Col>
                    <Col xs={6} md={3}>
                      Tier Rank
                    </Col>
                    <Col xs={2} md={2} />
                  </Row>
                )}
                {product.tiers.map((tier, ti) => (
                  <Row
                    key={ti}
                    gutter={[12, 0]}
                    align="middle"
                    style={{ marginBottom: 10 }}
                  >
                    <Col xs={6} md={5}>
                      <Input
                        placeholder="e.g. Box"
                        value={tier.label}
                        onChange={(e) =>
                          setSlatTier(pi, ti, 'label', e.target.value)
                        }
                      />
                    </Col>
                    <Col xs={10} md={8}>
                      <Input
                        placeholder="e.g. 0, 1, 2"
                        value={formatPositions(tier.positions)}
                        onChange={(e) =>
                          setSlatTier(
                            pi,
                            ti,
                            'positions',
                            parsePositions(e.target.value),
                          )
                        }
                      />
                    </Col>
                    <Col xs={8} md={6}>
                      <InputNumber
                        placeholder="Win amount"
                        min={0}
                        precision={2}
                        addonBefore="₹"
                        value={tier.winAmount}
                        onChange={(val) =>
                          setSlatTier(pi, ti, 'winAmount', (val as number) ?? 0)
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={6} md={3}>
                      <InputNumber
                        placeholder="Rank"
                        min={0}
                        precision={0}
                        value={tier.tierRank}
                        onChange={(val) =>
                          setSlatTier(pi, ti, 'tierRank', (val as number) ?? 0)
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={2} md={2} style={{ textAlign: 'right' }}>
                      <Tooltip title="Remove tier">
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeSlatTier(pi, ti)}
                        />
                      </Tooltip>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 4 }}
                  onClick={() => addSlatTier(pi)}
                >
                  Add Tier
                </Button>
              </Card>
            ))
          )}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={addSlatProduct}
          >
            Add Slat Product
          </Button>
        </Card>
      )}

      {usesSlatPricing(detail.gameType) && (
        <Card
          title={
            <>
              <BgColorsOutlined /> Position Colours
            </>
          }
          size="small"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Per-position result colours"
            description="One colour per drawn position. The list auto-grows when a slat tier adds a position or extends its label; use Add Position to add a colour ahead of the slat layout. Labels are derived from the slat tiers. These colours render the result balls in the admin draw input and result views."
          />
          <Row gutter={[16, 16]}>
            {Array.from({ length: slatPositionCount }, (_, position) => {
              const label =
                slatPositionLabels[position] ||
                SLAT_POSITION_ORDER[position] ||
                String(position + 1);
              const color =
                positionColorFor(position) || defaultPositionColor(position);
              const last = position === slatPositionCount - 1;
              return (
                <Col xs={12} sm={8} md={6} lg={4} key={position}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#fff',
                        border: `2px solid ${color}`,
                        color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {label}
                    </span>
                    <ColorPicker
                      value={color}
                      onChange={(c) => setPositionColor(position, toHex(c))}
                      showText
                      format="hex"
                    />
                    {last && slatPositionCount > DEFAULT_SLAT_DIGIT_COUNT && (
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removePositionColor(position)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            style={{ marginTop: 16 }}
            onClick={addPositionColor}
          >
            Add Position
          </Button>
        </Card>
      )}

      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { display: 'flex', justifyContent: 'flex-end' } }}
      >
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={saveConfig}
          loading={saving}
        >
          Save Configuration
        </Button>
      </Card>

    </Form>
  );
};

export default ConfigTab;

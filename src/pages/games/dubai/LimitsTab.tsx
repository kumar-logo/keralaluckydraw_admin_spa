import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Form, InputNumber, Row, Select, Space, Switch, Tag, message } from 'antd';
import { ClockCircleOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { getApiErrorMessage } from '../../../utils/apiError';
import PageLoader from '../../../components/PageLoader';
import { useConfigStore } from '../../../store/configStore';
import { DEFAULT_STOP_BET_BEFORE, DEFAULT_DRAW_INTERVAL, DEFAULT_DRAW_DELAY, type GameDetail, type ScheduleResponse } from './dubaiShared';

const LimitsTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
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
  const autoGenerate = Form.useWatch('autoGenerate', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`schedule/${detail.id}`)) as ScheduleResponse;
      const c = res.config ? res.config : {};
      form.setFieldsValue({
        drawInterval:
          c.roundDuration ||
          res.drawInterval ||
          detail.drawInterval ||
          DEFAULT_DRAW_INTERVAL,
        stopBetBefore:
          c.stopBetBefore ?? detail.stopBetBeforeSec ?? DEFAULT_STOP_BET_BEFORE,
        drawDelay: c.drawDelay ?? detail.drawDelaySec ?? DEFAULT_DRAW_DELAY,
        autoGenerate: c.autoGenerate !== false,
        scheduledDrawTimes:
          Array.isArray(c.scheduledDrawTimes) && c.scheduledDrawTimes.length
            ? c.scheduledDrawTimes.map((t) => dayjs(t))
            : c.scheduledDrawTime
              ? [dayjs(c.scheduledDrawTime)]
              : undefined,
        startDate: c.startDate ? dayjs(c.startDate) : null,
      });
    } catch {
      message.error('Failed to load schedule');
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
      const isManual = v.autoGenerate === false;
      const scheduledDrawTimes: string[] = Array.isArray(v.scheduledDrawTimes)
        ? v.scheduledDrawTimes
            .filter(Boolean)
            .map((d: { toISOString: () => string }) => d.toISOString())
        : [];
      if (isManual && !scheduledDrawTimes.length) {
        message.error('Pick the draw date and time for the manual draw');
        return;
      }
      const startDate =
        isManual && v.startDate
          ? (v.startDate as { toISOString: () => string }).toISOString()
          : null;
      setSaving(true);
      const roundDuration = isManual ? 0 : v.drawInterval;
      await api.post(`schedule/${detail.id}`, {
        roundDuration,
        drawInterval: roundDuration,
        stopBetBefore: v.stopBetBefore,
        drawDelay: v.drawDelay,
        autoGenerate: v.autoGenerate,
        scheduledDrawTimes: isManual ? scheduledDrawTimes : undefined,
        startDate,
      });
      message.success('Limits & schedule updated');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const control = async (action: string) => {
    try {
      await api.post(`games/${detail.id}/${action}`);
      message.success(`${action} done`);
      reload();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed'));
    }
  };

  if (loading) return <PageLoader cards={2} />;
  return (
    <>
      <Card
        title={
          <>
            <ClockCircleOutlined /> Schedule & Draw Timing
          </>
        }
        size="small"
        style={{ borderRadius: 12, maxWidth: 960, marginBottom: 16 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="autoGenerate"
            label="Draw Mode"
            valuePropName="checked"
            extra="Auto = recurring rounds; Manual = one-time draw at a set time."
          >
            <Switch checkedChildren="Auto Draw" unCheckedChildren="Manual Draw" />
          </Form.Item>
          {autoGenerate === false ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Manual one-time lottery"
              description="Tickets sell until the draw time below. When that time is reached, open the lottery and trigger the single draw from the Result & Draw tab. It runs once and does not repeat."
            />
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Auto recurring lottery"
              description="Rounds open and draw automatically every Draw Interval, on repeat, with no manual action."
            />
          )}
          <Row gutter={[16, 0]}>
            {autoGenerate === false ? (
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
                  required
                  extra="Each draw is held once at its exact moment."
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
                                    message: 'Pick a draw date and time',
                                  },
                                ]}
                              >
                                <DatePicker
                                  showTime={{ format: 'hh:mm A', use12Hours: true }}
                                  format="YYYY-MM-DD hh:mm A"
                                  style={{ width: '100%' }}
                                  size="large"
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
                  label="Draw Interval"
                  extra="Time between scheduled draws."
                  rules={[{ required: true }]}
                >
                  <Select
                    size="large"
                    options={intervals.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            <Col xs={12} md={8}>
              <Form.Item
                name="stopBetBefore"
                label="Stop Bet Before"
                extra="Lock betting this many seconds before the draw."
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={1}
                  max={3600}
                  addonAfter="sec"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="drawDelay"
                label="Draw Delay"
                extra="Wait this long after lock before revealing the result."
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  max={300}
                  addonAfter="sec"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={save}
            loading={saving}
          >
            Save Limits
          </Button>
        </Form>
      </Card>

      <Card
        title="Visibility & State"
        size="small"
        style={{ borderRadius: 12, maxWidth: 960 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space>
              <Switch
                checked={detail.isPaused === 1}
                checkedChildren="Paused"
                unCheckedChildren="Running"
                onChange={(v) => control(v ? 'pause' : 'resume')}
              />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Is Paused</span>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Switch
                checked={detail.isHidden === 1}
                checkedChildren="Hidden"
                unCheckedChildren="Visible"
                onChange={(v) => control(v ? 'hide' : 'show')}
              />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Is Hidden</span>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                Emergency Stop Active:
              </span>
              {detail.emergencyStop === 1 ? (
                <Tag color="red">Yes</Tag>
              ) : (
                <Tag color="green">No</Tag>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default LimitsTab;

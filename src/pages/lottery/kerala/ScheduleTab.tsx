import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Form, InputNumber, Row, Select, Switch, message } from 'antd';
import { CalendarOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../../services/api';
import { toScheduleConfigForm } from '../../../services/scheduleConfig';
import { INTERVAL_OPTIONS, cardStyle, formLayout, type GameDetail, type ScheduleResponse } from './keralaShared';

const ScheduleTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autoGenerate = Form.useWatch('autoGenerate', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`schedule/${detail.id}`)) as ScheduleResponse;
      const c = res.config;
      const scheduledDrawTimes = Array.isArray(c?.scheduledDrawTimes)
        ? c.scheduledDrawTimes.filter(Boolean).map((t) => dayjs(t))
        : c?.scheduledDrawTime
          ? [dayjs(c.scheduledDrawTime)]
          : [];
      form.setFieldsValue({
        ...toScheduleConfigForm(res),
        scheduledDrawTimes,
        startDate: c?.startDate ? dayjs(c.startDate) : null,
      });
    } catch {
      message.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [detail.id, form]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const isManual = v.autoGenerate === false;
      const scheduledDrawTimes =
        isManual && Array.isArray(v.scheduledDrawTimes)
          ? (v.scheduledDrawTimes as Dayjs[])
              .filter(Boolean)
              .map((d) => d.toISOString())
          : undefined;
      const startDate =
        isManual && v.startDate ? (v.startDate as Dayjs).toISOString() : null;
      await api.post(`schedule/${detail.id}`, {
        roundDuration: v.drawInterval,
        drawInterval: v.drawInterval,
        stopBetBefore: v.stopBetBefore,
        drawDelay: v.drawDelay,
        autoGenerate: v.autoGenerate,
        scheduledDrawTimes,
        startDate,
      });
      message.success('Schedule updated');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Card style={cardStyle} loading>
        <div style={{ height: 200 }} />
      </Card>
    );

  return (
    <Form {...formLayout} form={form}>
      <Card
        title={
          <>
            <CalendarOutlined /> Draw Schedule
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 880 }}
      >
        <Form.Item
          name="autoGenerate"
          label="Draw Mode"
          valuePropName="checked"
          extra="Auto = recurring rounds; Manual = one-time draw at a set time."
        >
          <Switch checkedChildren="Auto Draw" unCheckedChildren="Manual Draw" />
        </Form.Item>
        {autoGenerate === false ? (
          <>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Manual one-time lottery"
              description="Tickets sell until the draw time you set below. When that time is reached, open the lottery and trigger the single draw from the Result & Draw tab. It runs once and does not repeat."
            />
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
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Draw Times"
                  required
                  extra="Each time = one round drawn at that moment."
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
                                  // On EDIT, existing draw times are often
                                  // already past (in-flight lottery), so no
                                  // future-time rule here — only required.
                                ]}
                              >
                                <DatePicker
                                  showTime={{
                                    format: 'hh:mm A',
                                    use12Hours: true,
                                  }}
                                  format="YYYY-MM-DD hh:mm A"
                                  size="large"
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
              <Col xs={12} md={12}>
                <Form.Item
                  name="stopBetBefore"
                  label="Stop Bet Before (sec)"
                  rules={[{ required: true }]}
                  extra="Ticket sales close this many seconds before the draw time"
                >
                  <InputNumber
                    min={0}
                    max={86400}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="drawInterval"
                label="Round Interval"
                rules={[{ required: true }]}
                extra="How often a new round opens"
              >
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  options={INTERVAL_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="stopBetBefore"
                label="Stop Bet Before (sec)"
                rules={[{ required: true }]}
                extra="Lock betting this many seconds before draw"
              >
                <InputNumber
                  min={1}
                  max={3600}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="drawDelay"
                label="Draw Delay (sec)"
                rules={[{ required: true }]}
                extra="Wait after close before resolving"
              >
                <InputNumber
                  min={0}
                  max={300}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Schedule
        </Button>
      </Card>
    </Form>
  );
};

export default ScheduleTab;

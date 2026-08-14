import { useEffect, useState, useCallback } from 'react';
import { Button, Row, Col, message, Card, Switch, Select, InputNumber, Form } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { toScheduleConfigForm } from '../../services/scheduleConfig';
import { type ScheduleConfigRaw } from '../../services/scheduleConfig';
import PageLoader from '../../components/PageLoader';
import { useConfigStore } from '../../store/configStore';

const ScheduleTab = ({
  gameId,
  reload,
}: {
  gameId: number;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`schedule/${gameId}`)) as ScheduleConfigRaw;
      form.setFieldsValue(toScheduleConfigForm(res));
    } catch {
      message.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.post(`schedule/${gameId}`, {
        roundDuration: v.drawInterval,
        drawInterval: v.drawInterval,
        stopBetBefore: v.stopBetBefore,
        drawDelay: v.drawDelay,
        autoGenerate: v.autoGenerate,
      });
      message.success('Schedule updated');
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
    <Card style={{ borderRadius: 12, maxWidth: 760 }}>
      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="drawInterval"
              label="Round Interval"
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
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="stopBetBefore"
              label="Stop Bet Before (sec)"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                max={3600}
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="drawDelay"
              label="Draw Delay (sec)"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={300}
                style={{ width: '100%' }}
                size="large"
              />
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
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Schedule
        </Button>
      </Form>
    </Card>
  );
};

export default ScheduleTab;

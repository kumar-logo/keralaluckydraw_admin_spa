import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, Switch, Typography, message } from 'antd';
import { FieldNumberOutlined, SafetyCertificateOutlined, SaveOutlined, TagsOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { cardStyle, formLayout, type GameDetail, type ConfigResponse } from './keralaShared';

const { Text } = Typography;

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
  const [prefixes, setPrefixes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as ConfigResponse;
      const k = cfg.kerala || {};
      form.setFieldsValue({
        ticketLength: k.ticketLength,
        prefix1st: k.prefix1st,
        canInsurance: !!k.canInsurance,
        insuranceRate: k.insuranceRate,
      });
      setPrefixes((cfg.prefixes || []).join(', '));
    } catch {
      message.error('Failed to load configuration');
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
      await api.put(`games/${detail.id}/config`, {
        kerala: {
          ticketLength: v.ticketLength,
          prefix1st: (v.prefix1st || '').trim().toUpperCase() || null,
          canInsurance: v.canInsurance ? 1 : 0,
          insuranceRate: v.insuranceRate,
        },
        prefixes: prefixes
          .split(/[\s,]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
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

  if (loading)
    return (
      <Card style={cardStyle} loading>
        <div style={{ height: 220 }} />
      </Card>
    );

  return (
    <Form {...formLayout} form={form}>
      <Card
        title={
          <>
            <FieldNumberOutlined /> Ticket Mechanics
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={12} md={8}>
            <Form.Item
              name="ticketLength"
              label="Ticket Length"
              extra="Number of digits in a ticket number"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} max={12} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="prefix1st"
              label="1st-Prize Prefix"
              extra="Letter prefix for the 1st-prize ticket (e.g. O)"
            >
              <Input
                maxLength={8}
                placeholder="O"
                style={{ textTransform: 'uppercase' }}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SafetyCertificateOutlined /> Insurance
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]} align="bottom">
          <Col xs={12} md={8}>
            <Form.Item
              name="canInsurance"
              label="Allow Insurance"
              valuePropName="checked"
              extra="Let players insure their ticket"
            >
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="insuranceRate"
              label="Insurance Rate"
              extra="Decimal fraction — 0.1000 = 10% of stake"
            >
              <InputNumber
                min={0}
                max={1}
                step={0.0001}
                precision={4}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <TagsOutlined /> 2nd-Place Prefixes
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 960 }}
      >
        <Input.TextArea
          rows={2}
          value={prefixes}
          onChange={(e) => setPrefixes(e.target.value)}
          placeholder="Comma or space separated — e.g. A, B, C, D, E"
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          Allowed 2nd-place letter prefixes for Kerala ticket numbers (stored in
          game_number_prefix). Auto-uppercased on save.
        </Text>
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

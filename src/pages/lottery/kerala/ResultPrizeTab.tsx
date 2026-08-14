import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Empty, Form, Input, InputNumber, Row, Select, Tooltip, Typography, message } from 'antd';
import { CrownOutlined, DeleteOutlined, GiftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { PRIZE_COUNT_FIELDS, cardStyle, formLayout, PRIZE_TIER_OPTIONS, type PrizeTier, type GameDetail, type ConfigResponse } from './keralaShared';

const { Text } = Typography;

const ResultPrizeTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<PrizeTier[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as ConfigResponse;
      const k = cfg.kerala || {};
      form.setFieldsValue({
        secondCount: k.secondCount,
        thirdCount: k.thirdCount,
        fourthCount: k.fourthCount,
        fifthCount: k.fifthCount,
        consolationCount: k.consolationCount,
      });
      setTiers(
        (cfg.prizeTiers || []).map((t) => ({
          level: t.level,
          prizeLabel: t.prize ?? t.prizeLabel,
          prizeValue: t.intPrize ?? t.prizeValue ?? 0,
          tierName: t.tierName,
          matchRule: t.matchRule,
        })),
      );
    } catch {
      message.error('Failed to load prize config');
    } finally {
      setLoading(false);
    }
  }, [detail.id, form]);

  useEffect(() => {
    load();
  }, [load]);

  const setTier = (i: number, key: keyof PrizeTier, val: unknown) =>
    setTiers((list) =>
      list.map((t, j) => (j === i ? { ...t, [key]: val } : t)),
    );

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}/config`, {
        kerala: {
          secondCount: v.secondCount,
          thirdCount: v.thirdCount,
          fourthCount: v.fourthCount,
          fifthCount: v.fifthCount,
          consolationCount: v.consolationCount,
        },
        prizeTiers: tiers
          .filter((t) => t.level !== undefined && t.level !== null)
          .map((t) => ({
            level: Number(t.level),
            prizeLabel: t.prizeLabel,
            prizeValue: Number(t.prizeValue) || 0,
            tierName: t.tierName,
            matchRule: t.matchRule,
          })),
      });
      message.success('Prize config saved');
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
        <div style={{ height: 240 }} />
      </Card>
    );

  return (
    <Form {...formLayout} form={form}>
      <Card
        title={
          <>
            <GiftOutlined /> Prize Tiers
          </>
        }
        size="small"
        style={cardStyle}
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() =>
              setTiers((l) => [
                ...l,
                { level: l.length + 1, prizeLabel: '', prizeValue: 0 },
              ])
            }
          >
            Add Tier
          </Button>
        }
      >
        {tiers.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No prize tiers configured"
            style={{ margin: '8px 0 16px' }}
          />
        ) : (
          <>
            <Row
              gutter={[12, 0]}
              style={{ marginBottom: 8, fontSize: 12, fontWeight: 600 }}
            >
              <Col xs={5} md={3}>
                Level
              </Col>
              <Col xs={9} md={6}>
                Tier (match rule)
              </Col>
              <Col xs={8} md={5}>
                Label
              </Col>
              <Col xs={10} md={8}>
                Prize Amount (₹)
              </Col>
              <Col xs={2} md={2} />
            </Row>
            {tiers.map((t, i) => (
              <Row
                key={i}
                gutter={[12, 0]}
                align="middle"
                style={{ marginBottom: 10 }}
              >
                <Col xs={5} md={3}>
                  <InputNumber
                    placeholder="Level"
                    min={1}
                    value={t.level}
                    onChange={(val) => setTier(i, 'level', val)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={9} md={6}>
                  <Select
                    placeholder="Match tier"
                    allowClear
                    value={t.tierName}
                    onChange={(val) => setTier(i, 'tierName', val)}
                    options={PRIZE_TIER_OPTIONS}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={8} md={5}>
                  <Input
                    placeholder="e.g. 1st Prize"
                    value={t.prizeLabel}
                    onChange={(e) => setTier(i, 'prizeLabel', e.target.value)}
                  />
                </Col>
                <Col xs={10} md={8}>
                  <InputNumber
                    placeholder="Prize amount"
                    min={0}
                    precision={2}
                    prefix="₹"
                    value={t.prizeValue}
                    onChange={(val) => setTier(i, 'prizeValue', val)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={2} md={2} style={{ textAlign: 'right' }}>
                  <Tooltip title="Remove tier">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setTiers((l) => l.filter((_, j) => j !== i))
                      }
                    />
                  </Tooltip>
                </Col>
              </Row>
            ))}
          </>
        )}
      </Card>

      <Card
        title={
          <>
            <CrownOutlined /> Winner Counts
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Row gutter={[16, 0]}>
          {PRIZE_COUNT_FIELDS.map((f) => (
            <Col xs={12} md={8} lg={6} key={f.name}>
              <Form.Item name={f.name} label={f.label}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          ))}
        </Row>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Number of winning tickets drawn for each prize level.
        </Text>
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save Prize Config
      </Button>
    </Form>
  );
};

export default ResultPrizeTab;

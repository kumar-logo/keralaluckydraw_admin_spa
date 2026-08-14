import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, ColorPicker, Empty, Form, Input, InputNumber, Row, Space, message } from 'antd';
import { BgColorsOutlined, DeleteOutlined, PictureOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import ImageUpload from '../../../components/ImageUpload';
import { toHex, str, GRADIENT_PRESETS, num, DEFAULT_GRADIENT, type BoxDetail, type BoxGradient, type ConfigResponse } from './mysteryBoxShared';

const UiTab = ({
  detail,
  reload,
}: {
  detail: BoxDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [gradients, setGradients] = useState<BoxGradient[]>([]);

  const load = useCallback(async () => {
    form.setFieldsValue({
      emoji: detail.emoji,
      description: detail.description,
      iconUrl: detail.iconUrl,
      bannerUrl: detail.bannerUrl,
      thumbnailUrl: detail.thumbnailUrl,
      lobbyIconUrl: detail.lobbyIconUrl,
      imgId: detail.imgId,
      themeColor: detail.themeColor,
      bgColor: detail.bgColor,
      textColor: detail.textColor,
      borderColor: detail.borderColor,
    });
    try {
      const cfg = (await api.get(
        `games/${detail.id}/config`,
      )) as ConfigResponse;
      setGradients(
        (Array.isArray(cfg.gradients) ? cfg.gradients : []).map((g, i) => ({
          id: g.id,
          gradient: str(g.gradient),
          sortOrder: g.sortOrder ?? i,
        })),
      );
    } catch {
      setGradients([]);
    }
  }, [detail, form]);
  useEffect(() => {
    load();
  }, [load]);

  const setGrad = (
    i: number,
    key: keyof BoxGradient,
    val: string | number,
  ) =>
    setGradients((list) =>
      list.map((g, j) => (j === i ? { ...g, [key]: val } : g)),
    );

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        emoji: v.emoji,
        description: v.description,
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
        lobbyIconUrl: v.lobbyIconUrl,
        imgId: v.imgId,
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      await api.put(`games/${detail.id}/ui-config`, {
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      await api.put(`games/${detail.id}/config`, {
        gradients: gradients
          .filter((g) => g.gradient.trim())
          .map((g, i) => ({
            id: g.id,
            gradient: g.gradient,
            sortOrder: g.sortOrder ?? i,
          })),
      });
      message.success('UI saved');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <PictureOutlined /> Images
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={[24, 16]}>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Icon
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Banner
            </div>
            <Form.Item name="bannerUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Thumbnail
            </div>
            <Form.Item name="thumbnailUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Lobby Icon
            </div>
            <Form.Item name="lobbyIconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col xs={24} md={8}>
            <Form.Item
              name="imgId"
              label="Image ID"
              extra="Reference to an uploaded image asset (optional)"
            >
              <Input placeholder="img_id" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Branding &amp; Colours
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji">
              <Input maxLength={4} placeholder="🎁" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="themeColor" label="Theme Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="bgColor" label="Background Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="textColor" label="Text Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="borderColor" label="Border Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Mystery Box Gradients
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() =>
              setGradients((l) => [
                ...l,
                {
                  gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                  sortOrder: l.length,
                },
              ])
            }
          >
            Add Gradient
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Box face gradients"
          description="These CSS gradients are cycled across the mystery boxes shown to players. Click a preset to add it, then fine-tune the CSS."
        />
        <Space size={8} wrap style={{ marginBottom: 16 }}>
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              title="Add this gradient"
              onClick={() =>
                setGradients((l) => [
                  ...l,
                  { gradient: preset, sortOrder: l.length },
                ])
              }
              style={{
                width: 56,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border-light)',
                background: preset,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </Space>
        {gradients.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No gradients configured"
            style={{ margin: '8px 0 16px' }}
          />
        )}
        {gradients.map((g, i) => (
          <Row key={i} gutter={[8, 8]} align="middle" style={{ marginBottom: 8 }}>
            <Col xs={6} md={3}>
              <div
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: g.gradient ? g.gradient : DEFAULT_GRADIENT,
                }}
              />
            </Col>
            <Col xs={18} md={15}>
              <Input
                placeholder="CSS gradient — e.g. linear-gradient(135deg, #f6d365, #fda085)"
                value={g.gradient}
                onChange={(e) => setGrad(i, 'gradient', e.target.value)}
              />
            </Col>
            <Col xs={16} md={4}>
              <InputNumber
                addonBefore="Sort"
                min={0}
                value={g.sortOrder}
                onChange={(val) => setGrad(i, 'sortOrder', num(val))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={8} md={2} style={{ textAlign: 'right' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  setGradients((l) => l.filter((_, j) => j !== i))
                }
              />
            </Col>
          </Row>
        ))}
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save UI / Colours
      </Button>
    </Form>
  );
};

export default UiTab;

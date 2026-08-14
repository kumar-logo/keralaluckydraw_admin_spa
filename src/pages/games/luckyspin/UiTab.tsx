import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, ColorPicker, Divider, Form, Input, Row, message } from 'antd';
import { BgColorsOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import ImageUpload from '../../../components/ImageUpload';
import { toHex, cardStyle, type SpinDetail, type UiFormValues, type ConfigResponse } from './luckySpinShared';

const UiTab = ({
  detail,
  reload,
}: {
  detail: SpinDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm<UiFormValues>();
  const [saving, setSaving] = useState(false);
  const [coverImgId, setCoverImgId] = useState<string>('');

  const load = useCallback(async () => {
    form.setFieldsValue({
      emoji: detail.emoji,
      description: detail.description,
      iconUrl: detail.iconUrl,
      bannerUrl: detail.bannerUrl,
      thumbnailUrl: detail.thumbnailUrl,
      themeColor: detail.themeColor,
      bgColor: detail.bgColor,
      textColor: detail.textColor,
      borderColor: detail.borderColor,
    });
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as ConfigResponse;
      setCoverImgId(cfg.wheel?.coverImgId ? cfg.wheel.coverImgId : '');
    } catch {
      setCoverImgId('');
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
        emoji: v.emoji,
        description: v.description,
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      await api.put(`games/${detail.id}/config`, {
        wheel: { coverImgId },
      });
      message.success('UI saved');
      reload();
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
        style={cardStyle}
      >
        <Row gutter={24}>
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
        </Row>
        <Divider style={{ margin: '12px 0' }} />
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Wheel Cover Image ID"
              extra="Optional centre-of-wheel cover image"
            >
              <Input
                value={coverImgId}
                onChange={(e) => setCoverImgId(e.target.value)}
                placeholder="Optional cover image id"
                allowClear
              />
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
        style={cardStyle}
      >
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji">
              <Input maxLength={4} placeholder="optional" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Short game description shown to players" />
        </Form.Item>
        <Row gutter={16}>
          <Col>
            <Form.Item name="themeColor" label="Theme Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="bgColor" label="Background Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="textColor" label="Text Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="borderColor" label="Border Color">
              <ColorPicker showText />
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
        Save UI / Colours
      </Button>
    </Form>
  );
};

export default UiTab;

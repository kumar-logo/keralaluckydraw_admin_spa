import { useEffect, useState } from 'react';
import { Button, Card, Col, ColorPicker, Form, Input, Row, message } from 'antd';
import { BgColorsOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import ImageUpload from '../../../components/ImageUpload';
import { toHex, type GameDetail } from './dubaiShared';

const UiTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      emoji: detail.emoji,
      description: detail.description,
      iconUrl: detail.iconUrl,
      bannerUrl: detail.bannerUrl,
      thumbnailUrl: detail.thumbnailUrl,
      lobbyIconUrl: detail.lobbyIconUrl,
      themeColor: detail.themeColor,
      bgColor: detail.bgColor,
      textColor: detail.textColor,
      borderColor: detail.borderColor,
    });
  }, [detail, form]);

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
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      message.success('Appearance saved');
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
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={8} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Icon
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Banner
            </div>
            <Form.Item name="bannerUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Thumbnail
            </div>
            <Form.Item name="thumbnailUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Lobby Icon
            </div>
            <Form.Item name="lobbyIconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Branding & Colours
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji" extra="Short symbol/badge.">
              <Input maxLength={4} placeholder="optional" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={18}>
            <Form.Item
              name="description"
              label="Description"
              extra="Optional blurb shown on the game card / info panel."
            >
              <Input.TextArea
                rows={2}
                style={{ width: '100%' }}
                placeholder="Short description shown to players…"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={12} md={6}>
            <Form.Item name="themeColor" label="Theme Colour">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="bgColor" label="Background Colour">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="textColor" label="Text Colour">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="borderColor" label="Border Colour">
              <ColorPicker showText style={{ width: '100%' }} />
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
        Save Appearance
      </Button>
    </Form>
  );
};

export default UiTab;

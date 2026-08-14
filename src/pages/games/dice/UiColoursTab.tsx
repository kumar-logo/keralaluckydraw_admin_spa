import { useEffect, useState } from 'react';
import { Button, Input, Form, Card, Row, Col, Divider, ColorPicker, message } from 'antd';
import { SaveOutlined, BgColorsOutlined, PictureOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import ImageUpload from '../../../components/ImageUpload';
import { toHex, type TabProps } from './diceShared';

const { TextArea } = Input;

const UiColoursTab = ({ detail, reload }: TabProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      emoji: detail.emoji,
      gameName: detail.gameName,
      description: detail.description,
      themeColor: detail.themeColor,
      bgColor: detail.bgColor,
      textColor: detail.textColor,
      borderColor: detail.borderColor,
      iconUrl: detail.iconUrl,
      bannerUrl: detail.bannerUrl,
      thumbnailUrl: detail.thumbnailUrl,
      lobbyIconUrl: detail.lobbyIconUrl,
      imgId: detail.imgId,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        emoji: v.emoji,
        gameName: v.gameName,
        description: v.description,
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
        lobbyIconUrl: v.lobbyIconUrl,
        imgId: v.imgId,
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
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Icon
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Banner
            </div>
            <Form.Item name="bannerUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Thumbnail
            </div>
            <Form.Item name="thumbnailUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Lobby Icon
            </div>
            <Form.Item name="lobbyIconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="imgId"
              label="Image Asset ID"
              extra="Optional CDN / sprite asset identifier."
            >
              <Input placeholder="e.g. dice_default" allowClear />
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
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="gameName" label="Display Name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji" extra="Lobby tile emoji.">
              <Input maxLength={4} placeholder="optional" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="description"
          label="Description"
          extra="Short tagline shown on the game card."
        >
          <TextArea rows={2} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Form.Item name="themeColor" label="Theme Color">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="bgColor" label="Background Color">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="textColor" label="Text Color">
              <ColorPicker showText style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="borderColor" label="Border Color">
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

export default UiColoursTab;

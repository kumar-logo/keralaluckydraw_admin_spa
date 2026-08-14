import { useEffect, useState } from 'react';
import { Button, Card, Col, ColorPicker, Form, Input, Row, message } from 'antd';
import { BgColorsOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { toHex, cardStyle, formLayout, type GameDetail } from './keralaShared';

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
      iconUrl: detail.iconUrl,
      bannerUrl: detail.bannerUrl,
      thumbnailUrl: detail.thumbnailUrl,
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
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
      });
      await api.put(`games/${detail.id}/ui-config`, {
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      message.success('UI settings saved');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...formLayout} form={form}>
      <Card
        title={
          <>
            <PictureOutlined /> Images
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="iconUrl"
              label="Icon URL"
              extra="Square game icon"
            >
              <Input placeholder="https://…" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="bannerUrl"
              label="Banner URL"
              extra="Wide promo banner"
            >
              <Input placeholder="https://…" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="thumbnailUrl"
              label="Thumbnail URL"
              extra="Lobby thumbnail"
            >
              <Input placeholder="https://…" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Colours
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Row gutter={[24, 16]}>
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

      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save UI Settings
      </Button>
    </Form>
  );
};

export default UiTab;

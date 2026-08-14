import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Switch, message } from 'antd';
import { ProfileOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { cardStyle, formLayout, type GameDetail } from './keralaShared';

const BasicTab = ({
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
      gameName: detail.gameName,
      gameCode: detail.gameCode,
      gameType: detail.gameType,
      status: detail.status === 1,
      emoji: detail.emoji,
      description: detail.description,
      sortOrder: detail.sortOrder,
      groupName: detail.groupName,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        gameType: v.gameType,
        status: v.status ? 1 : 0,
        emoji: v.emoji,
        description: v.description,
        sortOrder: v.sortOrder,
        groupName: v.groupName,
      });
      message.success('Basic details saved');
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
            <ProfileOutlined /> Identity
          </>
        }
        size="small"
        style={{ ...cardStyle, maxWidth: 960 }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameName"
              label="Display Name"
              rules={[{ required: true, message: 'Enter a display name' }]}
              extra="Shown to players in the lobby"
            >
              <Input placeholder="Kerala Lottery" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="gameCode"
              label="Game Code"
              extra="System identifier (read-only)"
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="gameType"
              label="Game Type"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: '100%' }}
                options={[{ value: 'kerala', label: 'Kerala' }]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={12} md={6}>
            <Form.Item
              name="status"
              label="Status"
              valuePropName="checked"
              extra="Active = playable in the app"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji" extra="Optional badge icon">
              <Input maxLength={4} placeholder="🎫" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="sortOrder"
              label="Sort Order"
              extra="Lower shows first"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="groupName"
              label="Group Name"
              extra="Lobby grouping label"
            >
              <Input placeholder="e.g. Kerala" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="description"
          label="Description"
          extra="Short blurb shown to players"
        >
          <Input.TextArea rows={3} placeholder="Shown to players" allowClear />
        </Form.Item>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Basic Details
        </Button>
      </Card>
    </Form>
  );
};

export default BasicTab;

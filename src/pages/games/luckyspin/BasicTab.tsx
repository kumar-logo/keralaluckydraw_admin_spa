import { useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Form, Input, InputNumber, Row, Select, Space, Switch, Tag, message } from 'antd';
import { IdcardOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { formatDateTime } from '../../../utils/format';
import { SOURCE_OPTIONS, DEFAULT_SOURCE, STATUS_OPTIONS, cardStyle, type SpinDetail, type BasicForm } from './luckySpinShared';

const BasicTab = ({
  detail,
  reload,
  control,
}: {
  detail: SpinDetail;
  reload: () => void;
  control: (action: string) => void;
}) => {
  const [form] = Form.useForm<BasicForm>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      gameCode: detail.gameCode,
      gameName: detail.gameName,
      status: detail.status,
      source: detail.source ? detail.source : DEFAULT_SOURCE,
      provider: detail.provider,
      groupName: detail.groupName,
      categoryId: detail.categoryId,
      sortOrder: detail.sortOrder ?? 0,
      isHot: detail.isHot === 1,
      lobbyIconUrl: detail.lobbyIconUrl,
      imgId: detail.imgId,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameCode: v.gameCode,
        gameName: v.gameName,
        status: v.status,
        source: v.source,
        provider: v.provider,
        groupName: v.groupName,
        categoryId: v.categoryId,
        sortOrder: v.sortOrder,
        isHot: v.isHot ? 1 : 0,
        lobbyIconUrl: v.lobbyIconUrl,
        imgId: v.imgId,
      });
      message.success('Game updated');
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
            <IdcardOutlined /> Identity & Placement
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, lg: 4 }}
          size="small"
          style={{ marginBottom: 20 }}
        >
          <Descriptions.Item label="Game ID">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="Game Type">
            <Tag color="purple">{detail.gameType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {formatDateTime(detail.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {formatDateTime(detail.updatedAt)}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16}>
          <Col xs={24} md={10}>
            <Form.Item
              name="gameName"
              label="Display Name"
              rules={[{ required: true, message: 'Display name is required' }]}
            >
              <Input placeholder="Lucky Spin" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="gameCode"
              label="Game Code"
              extra="Unique internal identifier"
            >
              <Input placeholder="lucky_wheel" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="status" label="Status">
              <Select options={STATUS_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="source" label="Source">
              <Select options={SOURCE_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="provider" label="Provider">
              <Input placeholder="TK" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="groupName"
              label="Group"
              extra="Lobby grouping label"
            >
              <Input placeholder="Mini Games" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="categoryId"
              label="Category ID"
              extra="Lobby category"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
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
              name="isHot"
              label="Hot Badge"
              valuePropName="checked"
              extra="Show a HOT tag"
            >
              <Switch checkedChildren="Hot" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item
              name="lobbyIconUrl"
              label="Lobby Icon URL"
              extra="Optional lobby-specific icon"
            >
              <Input placeholder="https://…" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="imgId" label="Image ID" extra="CDN image id">
              <Input placeholder="Optional" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Basic Info
        </Button>
      </Card>

      <Card
        title={
          <>
            <ThunderboltOutlined /> Live State
          </>
        }
        size="small"
        style={cardStyle}
      >
        <Space size={32} wrap>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Paused
            </div>
            <Switch
              checked={detail.isPaused === 1}
              checkedChildren="Paused"
              unCheckedChildren="Live"
              onChange={(c) => control(c ? 'pause' : 'resume')}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Hidden
            </div>
            <Switch
              checked={detail.isHidden === 1}
              checkedChildren="Hidden"
              unCheckedChildren="Visible"
              onChange={(c) => control(c ? 'hide' : 'show')}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Emergency Stop
            </div>
            <Switch
              checked={detail.emergencyStop === 1}
              checkedChildren="Stopped"
              unCheckedChildren="Normal"
              onChange={(c) =>
                control(c ? 'emergency-stop' : 'emergency-resume')
              }
            />
          </div>
        </Space>
      </Card>
    </Form>
  );
};

export default BasicTab;

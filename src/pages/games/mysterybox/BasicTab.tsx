import { useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Form, Input, InputNumber, Row, Select, Space, Switch, Tag, message } from 'antd';
import { PauseCircleOutlined, ProfileOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { formatDateTime, orDash } from '../../../utils/format';
import { DEFAULT_SOURCE, fmtDuration, num, type BoxDetail } from './mysteryBoxShared';

const BasicTab = ({
  detail,
  reload,
  control,
}: {
  detail: BoxDetail;
  reload: () => void;
  control: (action: string) => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      gameCode: detail.gameCode,
      gameName: detail.gameName,
      status: detail.status,
      categoryId: detail.categoryId,
      source: detail.source,
      provider: detail.provider,
      groupName: detail.groupName,
      sortOrder: detail.sortOrder ?? 0,
      isHot: detail.isHot === 1,
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
        categoryId: v.categoryId ?? null,
        source: v.source ? v.source : DEFAULT_SOURCE,
        provider: v.provider ? v.provider : DEFAULT_SOURCE,
        groupName: v.groupName || null,
        sortOrder: num(v.sortOrder),
        isHot: v.isHot ? 1 : 0,
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
    <>
      <Card
        title={
          <>
            <ProfileOutlined /> Identity
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, lg: 3 }}
          size="small"
        >
          <Descriptions.Item label="Game ID">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="Game Type">
            <Tag color="purple">{detail.gameType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Draw Interval">
            {fmtDuration(detail.drawInterval)}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDateTime(detail.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {formatDateTime(detail.updatedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Updated By">
            {orDash(detail.updatedBy)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> Game Metadata
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="gameName"
                label="Display Name"
                rules={[{ required: true, message: 'Display name is required' }]}
              >
                <Input placeholder="e.g. Lucky Mystery Box" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="gameCode"
                label="Game Code"
                extra="Unique internal identifier"
              >
                <Input placeholder="e.g. box_lucky" />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name="status"
                label="Status"
                extra="Disabled hides the box everywhere"
              >
                <Select
                  options={[
                    { value: 1, label: 'Active' },
                    { value: 0, label: 'Disabled' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item
                name="categoryId"
                label="Category ID"
                extra="Lobby category grouping"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="groupName"
                label="Group Name"
                extra="Optional lobby group label"
              >
                <Input placeholder="e.g. Featured" allowClear />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="source"
                label="Source"
                extra="Platform source code (default TK)"
              >
                <Input placeholder="TK" allowClear />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="provider"
                label="Provider"
                extra="Game provider (default TK)"
              >
                <Input placeholder="TK" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} align="bottom">
            <Col xs={12} md={6}>
              <Form.Item
                name="sortOrder"
                label="Sort Order"
                extra="Lower shows first in lobby"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="isHot"
                label="Hot Badge"
                valuePropName="checked"
                extra="Show the HOT tag"
              >
                <Switch checkedChildren="Hot" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={save}
            loading={saving}
          >
            Save Metadata
          </Button>
        </Form>
      </Card>

      <Card
        title={
          <>
            <PauseCircleOutlined /> State Toggles
          </>
        }
        size="small"
        style={{ borderRadius: 12 }}
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
              Hidden in Lobby
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
    </>
  );
};

export default BasicTab;

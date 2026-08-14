import { useEffect, useState } from 'react';
import { Tag, Button, Switch, Select, Input, InputNumber, Form, Card, Row, Col, Descriptions, Divider, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { formatDateTime } from '../../../utils/format';
import { DEFAULT_LOTTERY_TYPE, type TabProps } from './diceShared';

const BasicTab = ({ detail, reload }: TabProps) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      gameName: detail.gameName,
      status: detail.status === 1,
      isHidden: detail.isHidden === 1,
      isPaused: detail.isPaused === 1,
      source: detail.source,
      provider: detail.provider,
      groupName: detail.groupName,
      categoryId: detail.categoryId,
      lotteryType: detail.lotteryType ? detail.lotteryType : DEFAULT_LOTTERY_TYPE,
      sortOrder: detail.sortOrder,
      isHot: detail.isHot === 1,
      isThirdParty: detail.isThirdParty === 1,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        status: v.status ? 1 : 0,
        isHidden: v.isHidden ? 1 : 0,
        isPaused: v.isPaused ? 1 : 0,
        source: v.source,
        provider: v.provider,
        groupName: v.groupName,
        categoryId: v.categoryId,
        lotteryType: v.lotteryType,
        sortOrder: v.sortOrder,
        isHot: v.isHot ? 1 : 0,
        isThirdParty: v.isThirdParty ? 1 : 0,
      });
      message.success('Basic info saved');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ borderRadius: 12 }}>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Game ID">{detail.id}</Descriptions.Item>
        <Descriptions.Item label="Game Code">
          <span style={{ fontFamily: 'monospace' }}>{detail.gameCode}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Game Type">
          <Tag color="purple">{detail.gameType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated">
          {formatDateTime(detail.updatedAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Emergency Stop">
          {detail.emergencyStop === 1 ? (
            <Tag color="red">Stopped</Tag>
          ) : (
            <Tag color="green">Normal</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameName"
              label="Game Name"
              rules={[{ required: true }]}
              extra="Shown to players in the lobby and bet screen."
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="groupName"
              label="Group Name"
              extra="Lobby grouping tab, e.g. Dice."
            >
              <Input placeholder="e.g. Dice" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="categoryId"
              label="Category ID"
              extra="Lobby category reference."
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="source" label="Source">
              <Input placeholder="e.g. TK" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="provider" label="Provider">
              <Input placeholder="e.g. TK" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="lotteryType"
              label="Draw Type"
              extra="Auto = scheduler draws. Manual = admin draws."
            >
              <Select
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'manual', label: 'Manual' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="sortOrder"
              label="Sort Order"
              extra="Lower shows first in the lobby."
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left" style={{ margin: '4px 0 16px' }}>
          Visibility & State
        </Divider>
        <Row gutter={16}>
          <Col xs={12} md={5}>
            <Form.Item
              name="status"
              label="Status"
              valuePropName="checked"
              extra="Active / Disabled"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
            </Form.Item>
          </Col>
          <Col xs={12} md={5}>
            <Form.Item
              name="isPaused"
              label="Paused"
              valuePropName="checked"
              extra="Pause / Resume"
            >
              <Switch checkedChildren="Paused" unCheckedChildren="Running" />
            </Form.Item>
          </Col>
          <Col xs={12} md={5}>
            <Form.Item
              name="isHidden"
              label="Hidden"
              valuePropName="checked"
              extra="Show / Hide"
            >
              <Switch checkedChildren="Hidden" unCheckedChildren="Visible" />
            </Form.Item>
          </Col>
          <Col xs={12} md={5}>
            <Form.Item name="isHot" label="Hot" valuePropName="checked">
              <Switch checkedChildren="Hot" unCheckedChildren="No" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              name="isThirdParty"
              label="Third Party"
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '4px 0 16px' }} />
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Basic Info
        </Button>
      </Form>
    </Card>
  );
};

export default BasicTab;

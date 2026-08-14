import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, Row, Col, Descriptions, Tag, Space, Popconfirm, Divider, message } from 'antd';
import { SaveOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined, EyeInvisibleOutlined, StopOutlined, ProfileOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { formatDateTime, orDash } from '../../../utils/format';
import { type RaceGameDetail } from './raceShared';

const BasicTab = ({
  detail,
  reload,
  control,
}: {
  detail: RaceGameDetail;
  reload: () => void;
  control: (action: string) => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      gameName: detail.gameName,
      gameCode: detail.gameCode,
      categoryId: detail.categoryId,
      status: detail.status === 1,
      isHot: detail.isHot === 1,
      isHidden: detail.isHidden === 1,
      groupName: detail.groupName,
      sortOrder: detail.sortOrder,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        gameCode: v.gameCode,
        categoryId: v.categoryId ?? null,
        status: v.status ? 1 : 0,
        isHot: v.isHot ? 1 : 0,
        isHidden: v.isHidden ? 1 : 0,
        groupName: v.groupName,
        sortOrder: v.sortOrder,
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
    <Card
      title={
        <>
          <ProfileOutlined /> Identity & Visibility
        </>
      }
      size="small"
      style={{ borderRadius: 12, maxWidth: 960 }}
    >
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 4 }}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Game Code">
          {detail.gameCode}
        </Descriptions.Item>
        <Descriptions.Item label="Game Type">
          <Tag>{detail.gameType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Source">
          {orDash(detail.source)}
        </Descriptions.Item>
        <Descriptions.Item label="Provider">
          {orDash(detail.provider)}
        </Descriptions.Item>
      </Descriptions>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameName"
              label="Game Name"
              rules={[{ required: true, message: 'Enter a name' }]}
            >
              <Input placeholder="Display name shown in the lobby" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameCode"
              label="Game Code"
              extra="Unique identifier — must not collide with another game"
              rules={[{ required: true, message: 'Enter a code' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="groupName" label="Group Name" extra="Lobby grouping">
              <Input placeholder="e.g. Race Games" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Form.Item
              name="categoryId"
              label="Category ID"
              extra="Lobby category"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Form.Item
              name="sortOrder"
              label="Sort Order"
              extra="Lower = first"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={4}>
            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Off" />
            </Form.Item>
          </Col>
          <Col xs={8} md={4}>
            <Form.Item name="isHot" label="Hot" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
          <Col xs={8} md={4}>
            <Form.Item name="isHidden" label="Hidden" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
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
      </Form>

      <Divider />

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
      >
        <Descriptions.Item label="Created At">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {formatDateTime(detail.updatedAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Classification">
          <Space>
            <Tag color={detail.isLottery === 1 ? 'purple' : 'default'}>
              {detail.isLottery === 1 ? 'Lottery' : 'Not Lottery'}
            </Tag>
            <Tag color={detail.isThirdParty === 1 ? 'geekblue' : 'default'}>
              {detail.isThirdParty === 1 ? 'Third Party' : 'In-House'}
            </Tag>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Live Game Control</Divider>
      <Space wrap>
        <span>
          Paused:{' '}
          {detail.isPaused === 1 ? (
            <Tag color="orange">Yes</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </span>
        {detail.isPaused === 1 ? (
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => control('resume')}
          >
            Resume
          </Button>
        ) : (
          <Button
            icon={<PauseCircleOutlined />}
            onClick={() => control('pause')}
          >
            Pause
          </Button>
        )}
        <Divider type="vertical" />
        <span>
          Hidden:{' '}
          {detail.isHidden === 1 ? <Tag>Yes</Tag> : <Tag color="green">No</Tag>}
        </span>
        {detail.isHidden === 1 ? (
          <Button icon={<EyeOutlined />} onClick={() => control('show')}>
            Show
          </Button>
        ) : (
          <Button
            icon={<EyeInvisibleOutlined />}
            onClick={() => control('hide')}
          >
            Hide
          </Button>
        )}
        <Divider type="vertical" />
        <span>
          Emergency Stop:{' '}
          {detail.emergencyStop === 1 ? (
            <Tag color="red">Stopped</Tag>
          ) : (
            <Tag color="green">Normal</Tag>
          )}
        </span>
        {detail.emergencyStop === 1 ? (
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => control('emergency-resume')}
          >
            Emergency Resume
          </Button>
        ) : (
          <Popconfirm
            title="Emergency stop?"
            description="Cancels open rounds and refunds pending orders."
            onConfirm={() => control('emergency-stop')}
          >
            <Button danger icon={<StopOutlined />}>
              Emergency Stop
            </Button>
          </Popconfirm>
        )}
      </Space>
    </Card>
  );
};

export default BasicTab;

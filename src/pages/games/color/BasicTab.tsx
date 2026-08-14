import { useEffect, useState } from 'react';
import { Button, Card, Col, Collapse, Descriptions, Form, Input, InputNumber, Row, Select, Space, Switch, Tag, message } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, ProfileOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { typeName } from '../../../utils/gameTypes';
import { formatDateTime, orDash } from '../../../utils/format';
import { type ColorGameDetail } from './colorShared';

const BasicTab = ({
  detail,
  reload,
  control,
}: {
  detail: ColorGameDetail;
  reload: () => void;
  control: (action: string) => Promise<void>;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      gameName: detail.gameName,
      gameCode: detail.gameCode,
      groupName: detail.groupName,
      categoryId: detail.categoryId,
      source: detail.source,
      provider: detail.provider,
      lotteryType: detail.lotteryType,
      sortOrder: detail.sortOrder,
      isHot: detail.isHot === 1,
    });
  }, [detail, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        gameCode: v.gameCode,
        groupName: v.groupName,
        categoryId: v.categoryId,
        source: v.source,
        provider: v.provider,
        lotteryType: v.lotteryType,
        sortOrder: v.sortOrder,
        isHot: v.isHot ? 1 : 0,
      });
      message.success('Saved');
      reload();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
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
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Game Code">
          {detail.gameCode}
        </Descriptions.Item>
        <Descriptions.Item label="Game Type">
          <Tag>{typeName(detail.gameType)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {detail.status === 1 ? (
            <span className="status-badge active">Active</span>
          ) : (
            <span className="status-badge inactive">Disabled</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Is Lottery">
          {detail.isLottery === 1 ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Third Party">
          {detail.isThirdParty === 1 ? (
            <Tag color="blue">Yes</Tag>
          ) : (
            <Tag>No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
      </Descriptions>

      <Collapse
        ghost
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'technical',
            label: (
              <span style={{ color: 'var(--text-muted)' }}>
                Technical (dev-facing)
              </span>
            ),
            children: (
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, lg: 3 }}
                size="small"
              >
                <Descriptions.Item label="Category ID">
                  {orDash(detail.categoryId)}
                </Descriptions.Item>
                <Descriptions.Item label="Source">
                  {orDash(detail.source)}
                </Descriptions.Item>
                <Descriptions.Item label="Provider">
                  {orDash(detail.provider)}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
        ]}
      />

      <Card
        size="small"
        title="State Controls"
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Paused</div>
            <Space>
              <Tag color={detail.isPaused === 1 ? 'orange' : 'green'}>
                {detail.isPaused === 1 ? 'Paused' : 'Running'}
              </Tag>
              {detail.isPaused === 1 ? (
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => control('resume')}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={() => control('pause')}
                >
                  Pause
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Visibility</div>
            <Space>
              <Tag color={detail.isHidden === 1 ? 'default' : 'green'}>
                {detail.isHidden === 1 ? 'Hidden' : 'Visible'}
              </Tag>
              {detail.isHidden === 1 ? (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => control('show')}
                >
                  Show
                </Button>
              ) : (
                <Button
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => control('hide')}
                >
                  Hide
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Emergency Stop
            </div>
            <Tag color={detail.emergencyStop === 1 ? 'red' : 'green'}>
              {detail.emergencyStop === 1 ? 'Stopped' : 'Normal'}
            </Tag>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Managed from the Result &amp; Draw tab.
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={
          <>
            <ProfileOutlined /> Identity &amp; Placement
          </>
        }
        style={{ borderRadius: 12 }}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="gameName"
                label="Game Name"
                rules={[{ required: true }]}
                extra="Display name shown to players."
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="gameCode"
                label="Game Code"
                rules={[{ required: true }]}
                extra="Unique internal code — change with care."
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="groupName"
                label="Group Name"
                extra="Lobby grouping label."
              >
                <Input placeholder="Lobby group" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="categoryId"
                label="Category ID"
                extra="Lobby category this game belongs to."
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="sortOrder"
                label="Sort Order"
                extra="Lower numbers appear first."
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="lotteryType"
                label="Draw Mode Type"
                extra="auto = scheduled, manual = admin-run."
              >
                <Select
                  style={{ width: '100%' }}
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'manual', label: 'Manual' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="source"
                label="Source"
                extra="Platform source code (e.g. TK)."
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="provider"
                label="Provider"
                extra="Game provider code."
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="isHot"
                label="Hot Game"
                valuePropName="checked"
                extra="Highlight as a hot game in the lobby."
              >
                <Switch checkedChildren="Hot" unCheckedChildren="Normal" />
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
      </Card>
    </Card>
  );
};

export default BasicTab;

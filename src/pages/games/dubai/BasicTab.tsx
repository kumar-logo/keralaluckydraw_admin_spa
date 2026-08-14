import { useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Form, Input, InputNumber, Row, Switch, Tag, message } from 'antd';
import { ProfileOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import MoneyText from '../../../components/MoneyText';
import { typeName } from '../../../utils/gameTypes';
import { formatDateTime, orDash } from '../../../utils/format';
import { fmtDuration, type GameDetail } from './dubaiShared';

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
      groupName: detail.groupName,
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
        sortOrder: v.sortOrder,
        isHot: v.isHot ? 1 : 0,
      });
      message.success('Saved');
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
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        title="Game Identity"
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
        <Descriptions.Item label="Paused">
          {detail.isPaused === 1 ? (
            <Tag color="orange">Yes</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Hidden">
          {detail.isHidden === 1 ? <Tag>Yes</Tag> : <Tag color="green">No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Emergency Stop">
          {detail.emergencyStop === 1 ? (
            <Tag color="red">Active</Tag>
          ) : (
            <Tag color="green">No</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Hot">
          {detail.isHot === 1 ? <Tag color="volcano">Yes</Tag> : <Tag>No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Draw Interval">
          {fmtDuration(detail.drawInterval)}
        </Descriptions.Item>
        <Descriptions.Item label="Draw Cycle">
          {fmtDuration(detail.quickCycleSec)}
        </Descriptions.Item>
        <Descriptions.Item label="Min Bet">
          <MoneyText value={detail.minBet} variant="neutral" />
        </Descriptions.Item>
        <Descriptions.Item label="Max Bet">
          <MoneyText value={detail.maxBet} variant="neutral" />
        </Descriptions.Item>
        <Descriptions.Item label="Selling Price">
          <MoneyText value={detail.sellingPrice} variant="neutral" />
        </Descriptions.Item>
        <Descriptions.Item label="Max Prize">
          {orDash(detail.maxPrize)}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
      </Descriptions>

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
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="groupName"
                label="Group Name"
                extra="Lobby grouping label."
              >
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="sortOrder"
                label="Sort Order"
                extra="Lower numbers appear first."
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item
                name="isHot"
                label="Hot"
                valuePropName="checked"
                extra="Highlight in the lobby."
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
    </>
  );
};

export default BasicTab;

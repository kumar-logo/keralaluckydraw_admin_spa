import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Table, Tag, Space, Alert, ColorPicker, message } from 'antd';
import { SaveOutlined, BgColorsOutlined, FlagOutlined, PictureOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import ImageUpload from '../../../components/ImageUpload';
import { raceStateShort, DEFAULT_RUNNER_COUNT, toHex, raceStateVar, clampLaneCount, raceStateName, type RaceGameDetail, type GameConfigResponse } from './raceShared';

const UiTab = ({
  detail,
  reload,
}: {
  detail: RaceGameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [laneCount, setLaneCount] = useState(6);

  useEffect(() => {
    form.setFieldsValue({
      emoji: detail.emoji,
      gameName: detail.gameName,
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

  useEffect(() => {
    let active = true;
    api
      .get(`games/${detail.id}/config`)
      .then((cfg) => {
        if (active)
          setLaneCount(
            clampLaneCount(
              (cfg as unknown as GameConfigResponse).race?.runnerCount ?? DEFAULT_RUNNER_COUNT,
            ),
          );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [detail.id]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        emoji: v.emoji,
        description: v.description,
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
        lobbyIconUrl: v.lobbyIconUrl,
      });
      await api.put(`games/${detail.id}/ui-config`, {
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
      });
      message.success('UI saved');
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
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Icon
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Banner
            </div>
            <Form.Item name="bannerUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Thumbnail
            </div>
            <Form.Item name="thumbnailUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
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
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="gameName" label="Display Name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji">
              <Input maxLength={4} placeholder="optional" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Row gutter={16}>
          <Col>
            <Form.Item name="themeColor" label="Theme Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="bgColor" label="Background Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="textColor" label="Text Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="borderColor" label="Border Color">
              <ColorPicker showText />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <FlagOutlined /> Race Lanes & State Colours
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Showing ${laneCount} active lane${laneCount === 1 ? '' : 's'} (from Runner Count)`}
          description="Lane labels and colours come from the shared race theme (CSS variables) and apply to every race game. Change the number of lanes via Runner Count on the Config tab."
        />
        <Table<{
          key: number;
          name: string;
          short: string;
          cssVar: string;
        }>
          rowKey="key"
          size="small"
          pagination={false}
          className="modern-table"
          scroll={{ x: 'max-content' }}
          dataSource={Array.from({ length: laneCount }, (_, i) => ({
            key: i,
            name: raceStateName(i),
            short: raceStateShort(i),
            cssVar: raceStateVar(i),
          }))}
          columns={[
            { title: 'Lane', dataIndex: 'key', width: 60, render: (v) => v + 1 },
            { title: 'State Name', dataIndex: 'name', width: 180 },
            {
              title: 'Abbreviation',
              dataIndex: 'short',
              width: 130,
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: 'CSS Variable',
              dataIndex: 'cssVar',
              render: (v: string) => (
                <Space>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      display: 'inline-block',
                      background: `var(${v})`,
                      border: '1px solid var(--border-light)',
                    }}
                  />
                  <span style={{ fontFamily: 'monospace' }}>{v}</span>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save UI / Colours
      </Button>
    </Form>
  );
};

export default UiTab;

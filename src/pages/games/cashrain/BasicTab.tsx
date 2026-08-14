import { Card, Descriptions, Space, Switch, Tag } from 'antd';
import { PauseCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { formatDateTime, orDash } from '../../../utils/format';
import { type CashRainDetail } from './cashRainShared';

const BasicTab = ({
  detail,
  control,
}: {
  detail: CashRainDetail;
  control: (action: string) => void;
}) => (
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
      <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="small">
        <Descriptions.Item label="Game Code">
          {detail.gameCode}
        </Descriptions.Item>
        <Descriptions.Item label="Game Type">
          <Tag color="purple">{detail.gameType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Max Prize">
          {orDash(detail.maxPrize)}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {formatDateTime(detail.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {formatDateTime(detail.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paused</div>
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
      </Space>
    </Card>
  </>
);

export default BasicTab;

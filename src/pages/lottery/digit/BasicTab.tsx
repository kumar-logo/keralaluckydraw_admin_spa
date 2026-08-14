import {
  Button,
  Card,
  Descriptions,
  Divider,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import MoneyText from '../../../components/MoneyText';
import { typeName } from '../../../utils/gameTypes';
import { formatDateTime, orDash } from '../../../utils/format';
import {
  fmtDuration,
  num,
  type DigitGameDetail,
} from './digitShared';

const BasicTab = ({
  detail,
  control,
}: {
  detail: DigitGameDetail;
  control: (action: string) => void;
}) => (
  <Card style={{ borderRadius: 12 }}>
    <Descriptions
      bordered
      column={{ xs: 1, sm: 2, lg: 3 }}
      size="small"
      style={{ marginBottom: 24 }}
    >
      <Descriptions.Item label="Game Name">{detail.gameName}</Descriptions.Item>
      <Descriptions.Item label="Game Code">{detail.gameCode}</Descriptions.Item>
      <Descriptions.Item label="Game Type">
        <Tag color="purple">{typeName(detail.gameType)}</Tag> {detail.gameType}
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        {detail.status === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Disabled</span>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Digit Count">
        <Tag>{orDash(detail.digitCount)}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Draw Interval">
        {fmtDuration(detail.drawInterval)}
      </Descriptions.Item>
      <Descriptions.Item label="Bet Range">
        <MoneyText value={detail.minBet} variant="neutral" /> –{' '}
        <MoneyText value={detail.maxBet} variant="neutral" />
      </Descriptions.Item>
      <Descriptions.Item label="Ticket Price">
        <MoneyText value={detail.sellingPrice} variant="neutral" />
      </Descriptions.Item>
      <Descriptions.Item label="Pay Rate">
        {detail.payRate != null ? num(detail.payRate).toFixed(2) : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Quick Mode">
        {detail.isQuick === 1 ? (
          <Tag color="geekblue">
            Quick{detail.quickCycleSec ? ` · ${detail.quickCycleSec}s` : ''}
          </Tag>
        ) : (
          <Tag>Standard</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Created Date">
        {formatDateTime(detail.createdAt)}
      </Descriptions.Item>
      <Descriptions.Item label="Paused">
        {detail.isPaused === 1 ? (
          <Tag color="orange">Paused</Tag>
        ) : (
          <Tag color="green">Running</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Hidden from Lobby">
        {detail.isHidden === 1 ? (
          <Tag color="default">Hidden</Tag>
        ) : (
          <Tag color="green">Visible</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Emergency Stop">
        {detail.emergencyStop === 1 ? (
          <Tag color="red">Stopped</Tag>
        ) : (
          <Tag color="green">Normal</Tag>
        )}
      </Descriptions.Item>
    </Descriptions>

    <Divider orientation="left" style={{ fontSize: 13 }}>
      Game Control
    </Divider>
    <Space wrap>
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
      {detail.isHidden === 1 ? (
        <Button icon={<EyeOutlined />} onClick={() => control('show')}>
          Show in Lobby
        </Button>
      ) : (
        <Button
          icon={<EyeInvisibleOutlined />}
          onClick={() => control('hide')}
        >
          Hide from Lobby
        </Button>
      )}
      {detail.emergencyStop === 1 ? (
        <Popconfirm
          title="Resume from emergency stop?"
          onConfirm={() => control('emergency-resume')}
        >
          <Button icon={<ThunderboltOutlined />}>Emergency Resume</Button>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="Emergency stop?"
          description="Cancels open rounds and refunds all pending orders."
          okButtonProps={{ danger: true }}
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

export default BasicTab;

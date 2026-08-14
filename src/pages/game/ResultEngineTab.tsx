import { Space, Row, Col, message, Card, Switch, Select, InputNumber, Divider, Alert } from 'antd';
import api from '../../services/api';
import { type GameDetail } from './gameShared';

const ResultEngineTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const rc = {
    resultMode: detail.resultMode || 'random',
    houseEdgeTarget: detail.resultHouseEdgeTarget,
    holdForApproval: detail.resultHoldForApproval,
    avoidBigPrize: detail.resultAvoidBigPrize,
    avoidZeroOrder: detail.resultAvoidZeroOrder,
  };
  const save = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`games/${detail.id}/result-config`, { ...rc, ...patch });
      message.success('Result config updated');
      reload();
    } catch {
      message.error('Update failed');
    }
  };
  const biased = ['min_payout', 'max_profit', 'lowest_risk'].includes(
    rc.resultMode,
  );
  return (
    <Card style={{ borderRadius: 12 }}>
      {biased && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Biased result mode active"
          description="This game biases outcomes against players. Every draw is recorded in the Decision Log."
        />
      )}
      <Row gutter={24} align="top">
        <Col xs={24} md={8}>
          <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
            Result Mode
          </div>
          <Select
            style={{ width: '100%' }}
            value={rc.resultMode}
            onChange={(val) => save({ resultMode: val })}
            options={[
              { value: 'random', label: 'Random (fair)' },
              { value: 'weighted', label: 'Weighted' },
              { value: 'min_payout', label: 'Minimum Payout ⚠' },
              { value: 'max_profit', label: 'Maximum Profit ⚠' },
              { value: 'lowest_risk', label: 'Lowest Risk ⚠' },
              { value: 'manual', label: 'Manual Approval' },
            ]}
          />
        </Col>
        <Col xs={12} md={8}>
          <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
            House Edge Target
          </div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={0.95}
            step={0.05}
            placeholder="global default"
            value={rc.houseEdgeTarget}
            onChange={(val) => save({ houseEdgeTarget: val })}
          />
        </Col>
        <Col xs={12} md={8}>
          <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
            Hold for Approval
          </div>
          <Switch
            checked={!!rc.holdForApproval}
            checkedChildren="On"
            unCheckedChildren="Off"
            onChange={(val) => save({ holdForApproval: val })}
          />
        </Col>
      </Row>
      <Divider />
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Space align="start">
            <Switch
              checked={!!rc.avoidBigPrize}
              onChange={(val) => save({ avoidBigPrize: val })}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                Avoid big-prize numbers
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Never pick an outcome whose payout exceeds the house-edge
                target.
              </div>
            </div>
          </Space>
        </Col>
        <Col xs={24} md={12}>
          <Space align="start">
            <Switch
              checked={!!rc.avoidZeroOrder}
              onChange={(val) => save({ avoidZeroOrder: val })}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                Prefer zero-order numbers
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Favour outcomes that no player bet on (zero winners).
              </div>
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ResultEngineTab;

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  InputNumber,
  Input,
  Form,
  Card,
  Space,
  Modal,
  Empty,
  Alert,
  Tooltip,
  message,
} from 'antd';
import {
  ReloadOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { toOddsRows } from '../../../services/oddsResponse';
import { type DigitGameDetail, type OddsRow } from './digitShared';

interface BetTypeMeaning {
  group: string;
  meaning: string;
  hitChance: string;
}

const describeBetType = (
  betType: string,
  digitCount: number,
): BetTypeMeaning => {
  const exact = /^exact(\d+)$/.exec(betType);
  if (exact) {
    const len = Number(exact[1]);
    if (len === digitCount) {
      return {
        group: 'Exact',
        meaning: `All ${digitCount} digits must match the draw exactly`,
        hitChance: `1 in ${Math.pow(10, digitCount).toLocaleString()}`,
      };
    }
    return {
      group: 'Suffix',
      meaning: `The LAST ${len} digits must match (leading digits ignored)`,
      hitChance: `1 in ${Math.pow(10, len).toLocaleString()}`,
    };
  }

  const first = /^first(\d+)$/.exec(betType);
  if (first) {
    const len = Number(first[1]);
    if (len === digitCount) {
      return {
        group: 'Exact',
        meaning: `All ${digitCount} digits must match the draw exactly`,
        hitChance: `1 in ${Math.pow(10, digitCount).toLocaleString()}`,
      };
    }
    return {
      group: 'Prefix',
      meaning: `The FIRST ${len} digits must match (trailing digits ignored)`,
      hitChance: `1 in ${Math.pow(10, len).toLocaleString()}`,
    };
  }

  const posIndex: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
  };
  if (posIndex[betType] !== undefined) {
    return {
      group: 'Position',
      meaning: `Single digit at position ${posIndex[betType]} must match`,
      hitChance: '1 in 10',
    };
  }

  if (betType === 'sum') {
    return {
      group: 'Sum',
      meaning: 'The total of all drawn digits must match the bet',
      hitChance: 'varies',
    };
  }
  if (betType === 'big' || betType === 'small') {
    return {
      group: 'Size',
      meaning: 'Digit sum above / at-or-below the big-small threshold',
      hitChance: '~1 in 2',
    };
  }
  if (betType === 'odd' || betType === 'even') {
    return {
      group: 'Parity',
      meaning: 'Digit sum is odd / even',
      hitChance: '~1 in 2',
    };
  }
  if (betType === 'box') {
    return {
      group: 'Box',
      meaning: 'Same digits in any order',
      hitChance: 'varies',
    };
  }

  return {
    group: 'Custom',
    meaning:
      'Not a built-in rule — the engine falls back to an EXACT full-number match',
    hitChance: `1 in ${Math.pow(10, digitCount).toLocaleString()}`,
  };
};

const OddsTab = ({ detail }: { detail: DigitGameDetail }) => {
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();

  const digitCount = detail.digitCount ?? 3;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, unknown>(`odds/${detail.id}`);
      setOdds(toOddsRows<OddsRow>(res));
      setEdited({});
    } catch {
      message.error('Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [detail.id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentOdds = (r: OddsRow): number => {
    const id = r.id;
    if (id === undefined) return Number(r.odds);
    const pending = edited[id];
    return pending === undefined ? Number(r.odds) : pending;
  };

  const riskiest = useMemo(() => {
    if (odds.length === 0) return null;
    return odds.reduce((a, b) => (Number(b.odds) > Number(a.odds) ? b : a));
  }, [odds]);

  const save = async () => {
    if (!Object.keys(edited).length) {
      message.info('No changes');
      return;
    }
    setSaving(true);
    try {
      await api.post(`odds/${detail.id}`, {
        updates: Object.entries(edited).map(([id, o]) => ({
          id: Number(id),
          odds: o,
        })),
      });
      message.success('Odds saved');
      load();
    } catch {
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    try {
      const v = await addForm.validateFields();
      await api.post(`odds/${detail.id}`, {
        updates: [
          { betType: v.betType, odds: v.odds, gameType: detail.gameType },
        ],
      });
      message.success('Added');
      setAddOpen(false);
      addForm.resetFields();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Add failed');
    }
  };

  const del = (r: OddsRow) =>
    Modal.confirm({
      title: 'Delete odds entry',
      content: `Delete "${r.betType}"?`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`odds/${detail.id}/${r.id}`);
          message.success('Deleted');
          load();
        } catch {
          message.error('Delete failed');
        }
      },
    });

  const columns: ColumnsType<OddsRow> = [
    {
      title: 'Group',
      key: 'group',
      width: 100,
      render: (_, r) => (
        <Tag color="purple">{describeBetType(r.betType, digitCount).group}</Tag>
      ),
    },
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 120,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'What must match',
      key: 'meaning',
      render: (_, r) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {describeBetType(r.betType, digitCount).meaning}
        </span>
      ),
    },
    {
      title: 'Hit chance',
      key: 'chance',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <span style={{ fontFamily: 'monospace' }}>
          {describeBetType(r.betType, digitCount).hitChance}
        </span>
      ),
    },
    {
      title: 'Current Odds',
      dataIndex: 'odds',
      key: 'odds',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <span className="text-purple" style={{ fontWeight: 600 }}>
          {Number(v ?? 0).toFixed(4)}
        </span>
      ),
    },
    {
      title: 'Max payout / ₹1',
      key: 'exposure',
      width: 130,
      align: 'right',
      render: (_, r) => (
        <span style={{ fontWeight: 600 }}>
          ₹{currentOdds(r).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'New Odds',
      key: 'edit',
      width: 160,
      render: (_, r) => {
        const id = r.id;
        if (id === undefined) {
          return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
        }
        return (
          <InputNumber
            min={0.0001}
            step={0.1}
            precision={4}
            value={currentOdds(r)}
            onChange={(v) =>
              v !== null && setEdited((p) => ({ ...p, [id]: v }))
            }
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      title: '',
      key: 'a',
      width: 44,
      align: 'center',
      render: (_, r) => (
        <Tooltip title="Delete odds">
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => del(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`Payouts for this ${digitCount}-digit game come from this table`}
        description={`Winnings = stake x odds (minus any win fee). "exactN" where N is less than ${digitCount} matches only the LAST N digits, so it hits far more often than a full ${digitCount}-digit match — price it accordingly.`}
      />
      {riskiest && Number(riskiest.odds) >= 1000 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Highest exposure: "${riskiest.betType}" pays ${Number(riskiest.odds).toLocaleString()}x`}
          description={`A single ₹10 ticket on "${riskiest.betType}" would pay ₹${(Number(riskiest.odds) * 10).toLocaleString()}.`}
        />
      )}
      <Card
        title={
          <>
            <PercentageOutlined /> Bet Type Odds ({odds.length})
          </>
        }
        size="small"
        style={{ borderRadius: 12 }}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                addForm.resetFields();
                setAddOpen(true);
              }}
            >
              Add
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={save}
              loading={saving}
              disabled={!Object.keys(edited).length}
            >
              Save Changes
              {Object.keys(edited).length > 0
                ? ` (${Object.keys(edited).length})`
                : ''}
            </Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => (r.id === undefined ? r.betType : String(r.id))}
          loading={loading}
          columns={columns}
          dataSource={odds}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 'max-content', y: 520 }}
          rowClassName={(r) => {
            const id = r.id;
            if (id === undefined) return '';
            return edited[id] === undefined ? '' : 'ant-table-row-selected';
          }}
          locale={{ emptyText: <Empty description="No bet-type odds" /> }}
        />
      </Card>
      <Modal
        title="Add Bet Type Odds"
        open={addOpen}
        onOk={add}
        onCancel={() => setAddOpen(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="betType"
            label="Bet Type"
            extra="Unique key used by the betting engine for this game."
            rules={[{ required: true, message: 'Enter a bet type key' }]}
          >
            <Input placeholder="e.g. exact3, first, sum, big" />
          </Form.Item>
          <Form.Item
            name="odds"
            label="Odds (payout multiplier)"
            extra="Winnings = stake x odds."
            rules={[{ required: true, message: 'Enter the odds' }]}
          >
            <InputNumber
              min={0.0001}
              step={0.1}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OddsTab;

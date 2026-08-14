import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Select, InputNumber, Form, Card, Space, Modal, Empty, Alert, Tooltip, message } from 'antd';
import { ReloadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, PercentageOutlined, ProfileOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { toOddsRows } from '../../../services/oddsResponse';
import { DICE_BET_TYPES, DICE_BET_BY_CODE, DEFAULT_BET_GROUP, type DiceGameDetail, type OddsRow } from './diceShared';

const OddsTab = ({ detail }: { detail: DiceGameDetail }) => {
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [addForm] = Form.useForm();

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
        updates: [{ betType: v.betType, odds: v.odds, gameType: detail.gameType }],
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
      width: 110,
      render: (_, r) => (
        <Tag color="purple">{DICE_BET_BY_CODE[r.betType]?.group ?? DEFAULT_BET_GROUP}</Tag>
      ),
    },
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      render: (v: string) => (
        <Tooltip title={DICE_BET_BY_CODE[v]?.meaning}>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Current Odds',
      dataIndex: 'odds',
      key: 'odds',
      width: 130,
      align: 'right',
      render: (v: number) => (
        <span className="text-purple" style={{ fontWeight: 600 }}>
          {Number(v ?? 0).toFixed(4)}
        </span>
      ),
    },
    {
      title: 'New Odds',
      key: 'edit',
      width: 180,
      render: (_, r) => (
        <InputNumber
          min={0.0001}
          step={0.1}
          precision={4}
          value={edited[r.id] ?? r.odds}
          onChange={(v) => v !== null && setEdited((p) => ({ ...p, [r.id]: v }))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (s: number) =>
        s === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Off</span>
        ),
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
        message="Dice payouts come from this Odds table"
        description="Each bet type (sum / single / double / leopard) has its own multiplier. Use the reference for the full Dice bet-type vocabulary."
      />
      <Card
        title={
          <>
            <PercentageOutlined /> Dice Odds ({odds.length})
          </>
        }
        size="small"
        style={{ borderRadius: 12 }}
        extra={
          <Space wrap>
            <Button icon={<ProfileOutlined />} onClick={() => setRefOpen(true)}>
              Bet Type Reference
            </Button>
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
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={odds}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ y: 520 }}
          rowClassName={(r) =>
            edited[r.id] !== undefined ? 'ant-table-row-selected' : ''
          }
          locale={{ emptyText: <Empty description="No odds configured" /> }}
        />
      </Card>
      <Modal
        title="Add Odds Entry"
        open={addOpen}
        onOk={add}
        onCancel={() => setAddOpen(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="betType"
            label="Bet Type"
            rules={[{ required: true }]}
            extra="Pick from the Dice bet-type vocabulary."
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="e.g. sum_big, single_one, leopard_any"
              options={DICE_BET_TYPES.map((b) => ({
                value: b.code,
                label: `${b.group} · ${b.code} — ${b.meaning}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="odds"
            label="Odds (multiplier)"
            rules={[{ required: true }]}
            extra="Payout multiplier, e.g. 1.95 for big/small."
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
      <Modal
        title="Dice Bet-Type Reference"
        open={refOpen}
        onCancel={() => setRefOpen(false)}
        footer={null}
        width={680}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="38 canonical dice bet types"
          description="Suggested odds are the engine defaults. Configure live multipliers in the Odds table."
        />
        <Table
          rowKey="code"
          size="small"
          pagination={false}
          scroll={{ y: 420 }}
          dataSource={DICE_BET_TYPES}
          columns={[
            {
              title: 'Group',
              dataIndex: 'group',
              width: 90,
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: 'Bet Type',
              dataIndex: 'code',
              width: 150,
              render: (v: string) => (
                <span style={{ fontFamily: 'monospace' }}>{v}</span>
              ),
            },
            { title: 'Meaning', dataIndex: 'meaning' },
            {
              title: 'Suggested',
              dataIndex: 'defaultOdds',
              width: 100,
              align: 'right',
              render: (v: number) => (
                <span className="text-purple">{v.toFixed(2)}x</span>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default OddsTab;

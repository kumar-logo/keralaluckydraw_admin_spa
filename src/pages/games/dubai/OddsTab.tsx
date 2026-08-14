import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Empty, Form, Input, InputNumber, Modal, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { num, GAME_TYPE, type OddsRow, type PageList, type OddsConfigResponse } from './dubaiShared';

const OddsTab = ({ gameId }: { gameId: number }) => {
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`odds/${gameId}`)) as
        | OddsRow[]
        | OddsConfigResponse
        | PageList<OddsRow>;
      const rows = Array.isArray(res)
        ? res
        : 'odds' in res
          ? res.odds
          : Array.isArray(res.list)
            ? res.list
            : [];
      setOdds(rows);
      setEdited({});
    } catch {
      message.error('Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  const save = async () => {
    if (!Object.keys(edited).length) {
      message.info('No changes');
      return;
    }
    setSaving(true);
    try {
      await api.post(`odds/${gameId}`, {
        updates: Object.entries(edited).map(([id, o]) => ({
          id: Number(id),
          odds: o,
        })),
      });
      message.success('Odds saved');
      fetchOdds();
    } catch {
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };
  const add = async () => {
    try {
      const v = await addForm.validateFields();
      await api.post(`odds/${gameId}`, {
        updates: [{ betType: v.betType, odds: v.odds, gameType: GAME_TYPE }],
      });
      message.success('Added');
      setAddOpen(false);
      addForm.resetFields();
      fetchOdds();
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
          await api.delete(`odds/${gameId}/${r.id}`);
          message.success('Deleted');
          fetchOdds();
        } catch {
          message.error('Delete failed');
        }
      },
    });

  const columns: ColumnsType<OddsRow> = [
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 220,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: 'Current',
      dataIndex: 'odds',
      key: 'odds',
      width: 120,
      render: (v: number) => (
        <span className="text-purple">{num(v).toFixed(4)}</span>
      ),
    },
    {
      title: 'New Odds (Multiplier)',
      key: 'edit',
      width: 200,
      render: (_: unknown, r: OddsRow) => (
        <InputNumber
          min={0.0001}
          step={0.1}
          precision={4}
          addonAfter="x"
          value={edited[r.id] ?? r.odds}
          onChange={(v) =>
            v !== null && setEdited((p) => ({ ...p, [r.id]: v }))
          }
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
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
      render: (_: unknown, r: OddsRow) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => del(r)}
        />
      ),
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Per-number payout odds"
        description="Dubai uses one row per winning number — bet types number_1 through number_N within the configured From–To range. The odds value is the payout multiplier applied to a winning stake."
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <Button icon={<ReloadOutlined />} onClick={fetchOdds}>
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
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={odds}
        pagination={false}
        className="modern-table"
        scroll={{ x: 'max-content' }}
        rowClassName={(r) =>
          edited[r.id] !== undefined ? 'ant-table-row-selected' : ''
        }
        locale={{ emptyText: <Empty description="No odds configured" /> }}
      />
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
            extra="Use number_1 … number_N for Dubai outcomes within the range."
            rules={[{ required: true, message: 'Bet type is required' }]}
          >
            <Input placeholder="e.g. number_7" />
          </Form.Item>
          <Form.Item
            name="odds"
            label="Odds (Multiplier)"
            rules={[{ required: true, message: 'Odds are required' }]}
          >
            <InputNumber
              min={0.0001}
              step={0.1}
              precision={4}
              addonAfter="x"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OddsTab;

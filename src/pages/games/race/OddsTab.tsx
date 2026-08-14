import { useCallback, useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Table, Tag, Modal, Empty, Alert, message } from 'antd';
import { ReloadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { num, type OddsRow } from './raceShared';

const OddsTab = ({
  gameId,
  gameType,
}: {
  gameId: number;
  gameType: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState<OddsRow[]>([]);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`odds/${gameId}`)) as
        | OddsRow[]
        | { odds?: OddsRow[]; list?: OddsRow[] };
      const resolvedOdds = Array.isArray(res)
        ? res
        : (res.odds ?? res.list);
      setOdds(Array.isArray(resolvedOdds) ? resolvedOdds : []);
      setEdited({});
    } catch {
      message.error('Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [gameId]);
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
      await api.post(`odds/${gameId}`, {
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
      await api.post(`odds/${gameId}`, {
        updates: [{ betType: v.betType, odds: v.odds, gameType }],
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
          await api.delete(`odds/${gameId}/${r.id}`);
          message.success('Deleted');
          load();
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
      title: 'Current Odds',
      dataIndex: 'odds',
      key: 'odds',
      width: 120,
      render: (v: number) => <span>{num(v).toFixed(4)}</span>,
    },
    {
      title: 'New Odds',
      key: 'edit',
      width: 160,
      render: (_: unknown, r: OddsRow) => (
        <InputNumber
          min={0.0001}
          step={0.1}
          precision={4}
          value={edited[r.id] ?? r.odds}
          onChange={(v) =>
            v !== null && setEdited((p) => ({ ...p, [r.id]: v }))
          }
          style={{ width: 130 }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: number) =>
        s === 1 ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="default">Off</Tag>
        ),
    },
    {
      title: '',
      key: 'a',
      width: 60,
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
        message="Bet types for race payouts"
        description="Configure per-position bet types (e.g. position_1, position_2) and their odds. Precision is 4 decimals."
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
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. position_1, position_2" />
          </Form.Item>
          <Form.Item
            name="odds"
            label="Odds"
            rules={[{ required: true, message: 'Required' }]}
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

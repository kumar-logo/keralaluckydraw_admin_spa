import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Select, InputNumber, Form, Card, Space, Modal, Popconfirm, Empty, Alert, message } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import { FEE_TYPE_LABELS, type DiceGameDetail, type FeeRow } from './diceShared';

const FeesTab = ({ detail }: { detail: DiceGameDetail }) => {
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, FeeRow[]>(`fee-config/${detail.id}`);
      setFees(Array.isArray(res) ? res : []);
    } catch {
      message.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [detail.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.post(`fee-config/${detail.id}`, v);
      message.success('Saved');
      setOpen(false);
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    try {
      await api.delete(`fee-config/${detail.id}/${id}`);
      message.success('Deleted');
      load();
    } catch {
      message.error('Delete failed');
    }
  };

  const columns: ColumnsType<FeeRow> = [
    {
      title: 'Fee Type',
      dataIndex: 'feeType',
      key: 'feeType',
      width: 170,
      render: (v: string) => (
        <Tag color={v === 'bet_deduction' ? 'blue' : 'orange'}>
          {FEE_TYPE_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Fee Rate',
      dataIndex: 'feeRate',
      key: 'feeRate',
      width: 120,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{(Number(v) * 100).toFixed(2)}%</span>
      ),
    },
    {
      title: 'Fixed Fee',
      dataIndex: 'fixedFee',
      key: 'fixedFee',
      width: 120,
      render: (v: number) => Number(v).toFixed(2),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Off</span>
        ),
    },
    {
      title: '',
      key: 'a',
      width: 90,
      render: (_, r) => (
        <Popconfirm title="Delete this fee?" onConfirm={() => del(r.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Game fees"
        description="Deduct a percentage and/or a flat fee from each stake (bet) or from winnings (win)."
      />
      <Card
        title={
          <>
            <DollarOutlined /> Fee Configuration ({fees.length})
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
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({
                  feeType: 'win_deduction',
                  feeRate: 0,
                  fixedFee: 0,
                });
                setOpen(true);
              }}
            >
              Add Fee
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={fees}
          loading={loading}
          pagination={false}
          size="small"
          className="modern-table"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="No fees configured" /> }}
        />
      </Card>
      <Modal
        title="Add Fee Configuration"
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="feeType" label="Fee Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'bet_deduction', label: 'Bet Deduction (from stake)' },
                { value: 'win_deduction', label: 'Win Deduction (from winnings)' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="feeRate"
            label="Fee Rate"
            extra="Decimal — 0.02 = 2%"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.001}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="fixedFee" label="Fixed Fee" extra="Flat amount, 0 if none">
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FeesTab;

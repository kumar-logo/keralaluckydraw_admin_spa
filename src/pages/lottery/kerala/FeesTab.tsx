import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Form, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, DollarOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import MoneyText from '../../../components/MoneyText';
import { num, cardStyle, feeTypeLabels, formLayout, type FeeRow } from './keralaShared';

const FeesTab = ({ gameId }: { gameId: number }) => {
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`fee-config/${gameId}`)) as FeeRow[];
      setFees(Array.isArray(res) ? res : []);
    } catch {
      message.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.post(`fee-config/${gameId}`, {
        feeType: v.feeType,
        feeRate: v.feeRate,
        fixedFee: v.fixedFee,
      });
      message.success('Fee saved');
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
      await api.delete(`fee-config/${gameId}/${id}`);
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
          {feeTypeLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'feeRate',
      key: 'feeRate',
      width: 120,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>{(num(v) * 100).toFixed(2)}%</span>
      ),
    },
    {
      title: 'Fixed Fee',
      dataIndex: 'fixedFee',
      key: 'fixedFee',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
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
      key: 'action',
      width: 90,
      render: (_: unknown, r: FeeRow) => (
        <Popconfirm title="Delete this fee?" onConfirm={() => del(r.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title={
        <>
          <DollarOutlined /> Fee Configuration
        </>
      }
      style={cardStyle}
      extra={
        <Space>
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
        className="modern-table"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="No fees configured" /> }}
      />
      <Modal
        title="Add Fee Configuration"
        open={open}
        onOk={save}
        onCancel={() => setOpen(false)}
        confirmLoading={saving}
      >
        <Form {...formLayout} form={form}>
          <Form.Item
            name="feeType"
            label="Fee Type"
            rules={[{ required: true }]}
          >
            <Select
              style={{ width: '100%' }}
              options={[
                {
                  value: 'win_deduction',
                  label: 'Win Deduction (from winnings)',
                },
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
          <Form.Item
            name="fixedFee"
            label="Fixed Fee"
            extra="Flat amount, 0 if none"
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default FeesTab;

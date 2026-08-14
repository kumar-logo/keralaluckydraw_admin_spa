import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  Tag,
  message,
  Popconfirm,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import { useConfigStore } from '../store/configStore';
import { formatMoney, formatPercent } from '../utils/format';

interface GameOption {
  id: number;
  gameName: string;
  gameType: string;
  gameCode: string;
}
interface FeeRecord {
  id: number;
  gameId: number;
  gameType: string;
  feeType: string;
  feeRate: number;
  fixedFee: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface FeeFormValues {
  feeType: string;
  feeRate: number;
  fixedFee: number;
}

interface ApiError {
  message?: string;
}

const feeTypeLabels: Record<string, string> = {
  bet_deduction: 'Bet Deduction',
  win_deduction: 'Win Deduction',
};

const GameFeeConfigPage = () => {
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<FeeFormValues>();
  const [saving, setSaving] = useState(false);

  const { isLotteryType } = useConfigStore();
  const fetchGames = async () => {
    try {
      const res = (await api.post('games/list', {
        pageNo: 1,
        pageSize: 200,
      })) as unknown as { list: GameOption[] };
      const filtered = res.list.filter((g) => !isLotteryType(g.gameType));
      setGames(filtered);
      if (filtered.length && !selectedGameId) setSelectedGameId(filtered[0].id);
    } catch {
      message.error('Failed to load games');
    }
  };
  const fetchFees = async (gameId: number) => {
    setLoading(true);
    try {
      const res = (await api.get(`fee-config/${gameId}`)) as unknown as
        | FeeRecord[]
        | null;
      setFees(Array.isArray(res) ? res : []);
    } catch {
      message.error('Failed to load fee config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);
  useEffect(() => {
    if (selectedGameId) fetchFees(selectedGameId);
  }, [selectedGameId]);

  const openAddModal = () => {
    form.resetFields();
    form.setFieldsValue({ feeType: 'bet_deduction', feeRate: 0, fixedFee: 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post(`fee-config/${selectedGameId}`, values);
      message.success('Fee config saved');
      setModalOpen(false);
      fetchFees(selectedGameId!);
    } catch (err) {
      const e = err as ApiError;
      if (e?.message) message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`fee-config/${selectedGameId}/${id}`);
      message.success('Fee config deleted');
      fetchFees(selectedGameId!);
    } catch {
      message.error('Failed to delete');
    }
  };

  const activeCount = fees.filter((f) => f.status === 1).length;

  const columns: ColumnsType<FeeRecord> = [
    {
      title: 'Fee Type',
      dataIndex: 'feeType',
      key: 'feeType',
      width: 160,
      render: (v: string) => (
        <Tag color={v === 'bet_deduction' ? 'blue' : 'orange'}>
          {feeTypeLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Fee Rate',
      dataIndex: 'feeRate',
      key: 'feeRate',
      width: 130,
      render: (v: number) => (
        <span style={{ fontWeight: 600 }}>
          {formatPercent(Number(v) * 100)}
        </span>
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
      title: 'Fee on ₹100',
      key: 'preview',
      width: 140,
      render: (_: unknown, r: FeeRecord) => {
        const preview = 100 * r.feeRate + r.fixedFee;
        return (
          <span style={{ color: 'var(--text-muted)' }}>
            {formatMoney(preview)}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) =>
        v === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Disabled</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: FeeRecord) => (
        <Popconfirm
          title="Delete this fee config?"
          onConfirm={() => handleDelete(record.id)}
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Game Fee Config"
        subtitle={
          games.find((g) => g.id === selectedGameId)?.gameName ||
          'Select a game'
        }
        icon={<DollarOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space wrap>
            {selectedGameId && (
              <Tag color="blue">
                {activeCount} active rule{activeCount === 1 ? '' : 's'}
              </Tag>
            )}
            <Select
              style={{ width: 280 }}
              placeholder="Select a game"
              value={selectedGameId}
              onChange={(val) => setSelectedGameId(val)}
              options={games.map((g) => ({
                value: g.id,
                label: `${g.gameName} (${g.gameCode})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => selectedGameId && fetchFees(selectedGameId)}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              disabled={!selectedGameId}
            >
              Add Fee
            </Button>
          </Space>
        }
      />

      {!selectedGameId ? (
        <Empty description="Select a game to manage fees" />
      ) : (
        <Table<FeeRecord>
          rowKey="id"
          columns={columns}
          dataSource={fees}
          loading={loading}
          pagination={false}
          className="modern-table"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: <Empty description="No fee rules — click Add Fee" />,
          }}
        />
      )}

      <Modal
        title="Add Fee Configuration"
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="feeType"
            label="Fee Type"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                {
                  value: 'bet_deduction',
                  label: 'Bet Deduction (deducted from bet amount)',
                },
                {
                  value: 'win_deduction',
                  label: 'Win Deduction (deducted from winnings)',
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="feeRate"
            label="Fee Rate (decimal, e.g. 0.02 = 2%)"
            rules={[{ required: true, message: 'Enter fee rate' }]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.001}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="fixedFee" label="Fixed Fee (flat amount, 0 if none)">
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GameFeeConfigPage;

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Select,
  InputNumber,
  message,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Empty,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { toOddsRows } from '../services/oddsResponse';
import PageHeader from '../components/PageHeader';
import { useConfigStore } from '../store/configStore';
import { getApiErrorMessage } from '../utils/apiError';

interface OddsRecord {
  id: number;
  gameId: number;
  gameType: string;
  betType: string;
  odds: number;
  status: number;
}

interface GameOption {
  id: number;
  gameName: string;
  gameType: string;
}

const OddsConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [odds, setOdds] = useState<OddsRecord[]>([]);
  const [editedOdds, setEditedOdds] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm<{ betType: string; odds: number }>();

  const { isLotteryType } = useConfigStore();
  useEffect(() => {
    api
      .post('games/list', { pageNo: 1, pageSize: 100 })
      .then((res) => {
        const r = res as unknown as { list: GameOption[] };
        setGames(r.list.filter((g) => !isLotteryType(g.gameType)));
      })
      .catch(() => message.error('Failed to load games'));
  }, []);

  const fetchOdds = useCallback(async () => {
    if (!selectedGameId) return;
    setLoading(true);
    try {
      const res = await api.get<unknown, unknown>(`odds/${selectedGameId}`);
      setOdds(toOddsRows<OddsRecord>(res));
      setEditedOdds({});
    } catch {
      message.error('Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [selectedGameId]);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  const handleOddsChange = (id: number, value: number | null) => {
    if (value !== null) setEditedOdds((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!Object.keys(editedOdds).length) {
      message.info('No changes to save');
      return;
    }
    setSaving(true);
    try {
      const updates = Object.entries(editedOdds).map(([id, newOdds]) => ({
        id: Number(id),
        odds: newOdds,
      }));
      await api.post(`odds/${selectedGameId}`, { updates });
      message.success('Odds saved');
      fetchOdds();
    } catch {
      message.error('Failed to save odds');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      await api.post(`odds/${selectedGameId}`, {
        updates: [
          {
            betType: values.betType,
            odds: values.odds,
            gameType: games.find((g) => g.id === selectedGameId)?.gameType,
          },
        ],
      });
      message.success('Odds entry added');
      setAddModalOpen(false);
      addForm.resetFields();
      fetchOdds();
    } catch {
      message.error('Failed to add odds');
    }
  };

  const handleDelete = async (record: OddsRecord) => {
    try {
      await api.delete(`odds/${selectedGameId}/${record.id}`);
      message.success('Deleted');
      fetchOdds();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const selectedGame = games.find((g) => g.id === selectedGameId);

  const columns: ColumnsType<OddsRecord> = [
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 220,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: 'Odds',
      key: 'odds',
      width: 220,
      render: (_: unknown, record: OddsRecord) => {
        const dirty =
          editedOdds[record.id] !== undefined &&
          editedOdds[record.id] !== record.odds;
        return (
          <Space size={6}>
            <InputNumber
              min={0.0001}
              step={0.1}
              precision={4}
              value={editedOdds[record.id] ?? record.odds}
              onChange={(v) => handleOddsChange(record.id, v)}
              style={{ width: 130 }}
            />
            {dirty && (
              <Tag color="gold" style={{ margin: 0 }}>
                dirty · was {Number(record.odds).toFixed(4)}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: number) =>
        s === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Inactive</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: OddsRecord) => (
        <Popconfirm
          title="Delete this odds entry?"
          description={`Bet type: ${record.betType}`}
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record)}
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
        title="Odds Configuration"
        subtitle={
          selectedGame
            ? `Editing odds for: ${selectedGame.gameName} (${selectedGame.gameType})`
            : 'Select a game to edit its odds'
        }
        icon={<PercentageOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Space wrap>
            <Select
              placeholder="Select Game"
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              value={selectedGameId}
              onChange={setSelectedGameId}
              options={games.map((g) => ({
                value: g.id,
                label: `${g.gameName} (${g.gameType})`,
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchOdds}
              disabled={!selectedGameId}
            >
              Refresh
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                addForm.resetFields();
                setAddModalOpen(true);
              }}
              disabled={!selectedGameId}
            >
              Add
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!Object.keys(editedOdds).length}
            >
              Save Changes
            </Button>
          </Space>
        }
      />

      {!selectedGameId ? (
        <Empty description="Select a game to manage its odds" />
      ) : (
        <Table<OddsRecord>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={odds}
          pagination={false}
          className="modern-table"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: <Empty description="No odds configured for this game" />,
          }}
          rowClassName={(record) =>
            editedOdds[record.id] !== undefined &&
            editedOdds[record.id] !== record.odds
              ? 'ant-table-row-selected'
              : ''
          }
        />
      )}

      <Modal
        title="Add Odds Entry"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="betType"
            label="Bet Type"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., color_red, number_0, sum_big" />
          </Form.Item>
          <Form.Item name="odds" label="Odds" rules={[{ required: true }]}>
            <InputNumber
              min={0.0001}
              step={0.1}
              precision={4}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OddsConfigPage;

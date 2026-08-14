import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  ReloadOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import StatusBadge from '../components/StatusBadge';

interface PrizeEntry {
  rank: number;
  prize: number;
}

interface RankRecord {
  id: number;
  rankId: number;
  rankName: string;
  rankType: string;
  period: string;
  prizes: string | PrizeEntry[] | null;
  status: number;
}

const typeOpts = [
  { value: 'bet_amount', label: 'Bet Amount' },
  { value: 'win_amount', label: 'Win Amount' },
  { value: 'recharge_amount', label: 'Recharge Amount' },
];

const periodOpts = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const periodColors: Record<string, string | undefined> = {
  daily: 'blue',
  weekly: 'green',
  monthly: 'purple',
};

const RankConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RankRecord[]>([]);
  const [filtered, setFiltered] = useState<RankRecord[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RankRecord | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const applyFilter = (list: RankRecord[], period?: string) => {
    if (!period) {
      setFiltered(list);
      return;
    }
    setFiltered(list.filter((r) => r.period === period));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, RankRecord[] | null>('rank-config');
      const list = Array.isArray(res) ? res : [];
      setData(list);
      applyFilter(list, filterPeriod);
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : 'Failed to load rank config';
      message.error(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      rankType: 'bet_amount',
      period: 'daily',
      prizesArr: [
        { rank: 1, prize: 5000 },
        { rank: 2, prize: 3000 },
        { rank: 3, prize: 1000 },
      ],
      status: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (r: RankRecord) => {
    setEditRecord(r);
    const prizesArr = parsePrizes(r.prizes);
    form.setFieldsValue({
      ...r,
      prizesArr: prizesArr.length > 0 ? prizesArr : [{ rank: 1, prize: 0 }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const prizesArr: PrizeEntry[] = Array.isArray(values.prizesArr)
        ? values.prizesArr
        : [];
      const prizes: PrizeEntry[] = prizesArr.filter(
        (p: PrizeEntry) => p?.rank && p?.prize,
      );
      setSubmitLoading(true);
      const { prizesArr: _prizesArr, ...rest } = values;
      void _prizesArr;
      await api.post('rank-config', {
        ...rest,
        prizes: JSON.stringify(prizes),
        id: editRecord?.id,
      });
      message.success(
        editRecord ? 'Rank config updated' : 'Rank config created',
      );
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) message.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`rank-config/${id}`);
      message.success('Rank config deleted');
      fetchData();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to delete';
      message.error(m);
    }
  };

  const parsePrizes = (prizes: RankRecord['prizes']): PrizeEntry[] => {
    if (!prizes) return [];
    if (typeof prizes === 'string') {
      try {
        const parsed = JSON.parse(prizes) as unknown;
        return Array.isArray(parsed) ? (parsed as PrizeEntry[]) : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(prizes) ? prizes : [];
  };

  const MEDAL_COLORS = ['gold', 'silver', '#cd7f32'];
  const MEDAL_LABELS = ['1st', '2nd', '3rd'];

  const columns: ColumnsType<RankRecord> = [
    { title: 'Name', dataIndex: 'rankName', key: 'rankName', width: 200 },
    {
      title: 'Type',
      dataIndex: 'rankType',
      key: 'rankType',
      width: 130,
      render: (v: string) => <Tag color="cyan">{v?.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 100,
      render: (v: string) => (
        <Tag color={periodColors[v]}>{v}</Tag>
      ),
    },
    {
      title: 'Prize Ladder',
      dataIndex: 'prizes',
      key: 'prizes',
      width: 360,
      render: (v: RankRecord['prizes']) => {
        const arr = parsePrizes(v);
        if (arr.length === 0) {
          return <span style={{ color: 'var(--text-muted)' }}>None</span>;
        }
        const top = arr.slice(0, 3);
        const rest = arr.length - top.length;
        return (
          <Space size={6} wrap>
            {top.map((p, i) => (
              <Tag
                key={`${p.rank}-${i}`}
                color={MEDAL_COLORS[i]}
                style={{ margin: 0, display: 'inline-flex', gap: 4 }}
              >
                <span style={{ fontWeight: 600 }}>{MEDAL_LABELS[i]}</span>
                <MoneyText value={p.prize} variant="positive" />
              </Tag>
            ))}
            {rest > 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                +{rest} more
              </span>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => <StatusBadge kind="config" status={v} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, r: RankRecord) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            >
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this rank config?"
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
            okType="danger"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Rank Config"
        subtitle={`${filtered.length} ranking configurations`}
        icon={<TrophyOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Rank
          </Button>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="160px">
            <Select
              placeholder="Period"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => {
                setFilterPeriod(v);
                applyFilter(data, v);
              }}
              value={filterPeriod}
              options={periodOpts}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No rank levels configured. Create ranking tiers to reward top players.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add First Rank
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="modern-table"
          scroll={{ x: 900 }}
        />
      )}

      <Modal
        title={editRecord ? 'Edit Rank Config' : 'Add Rank Config'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="rankId"
                label="Rank ID"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="rankName"
                label="Rank Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="rankType"
                label="Rank Type"
                rules={[{ required: true }]}
              >
                <Select options={typeOpts} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="period"
                label="Period"
                rules={[{ required: true }]}
              >
                <Select options={periodOpts} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="status"
                label="Status"
                valuePropName="checked"
                getValueFromEvent={(c: boolean) => (c ? 1 : 0)}
                getValueProps={(v) => ({ checked: v === 1 })}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Prize Levels</div>
          <Form.List name="prizesArr">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={8}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'rank']}
                        rules={[{ required: true, message: 'Rank' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          placeholder="Rank"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'prize']}
                        rules={[{ required: true, message: 'Prize' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          addonBefore="₹"
                          min={0}
                          placeholder="Prize amount"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ rank: fields.length + 1, prize: 0 })}
                  block
                  icon={<PlusOutlined />}
                  size="small"
                >
                  Add Prize Level
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default RankConfigPage;

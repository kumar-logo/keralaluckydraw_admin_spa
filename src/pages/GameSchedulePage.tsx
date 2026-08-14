import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Switch,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Tag,
  Row,
  Col,
  Card,
  Steps,
  Divider,
  Space,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { useConfigStore } from '../store/configStore';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';

const DEFAULT_DRAW_INTERVAL = 60;
const DEFAULT_STOP_BET_BEFORE = 10;
const DEFAULT_DRAW_DELAY = 5;

interface ScheduleConfig {
  roundDuration?: number;
  stopBetBefore?: number;
  autoGenerate?: boolean;
  drawDelay?: number;
}

interface ScheduleRecord {
  id: number;
  gameName: string;
  gameType: string;
  gameCode: string;
  status: number;
  drawInterval: number;
  configJson: ScheduleConfig;
}

interface ScheduleListResponse {
  list: ScheduleRecord[];
}

interface ScheduleFormValues {
  gameName?: string;
  gameType: string;
  drawInterval: number;
  stopBetBefore: number;
  drawDelay: number;
  autoGenerate: boolean;
  status: boolean;
  minBet: number;
  maxBet: number;
}

const intervalPresetsLocal = [
  { value: 30, label: '30 Seconds' },
  { value: 60, label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' },
  { value: 300, label: '5 Minutes' },
  { value: 600, label: '10 Minutes' },
];

const fmtDuration = (sec: number) => {
  if (!sec) return '-';
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60)
    return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`;
  return `${sec}s`;
};

const categoryTabs = [
  { key: 'all', label: 'All Games' },
  { key: 'color', label: 'Colour' },
  { key: 'dice', label: 'Dice' },
  { key: 'race', label: 'Race' },
  { key: 'other', label: 'Other' },
];

const GameSchedulePage = () => {
  const {
    isLotteryType,
    gameOnlyTypes,
    intervalPresets: configIntervals,
  } = useConfigStore();
  const intervals =
    configIntervals.length > 0 ? configIntervals : intervalPresetsLocal;
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<ScheduleRecord[]>([]);
  const [filtered, setFiltered] = useState<ScheduleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editRecord, setEditRecord] = useState<ScheduleRecord | null>(null);
  const [form] = Form.useForm<ScheduleFormValues>();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const applyFilters = (data: ScheduleRecord[], q: string, cat: string) => {
    let result = data.filter((g) => !isLotteryType(g.gameType));
    if (q)
      result = result.filter(
        (g) =>
          g.gameName.toLowerCase().includes(q.toLowerCase()) ||
          g.gameCode.toLowerCase().includes(q.toLowerCase()),
      );
    if (cat !== 'all') {
      if (cat === 'other')
        result = result.filter(
          (g) => !['color', 'dice', 'race'].includes(g.gameType),
        );
      else result = result.filter((g) => g.gameType === cat);
    }
    setFiltered(result);
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.post<unknown, ScheduleListResponse>('games/list', {
        pageNo: 1,
        pageSize: 200,
      });
      setAllData(res.list);
      applyFilters(res.list, search, category);
    } catch {
      message.error('Failed to load game schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);
  useEffect(() => {
    applyFilters(allData, search, category);
  }, [search, category]);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    form.setFieldsValue({
      gameType: 'color',
      drawInterval: 60,
      stopBetBefore: 10,
      drawDelay: 5,
      autoGenerate: true,
      status: true,
      minBet: 1,
      maxBet: 10000,
    });
    setStep(0);
    setFormMode('create');
  };

  const openEdit = (record: ScheduleRecord) => {
    setEditRecord(record);
    form.resetFields();
    const config = record.configJson;
    form.setFieldsValue({
      gameName: record.gameName,
      gameType: record.gameType,
      drawInterval:
        config.roundDuration ?? record.drawInterval ?? DEFAULT_DRAW_INTERVAL,
      stopBetBefore: config.stopBetBefore ?? DEFAULT_STOP_BET_BEFORE,
      drawDelay: config.drawDelay ?? DEFAULT_DRAW_DELAY,
      autoGenerate: config.autoGenerate !== false,
    });
    setStep(0);
    setFormMode('edit');
  };

  const handleCreateSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const typeLabelRaw = gameOnlyTypes
        .find((o) => o.value === values.gameType)
        ?.label?.split(' ')[0];
      const typeLabel = typeLabelRaw
        ? typeLabelRaw
        : values.gameType.toUpperCase();
      const name = values.gameName
        ? values.gameName
        : `${typeLabel} ${fmtDuration(values.drawInterval)}`;

      await api.post('games/create', {
        name,
        gameType: values.gameType,
        category: 'casino',
        status: values.status ? 1 : 0,
        sortOrder: 0,
        minBet: values.minBet,
        maxBet: values.maxBet,
        drawInterval: values.drawInterval,
        configJson: {
          roundDuration: values.drawInterval,
          stopBetBefore: values.stopBetBefore,
          drawDelay: values.drawDelay,
          autoGenerate: values.autoGenerate,
        },
      });
      message.success('Game schedule created');
      setFormMode('list');
      fetchSchedules();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to create schedule'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.post(`schedule/${editRecord!.id}`, {
        roundDuration: values.drawInterval,
        stopBetBefore: values.stopBetBefore,
        drawDelay: values.drawDelay,
        autoGenerate: values.autoGenerate,
      });
      message.success('Schedule updated');
      setFormMode('list');
      fetchSchedules();
    } catch {
      message.error('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ScheduleRecord> = [
    {
      title: 'Game',
      dataIndex: 'gameName',
      key: 'gameName',
      width: 200,
      render: (v: string, r: ScheduleRecord) => (
        <div>
          <span style={{ fontWeight: 600 }}>{v}</span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {r.gameCode}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 80,
      render: (v: string) => <Tag>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: number) =>
        s === 1 ? (
          <span className="status-badge active">Active</span>
        ) : (
          <span className="status-badge inactive">Inactive</span>
        ),
    },
    {
      title: 'Round Duration',
      key: 'roundDuration',
      width: 130,
      render: (_: unknown, r: ScheduleRecord) => (
        <span style={{ fontWeight: 600 }}>
          {fmtDuration(r.configJson.roundDuration ?? r.drawInterval)}
        </span>
      ),
    },
    {
      title: 'Stop Before',
      key: 'stopBetBefore',
      width: 100,
      render: (_: unknown, r: ScheduleRecord) =>
        `${r.configJson.stopBetBefore ?? DEFAULT_STOP_BET_BEFORE}s`,
    },
    {
      title: 'Draw Delay',
      key: 'drawDelay',
      width: 100,
      render: (_: unknown, r: ScheduleRecord) =>
        `${r.configJson.drawDelay ?? DEFAULT_DRAW_DELAY}s`,
    },
    {
      title: 'Mode',
      key: 'autoGenerate',
      width: 100,
      render: (_: unknown, r: ScheduleRecord) =>
        r.configJson?.autoGenerate !== false ? (
          <Tag color="green">Auto</Tag>
        ) : (
          <Tag color="orange">Manual</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ScheduleRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  if (formMode !== 'list') {
    const isCreate = formMode === 'create';
    const steps = isCreate
      ? [
          { title: 'Game Type & Interval', description: 'What and how often' },
          { title: 'Timing Config', description: 'Betting & draw timing' },
        ]
      : [{ title: 'Schedule Config', description: 'Update timing settings' }];

    return (
      <div
        className="page-container"
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setFormMode('list')}
            type="text"
          />
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {isCreate
              ? 'Create Game Schedule'
              : `Edit Schedule — ${editRecord?.gameName}`}
          </span>
        </div>

        {steps.length > 1 && (
          <Steps current={step} items={steps} style={{ marginBottom: 24 }} />
        )}

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 32 } }}>
          <Form form={form} layout="vertical">
            {' '}
            <div
              style={{
                display: (isCreate ? step === 0 : true) ? 'block' : 'none',
              }}
            >
              {isCreate && (
                <>
                  <Form.Item
                    name="gameType"
                    label="Game Type"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={gameOnlyTypes.map((t) => ({
                        value: t.value,
                        label: t.label,
                      }))}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="gameName"
                    label="Game Name"
                    extra="Leave empty for auto-name like 'Colour 1m'"
                  >
                    <Input placeholder="Auto-generated if empty" size="large" />
                  </Form.Item>
                </>
              )}
              <Row gutter={24}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="drawInterval"
                    label="Round Interval"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={intervals.map((p) => ({
                        value: p.value,
                        label: p.label,
                      }))}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="stopBetBefore"
                    label="Stop Bet Before (sec)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={1}
                      max={3600}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="drawDelay"
                    label="Draw Delay (sec)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      max={300}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="autoGenerate"
                    label="Auto Generate"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Auto" unCheckedChildren="Manual" />
                  </Form.Item>
                </Col>
                {isCreate && (
                  <>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item name="minBet" label="Min Bet">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="status"
                        label="Status"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="Active"
                          unCheckedChildren="Disabled"
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
              {isCreate && (
                <Form.Item name="maxBet" label="Max Bet">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              )}
            </div>
          </Form>
        </Card>

        <Divider style={{ margin: '16px 0' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            paddingBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <Button size="large" onClick={() => setFormMode('list')}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={isCreate ? handleCreateSave : handleEditSave}
            loading={saving}
          >
            {isCreate ? 'Create Schedule' : 'Update Schedule'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Game Schedule"
        subtitle={`${filtered.length} game schedules`}
        icon={<ClockCircleOutlined />}
        iconBg="var(--gradient-cyan)"
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={fetchSchedules}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Create Schedule
            </Button>
          </Space>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="260px">
            <Input.Search
              placeholder="Search by name or code..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(v) => setSearch(v)}
              onChange={(e) => !e.target.value && search && setSearch('')}
            />
          </Col>
          <Col flex="160px">
            <Select
              value={category}
              style={{ width: '100%' }}
              onChange={setCategory}
              options={categoryTabs.map((t) => ({
                value: t.key,
                label: t.label,
              }))}
            />
          </Col>
        </Row>
      </div>

      {!loading && filtered.length === 0 ? (
        <Empty description="No game schedules found. Create your first game schedule.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create First Schedule
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={false}
          className="modern-table"
          scroll={{ x: 900 }}
        />
      )}
    </div>
  );
};

export default GameSchedulePage;

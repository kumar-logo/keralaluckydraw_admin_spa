import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Space,
  message,
  Modal,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Table,
  Tag,
  Tooltip,
  Switch,
  Input,
  Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateTime } from '../utils/format';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface CleanupResult {
  dryRun: boolean;
  deletable?: number;
  deleted?: number;
  skipped: number;
  totalInRange: number;
}

interface CronJobStatus {
  name: string;
  cronExpression: string;
  enabled: boolean;
  managed: boolean;
  running: boolean;
  nextRun: string | null;
  lastRun: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastDurationMs: number | null;
}

interface CronJobLabel {
  label: string;
  hint: string;
}

const CRON_JOB_LABELS: Record<string, CronJobLabel> = {
  'round-cleanup': {
    label: 'Round cleanup',
    hint: 'Deletes order-less finished rounds. Default: daily at 03:00.',
  },
  'recharge-reconcile': {
    label: 'Recharge reconcile',
    hint: 'Reconciles pending recharges. Default: every 5 minutes.',
  },
  'daily-rebate': {
    label: 'Daily rebate',
    hint: 'Calculates daily VIP rebate. Default: daily at 00:05.',
  },
  'vip-level-update': {
    label: 'VIP level update',
    hint: 'Recomputes VIP levels. Default: daily at 00:10.',
  },
  'daily-commission': {
    label: 'Daily commission',
    hint: 'Settles agent commission. Default: daily at 00:15.',
  },
};

const resolveJobLabel = (name: string): string => {
  const entry = CRON_JOB_LABELS[name];
  return entry ? entry.label : name;
};

const resolveJobHint = (name: string): string => {
  const entry = CRON_JOB_LABELS[name];
  return entry ? entry.hint : '';
};

const CRON_FORMAT_HINT =
  'Cron format: 5 fields "min hour day month weekday" or 6 with leading seconds. Example: "0 3 * * *" runs daily at 03:00.';

const SchedulersPage = () => {
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<CleanupResult | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJobStatus[]>([]);
  const [cronLoading, setCronLoading] = useState(false);
  const [togglingJob, setTogglingJob] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<CronJobStatus | null>(null);
  const [editExpression, setEditExpression] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadCronStatus = useCallback(async () => {
    setCronLoading(true);
    try {
      const res = (await api.get(
        'system/cron/status',
      )) as unknown as CronJobStatus[];
      setCronJobs(res);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to load cron status'));
    } finally {
      setCronLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCronStatus();
  }, [loadCronStatus]);

  const toggleCronJob = async (job: CronJobStatus, enabled: boolean) => {
    setTogglingJob(job.name);
    try {
      await api.patch(`system/cron/${job.name}`, { enabled });
      message.success(
        `${resolveJobLabel(job.name)} ${enabled ? 'enabled' : 'disabled'}`,
      );
      await loadCronStatus();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to update job'));
    } finally {
      setTogglingJob(null);
    }
  };

  const openEdit = (job: CronJobStatus) => {
    setEditJob(job);
    setEditExpression(job.cronExpression);
  };

  const closeEdit = () => {
    setEditJob(null);
    setEditExpression('');
  };

  const saveEdit = async () => {
    if (!editJob) return;
    const expression = editExpression.trim();
    if (!expression) {
      message.warning('Enter a cron expression');
      return;
    }
    setSavingEdit(true);
    try {
      await api.patch(`system/cron/${editJob.name}`, {
        cronExpression: expression,
      });
      message.success(`${resolveJobLabel(editJob.name)} schedule updated`);
      closeEdit();
      await loadCronStatus();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Invalid schedule'));
    } finally {
      setSavingEdit(false);
    }
  };

  const dateBounds = () => {
    if (!range || !range[0] || !range[1]) return null;
    return {
      fromDate: range[0].format('YYYY-MM-DD'),
      toDate: range[1].format('YYYY-MM-DD'),
    };
  };

  const runPreview = async () => {
    const bounds = dateBounds();
    if (!bounds) {
      message.warning('Select a date range first');
      return;
    }
    setLoading(true);
    try {
      const res = (await api.post('system/rounds/cleanup', {
        ...bounds,
        dryRun: true,
      })) as unknown as CleanupResult;
      setPreview(res);
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Preview failed'));
    } finally {
      setLoading(false);
    }
  };

  const runDelete = () => {
    const bounds = dateBounds();
    if (!bounds || !preview) return;
    Modal.confirm({
      title: 'Delete order-less rounds?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <span>
          This permanently deletes{' '}
          <Text strong>{preview.deletable ? preview.deletable : 0}</Text> game
          rounds (with no
          orders) between <Text strong>{bounds.fromDate}</Text> and{' '}
          <Text strong>{bounds.toDate}</Text>. Rounds that have orders are kept.
          This cannot be undone.
        </span>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleting(true);
        try {
          const res = (await api.post('system/rounds/cleanup', {
            ...bounds,
            dryRun: false,
          })) as unknown as CleanupResult;
          message.success(
            `Deleted ${res.deleted ? res.deleted : 0} rounds, kept ${res.skipped} with orders`,
          );
          setPreview(res);
        } catch (e) {
          message.error(getApiErrorMessage(e, 'Delete failed'));
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const resolveDeletable = (result: CleanupResult): number => {
    if (result.deletable !== undefined) return result.deletable;
    if (result.deleted !== undefined) return result.deleted;
    return 0;
  };
  const deletableCount = preview ? resolveDeletable(preview) : 0;

  const cronColumns: ColumnsType<CronJobStatus> = [
    {
      title: 'Job',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{resolveJobLabel(name)}</Text>,
    },
    {
      title: 'Schedule',
      dataIndex: 'cronExpression',
      key: 'cronExpression',
      render: (cronExpression: string, job) => (
        <Space>
          <Text code>{cronExpression}</Text>
          {job.managed && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(job)}
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, job) =>
        job.managed ? (
          <Switch
            checked={enabled}
            loading={togglingJob === job.name}
            onChange={(checked) => void toggleCronJob(job, checked)}
          />
        ) : (
          <Tag>Read-only</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'running',
      key: 'running',
      render: (running: boolean) =>
        running ? (
          <Tag color="green">Running</Tag>
        ) : (
          <Tag color="red">Stopped</Tag>
        ),
    },
    {
      title: 'Next run',
      dataIndex: 'nextRun',
      key: 'nextRun',
      render: (nextRun: string | null) => formatDateTime(nextRun),
    },
    {
      title: 'Last run',
      dataIndex: 'lastRun',
      key: 'lastRun',
      render: (lastRun: string | null) => formatDateTime(lastRun),
    },
    {
      title: 'Last result',
      key: 'lastStatus',
      render: (_: unknown, row: CronJobStatus) => {
        if (!row.lastStatus) return '—';
        const ok = row.lastStatus === 'ok';
        const duration =
          row.lastDurationMs !== null ? ` · ${row.lastDurationMs}ms` : '';
        return (
          <Tooltip title={row.lastError || ''}>
            <Tag color={ok ? 'green' : 'red'}>
              {ok ? 'OK' : 'Error'}
              {duration}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Schedulers"
        subtitle="Scheduled background jobs + manual round cleanup"
      />
      <Card
        title="Scheduled Jobs"
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={cronLoading}
            onClick={() => void loadCronStatus()}
          >
            Refresh
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          message="Toggle a managed job on or off, or edit its schedule. Changes persist across backend restarts. Times follow the server clock. Read-only jobs are managed elsewhere."
          style={{ marginBottom: 16 }}
        />
        <Table<CronJobStatus>
          rowKey="name"
          columns={cronColumns}
          dataSource={cronJobs}
          loading={cronLoading}
          pagination={false}
          size="small"
          scroll={{ x: true }}
        />
      </Card>
      <Modal
        title={
          editJob
            ? `Edit schedule — ${resolveJobLabel(editJob.name)}`
            : 'Edit schedule'
        }
        open={editJob !== null}
        onCancel={closeEdit}
        onOk={() => void saveEdit()}
        okText="Save"
        confirmLoading={savingEdit}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Cron expression">
            <Input
              value={editExpression}
              onChange={(e) => setEditExpression(e.target.value)}
              placeholder="0 3 * * *"
            />
          </Form.Item>
          {editJob && resolveJobHint(editJob.name) && (
            <Alert
              type="info"
              showIcon
              message={resolveJobHint(editJob.name)}
              style={{ marginBottom: 12 }}
            />
          )}
          <Text type="secondary">{CRON_FORMAT_HINT}</Text>
        </Form>
      </Modal>
      <Card>
        <Alert
          type="info"
          showIcon
          message="Only settled or cancelled rounds with zero orders are removed. Any round that has at least one order (including refunded) is always kept."
          style={{ marginBottom: 16 }}
        />
        <Space wrap align="end" size="middle">
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Date range (by round creation date)</Text>
            </div>
            <RangePicker
              value={range as [Dayjs, Dayjs]}
              onChange={(v) => {
                setRange(v as [Dayjs, Dayjs] | null);
                setPreview(null);
              }}
              allowClear
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={runPreview}
          >
            Preview
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deleting}
            disabled={!preview || deletableCount === 0}
            onClick={runDelete}
          >
            Delete order-less rounds
          </Button>
        </Space>

        {preview && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col xs={8}>
              <Statistic
                title={
                  preview.dryRun ? 'Deletable (no orders)' : 'Deleted'
                }
                value={deletableCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col xs={8}>
              <Statistic title="Kept (has orders)" value={preview.skipped} />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Finished rounds in range"
                value={preview.totalInRange}
              />
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
};

export default SchedulersPage;

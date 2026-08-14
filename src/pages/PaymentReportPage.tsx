import { useState, useEffect } from 'react';
import { Row, Col, DatePicker, Button, Table, Tabs, Tag, Empty, message } from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  PercentageOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import {
  CURRENCY_SYMBOL,
  formatNumber,
  formatPercent,
  formatDateTime,
} from '../utils/format';
import { downloadCsv } from '../utils/csv';

const { RangePicker } = DatePicker;

interface PaymentData {
  recharge: {
    total: number;
    success: number;
    pending: number;
    failed: number;
    successRate: number;
  };
  withdraw: { total: number; approved: number; pending: number };
  netFlow: number;
}

interface PaymentChannelRow {
  key: string;
  method: string;
  count: number;
  total: number;
  successRate: number;
  failed: number;
}

interface ManualRechargeRow {
  orderNo: string;
  userId: string;
  amount: number;
  status: number;
  createdAt: string;
}

interface ManualWithdrawRow {
  orderNo: string;
  userId: string;
  amount: number;
  fee: number;
  actualAmount: number;
  status: number;
  createdAt: string;
}

interface ManualPaymentData {
  recharges: ManualRechargeRow[];
  withdrawals: ManualWithdrawRow[];
  summary: {
    totalManualRecharge: number;
    totalManualWithdrawApproved: number;
    totalManualWithdrawRejected: number;
  };
}

const PaymentReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaymentData | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualData, setManualData] = useState<ManualPaymentData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = (await api.post('reports/payments', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as PaymentData;
      setData(res);
    } catch {
      message.error('Failed to load payment report');
    } finally {
      setLoading(false);
    }
  };

  const fetchManualReport = async () => {
    setManualLoading(true);
    try {
      const res = (await api.post('reports/manual-payments', {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })) as unknown as ManualPaymentData;
      setManualData(res);
    } catch {
      message.error('Failed to load manual payments report');
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchManualReport();
  }, []);

  if (loading && !data) return <PageLoader cards={4} />;

  const rechargeDonut = data
    ? [
        {
          name: 'Success',
          value: data.recharge.success,
          color: 'var(--success)',
        },
        {
          name: 'Pending',
          value: data.recharge.pending,
          color: 'var(--warning)',
        },
        { name: 'Failed', value: data.recharge.failed, color: 'var(--danger)' },
      ].filter((d) => d.value > 0)
    : [];

  const withdrawDonut = data
    ? [
        {
          name: 'Approved',
          value: data.withdraw.approved,
          color: 'var(--success)',
        },
        {
          name: 'Pending',
          value: data.withdraw.pending,
          color: 'var(--warning)',
        },
      ].filter((d) => d.value > 0)
    : [];

  const withdrawSettled = data
    ? data.withdraw.approved + data.withdraw.pending
    : 0;
  const channelRows: PaymentChannelRow[] = data
    ? [
        {
          key: 'recharge',
          method: 'Recharge',
          count:
            data.recharge.success +
            data.recharge.pending +
            data.recharge.failed,
          total: data.recharge.total,
          successRate: data.recharge.successRate,
          failed: data.recharge.failed,
        },
        {
          key: 'withdraw',
          method: 'Withdraw',
          count: withdrawSettled,
          total: data.withdraw.total,
          successRate:
            withdrawSettled > 0
              ? (data.withdraw.approved / withdrawSettled) * 100
              : 0,
          failed: 0,
        },
      ]
    : [];

  const exportCsv = () => {
    if (!data) return;
    const header = ['Method', 'Count', 'Total', 'Success %', 'Failed'];
    const rows = channelRows.map((c) => [
      c.method,
      c.count,
      c.total.toFixed(2),
      c.successRate.toFixed(2),
      c.failed,
    ]);
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');
    downloadCsv(`payment-report_${start}_${end}.csv`, header, rows);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Payment Report"
        subtitle="Recharge and withdrawal analysis"
        icon={<DollarOutlined />}
        iconBg="var(--gradient-cyan)"
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RangePicker
              value={dateRange}
              onChange={(d) => {
                if (d) setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]);
              }}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchReport();
                fetchManualReport();
              }}
              loading={loading || manualLoading}
            >
              Generate
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportCsv}
              disabled={!data}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <Tabs
        defaultActiveKey="gateway"
        items={[
          {
            key: 'gateway',
            label: 'Gateway Payments',
            children: data ? (
        <>
          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-1"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Recharge"
                value={data.recharge.total}
                icon={<DollarOutlined />}
                color="blue"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-2"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Success"
                value={data.recharge.success}
                icon={<CheckCircleOutlined />}
                color="green"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-3"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Success Rate"
                value={data.recharge.successRate}
                icon={<PercentageOutlined />}
                color="indigo"
                suffix="%"
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-4"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Total Withdraw"
                value={data.withdraw.total}
                icon={<DollarOutlined />}
                color="orange"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-5"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Approved"
                value={data.withdraw.approved}
                icon={<CheckCircleOutlined />}
                color="cyan"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4}
              className="animate-fade-in-up stagger-6"
              style={{ opacity: 0 }}
            >
              <StatsCard
                title="Net Flow"
                value={data.netFlow}
                icon={<SwapOutlined />}
                color="purple"
                prefix={CURRENCY_SYMBOL}
                precision={2}
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col
              xs={24}
              lg={12}
              className="animate-fade-in-up stagger-7"
              style={{ opacity: 0 }}
            >
              <ChartCard
                title={`Recharge Breakdown (${formatPercent(data.recharge.successRate)} success)`}
                height={300}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={rechargeDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent == null
                          ? ''
                          : `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{
                        stroke: 'var(--text-muted)',
                        strokeWidth: 1,
                      }}
                    >
                      {rechargeDonut.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col
              xs={24}
              lg={12}
              className="animate-fade-in-up stagger-8"
              style={{ opacity: 0 }}
            >
              <ChartCard title="Withdrawal Breakdown" height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={withdrawDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        percent == null
                          ? ''
                          : `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{
                        stroke: 'var(--text-muted)',
                        strokeWidth: 1,
                      }}
                    >
                      {withdrawDonut.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>

          <ChartCard title="Payment Channels">
            <Table<PaymentChannelRow>
              rowKey="key"
              columns={[
                {
                  title: 'Method',
                  dataIndex: 'method',
                  key: 'method',
                  width: 140,
                },
                {
                  title: 'Count',
                  dataIndex: 'count',
                  key: 'count',
                  width: 120,
                  render: (v: number) => formatNumber(v),
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  key: 'total',
                  width: 160,
                  render: (v: number) => <MoneyText value={v} variant="neutral" />,
                },
                {
                  title: 'Success %',
                  dataIndex: 'successRate',
                  key: 'successRate',
                  width: 120,
                  render: (v: number) => formatPercent(v),
                },
                {
                  title: 'Failed',
                  dataIndex: 'failed',
                  key: 'failed',
                  width: 120,
                  render: (v: number) => formatNumber(v),
                },
              ]}
              dataSource={channelRows}
              pagination={false}
              size="small"
              className="modern-table"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </ChartCard>
        </>
            ) : (
              <Empty description="No gateway payment data" />
            ),
          },
          {
            key: 'manual',
            label: 'Manual Payments',
            children: (
              <>
                <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                      title="Manual Recharge"
                      value={
                        manualData ? manualData.summary.totalManualRecharge : 0
                      }
                      icon={<DollarOutlined />}
                      color="blue"
                      prefix={CURRENCY_SYMBOL}
                      precision={2}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                      title="Manual Withdraw (Approved)"
                      value={
                        manualData
                          ? manualData.summary.totalManualWithdrawApproved
                          : 0
                      }
                      icon={<CheckCircleOutlined />}
                      color="green"
                      prefix={CURRENCY_SYMBOL}
                      precision={2}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <StatsCard
                      title="Manual Withdraw (Rejected)"
                      value={
                        manualData
                          ? manualData.summary.totalManualWithdrawRejected
                          : 0
                      }
                      icon={<SwapOutlined />}
                      color="orange"
                      prefix={CURRENCY_SYMBOL}
                      precision={2}
                    />
                  </Col>
                </Row>

                <ChartCard title="Manual Recharges">
                  <Table<ManualRechargeRow>
                    rowKey="orderNo"
                    loading={manualLoading}
                    columns={[
                      {
                        title: 'Order No',
                        dataIndex: 'orderNo',
                        key: 'orderNo',
                        width: 200,
                        render: (v: string) => <span className="mono">{v}</span>,
                      },
                      {
                        title: 'User ID',
                        dataIndex: 'userId',
                        key: 'userId',
                        width: 150,
                        render: (v: string) => <span className="mono">{v}</span>,
                      },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        key: 'amount',
                        width: 150,
                        render: (v: number) => (
                          <MoneyText value={v} variant="positive" />
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (v: number) =>
                          v === 1 ? (
                            <Tag color="green">Approved</Tag>
                          ) : (
                            <Tag color="default">{v}</Tag>
                          ),
                      },
                      {
                        title: 'Created',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        width: 180,
                        render: (v: string) => formatDateTime(v),
                      },
                    ]}
                    dataSource={manualData ? manualData.recharges : []}
                    size="small"
                    className="modern-table"
                    scroll={{ x: 800 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{
                      emptyText: <Empty description="No manual recharges" />,
                    }}
                  />
                </ChartCard>

                <div style={{ marginTop: 24 }}>
                  <ChartCard title="Manual Withdrawals">
                    <Table<ManualWithdrawRow>
                      rowKey="orderNo"
                      loading={manualLoading}
                      columns={[
                        {
                          title: 'Order No',
                          dataIndex: 'orderNo',
                          key: 'orderNo',
                          width: 200,
                          render: (v: string) => (
                            <span className="mono">{v}</span>
                          ),
                        },
                        {
                          title: 'User ID',
                          dataIndex: 'userId',
                          key: 'userId',
                          width: 150,
                          render: (v: string) => (
                            <span className="mono">{v}</span>
                          ),
                        },
                        {
                          title: 'Amount',
                          dataIndex: 'amount',
                          key: 'amount',
                          width: 130,
                          render: (v: number) => (
                            <MoneyText value={v} variant="neutral" />
                          ),
                        },
                        {
                          title: 'Fee',
                          dataIndex: 'fee',
                          key: 'fee',
                          width: 120,
                          render: (v: number) => (
                            <MoneyText value={v} variant="negative" />
                          ),
                        },
                        {
                          title: 'Actual',
                          dataIndex: 'actualAmount',
                          key: 'actualAmount',
                          width: 130,
                          render: (v: number) => (
                            <MoneyText value={v} variant="positive" />
                          ),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          width: 120,
                          render: (v: number) =>
                            v === 1 ? (
                              <Tag color="green">Approved</Tag>
                            ) : v === 2 ? (
                              <Tag color="red">Rejected</Tag>
                            ) : (
                              <Tag color="default">{v}</Tag>
                            ),
                        },
                        {
                          title: 'Created',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          width: 180,
                          render: (v: string) => formatDateTime(v),
                        },
                      ]}
                      dataSource={manualData ? manualData.withdrawals : []}
                      size="small"
                      className="modern-table"
                      scroll={{ x: 1000 }}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      locale={{
                        emptyText: <Empty description="No manual withdrawals" />,
                      }}
                    />
                  </ChartCard>
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default PaymentReportPage;

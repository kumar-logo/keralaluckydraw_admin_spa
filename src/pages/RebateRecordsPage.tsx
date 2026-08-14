import { useState, useEffect } from 'react';
import { Table, Input, Button, message, Tag, Row, Col, Tooltip, Empty } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import { formatDateTime, formatPercent } from '../utils/format';

interface RebateRecord {
  id: number;
  userId: string;
  dateKey: string;
  gameType: string;
  betAmount: number;
  rebateRate: number;
  rebateAmount: number;
  status: number;
  createdAt: string;
}

interface RebateListResponse {
  list: RebateRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface RebateListParams {
  pageNo: number;
  pageSize: number;
  userId?: string;
  dateKey?: string;
}

const RebateRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RebateRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userId, setUserId] = useState('');
  const [dateKey, setDateKey] = useState('');

  const fetchRecords = async (
    page = pageNo,
    size = pageSize,
    uid = userId,
    dk = dateKey,
  ) => {
    setLoading(true);
    try {
      const params: RebateListParams = { pageNo: page, pageSize: size };
      if (uid) params.userId = uid;
      if (dk) params.dateKey = dk;
      const res = await api.post<unknown, RebateListResponse>(
        'rebate/list',
        params,
      );
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch {
      message.error('Failed to load rebate records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUserId = (v: string) => {
    setUserId(v);
    setPageNo(1);
    fetchRecords(1, pageSize, v, dateKey);
  };
  const handleDateKey = (v: string) => {
    setDateKey(v);
    setPageNo(1);
    fetchRecords(1, pageSize, userId, v);
  };

  const columns: ColumnsType<RebateRecord> = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'dateKey',
      key: 'dateKey',
      width: 130,
    },
    {
      title: 'Game',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 130,
      render: (v: string) =>
        v ? <Tag color="purple">{v.replace(/_/g, ' ')}</Tag> : '—',
    },
    {
      title: 'Bet Amount',
      dataIndex: 'betAmount',
      key: 'betAmount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Rebate Rate',
      dataIndex: 'rebateRate',
      key: 'rebateRate',
      width: 130,
      render: (v: number) => formatPercent(v * 100),
    },
    {
      title: 'Rebate Amount',
      dataIndex: 'rebateAmount',
      key: 'rebateAmount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">Settled</Tag>
        ) : (
          <Tag color="default">Pending</Tag>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Rebate Records"
        subtitle={`${total} entries`}
        icon={<FieldTimeOutlined />}
        iconBg="var(--gradient-indigo)"
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="240px">
            <Input.Search
              placeholder="Filter by User ID..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleUserId}
              onChange={(e) => !e.target.value && userId && handleUserId('')}
            />
          </Col>
          <Col flex="200px">
            <Input.Search
              placeholder="Date key (YYYY-MM-DD)"
              allowClear
              onSearch={handleDateKey}
              onChange={(e) => !e.target.value && dateKey && handleDateKey('')}
            />
          </Col>
          <Col>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => fetchRecords()} />
            </Tooltip>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        className="modern-table"
        scroll={{ x: 1130 }}
        locale={{ emptyText: <Empty description="No rebate records" /> }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} entries`,
          onChange: (p, s) => {
            setPageNo(p);
            setPageSize(s);
            fetchRecords(p, s);
          },
        }}
      />
    </div>
  );
};

export default RebateRecordsPage;

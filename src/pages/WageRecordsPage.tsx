import { useState, useEffect } from 'react';
import { Table, Input, Button, message, Tag, Row, Col, Tooltip, Empty } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import { formatDateTime } from '../utils/format';

interface WageRecord {
  id: number;
  userId: string;
  weekKey: string;
  condAmount: number;
  rcAmount: number;
  wageAmount: number;
  isClaim: number;
  createdAt: string;
}

interface WageListResponse {
  list: WageRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface WageListParams {
  pageNo: number;
  pageSize: number;
  search?: string;
  weekKey?: string;
}

const WageRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [weekKey, setWeekKey] = useState('');

  const fetchRecords = async (
    page = pageNo,
    size = pageSize,
    q = search,
    wk = weekKey,
  ) => {
    setLoading(true);
    try {
      const params: WageListParams = { pageNo: page, pageSize: size };
      if (q) params.search = q;
      if (wk) params.weekKey = wk;
      const res = await api.post<unknown, WageListResponse>(
        'wage-records/list',
        params,
      );
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch {
      message.error('Failed to load wage records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPageNo(1);
    fetchRecords(1, pageSize, v, weekKey);
  };
  const handleWeekKey = (v: string) => {
    setWeekKey(v);
    setPageNo(1);
    fetchRecords(1, pageSize, search, v);
  };

  const columns: ColumnsType<WageRecord> = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    {
      title: 'Week',
      dataIndex: 'weekKey',
      key: 'weekKey',
      width: 130,
    },
    {
      title: 'Condition Amount',
      dataIndex: 'condAmount',
      key: 'condAmount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Recharge Amount',
      dataIndex: 'rcAmount',
      key: 'rcAmount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Wage Amount',
      dataIndex: 'wageAmount',
      key: 'wageAmount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Claimed',
      dataIndex: 'isClaim',
      key: 'isClaim',
      width: 110,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">Claimed</Tag>
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
        title="Wage Records"
        subtitle={`${total} entries`}
        icon={<MoneyCollectOutlined />}
        iconBg="var(--gradient-green)"
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="240px">
            <Input.Search
              placeholder="Search by User ID..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="200px">
            <Input.Search
              placeholder="Week key (e.g. 2026-W12)"
              allowClear
              onSearch={handleWeekKey}
              onChange={(e) => !e.target.value && weekKey && handleWeekKey('')}
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
        scroll={{ x: 1020 }}
        locale={{ emptyText: <Empty description="No wage records" /> }}
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

export default WageRecordsPage;

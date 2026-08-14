import { useState, useEffect } from 'react';
import { Table, Input, Button, message, Tag, Row, Col, Tooltip, Empty } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import MoneyText from '../components/MoneyText';
import { formatDateTime } from '../utils/format';

interface AgentCommission {
  id: number;
  userId: string;
  fromUser: string;
  sourceType: string;
  amount: number;
  commission: number;
  levelDepth: number;
  createdAt: string;
}

interface CommissionListResponse {
  list: AgentCommission[];
  total: number;
  pageNo: number;
  pageSize: number;
}

interface CommissionListParams {
  pageNo: number;
  pageSize: number;
  search?: string;
  sourceType?: string;
}

const AgentCommissionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AgentCommission[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sourceType, setSourceType] = useState('');

  const fetchRecords = async (
    page = pageNo,
    size = pageSize,
    q = search,
    st = sourceType,
  ) => {
    setLoading(true);
    try {
      const params: CommissionListParams = { pageNo: page, pageSize: size };
      if (q) params.search = q;
      if (st) params.sourceType = st;
      const res = await api.post<unknown, CommissionListResponse>(
        'agent-commissions/list',
        params,
      );
      setData(res.list);
      setTotal(res.total);
      setPageNo(res.pageNo);
      setPageSize(res.pageSize);
    } catch {
      message.error('Failed to load agent commissions');
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
    fetchRecords(1, pageSize, v, sourceType);
  };
  const handleSourceType = (v: string) => {
    setSourceType(v);
    setPageNo(1);
    fetchRecords(1, pageSize, search, v);
  };

  const columns: ColumnsType<AgentCommission> = [
    {
      title: 'Agent (User ID)',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    {
      title: 'From User',
      dataIndex: 'fromUser',
      key: 'fromUser',
      width: 150,
      render: (v: string) => <span className="mono">{v}</span>,
    },
    {
      title: 'Source',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 130,
      render: (v: string) =>
        v ? <Tag color="blue">{v.replace(/_/g, ' ')}</Tag> : '—',
    },
    {
      title: 'Base Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Commission',
      dataIndex: 'commission',
      key: 'commission',
      width: 150,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Level',
      dataIndex: 'levelDepth',
      key: 'levelDepth',
      width: 90,
      render: (v: number) => <Tag>L{v}</Tag>,
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
        title="Agent Commissions"
        subtitle={`${total} entries`}
        icon={<PercentageOutlined />}
        iconBg="var(--gradient-orange)"
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="260px">
            <Input.Search
              placeholder="Search by agent or from-user..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && search && handleSearch('')}
            />
          </Col>
          <Col flex="200px">
            <Input.Search
              placeholder="Source type"
              allowClear
              onSearch={handleSourceType}
              onChange={(e) =>
                !e.target.value && sourceType && handleSourceType('')
              }
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
        scroll={{ x: 1060 }}
        locale={{ emptyText: <Empty description="No commission records" /> }}
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

export default AgentCommissionsPage;

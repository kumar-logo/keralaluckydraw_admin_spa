import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, Table, Tag, message } from 'antd';
import { ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import { resolveAssetUrl } from '../../../utils/assetUrl';
import { formatDateTime, orDash } from '../../../utils/format';
import {
  type CashRainDetail,
  type CashRainOrderRow,
  type OrdersResponse,
} from './cashRainShared';

const OrdersTab = ({ detail }: { detail: CashRainDetail }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<CashRainOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(
    async (page = 1, size = 10) => {
      setLoading(true);
      try {
        const res = (await api.post('orders/list', {
          gameType: detail.gameType,
          pageNo: page,
          pageSize: size,
        })) as OrdersResponse;
        setOrders(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo || page);
        setPageSize(res.pageSize || size);
      } catch {
        message.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [detail.gameType],
  );

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<CashRainOrderRow> = [
    {
      title: 'Player',
      key: 'player',
      width: 200,
      render: (_, r) => (
        <Link
          to={`/users/${r.userId}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Avatar
            size="small"
            src={resolveAssetUrl(r.userAvatar)}
            icon={<UserOutlined />}
          />
          <span>{orDash(r.userNickname || r.userId)}</span>
        </Link>
      ),
    },
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 170,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'Prize',
      dataIndex: 'winAmount',
      key: 'winAmount',
      width: 120,
      render: (v) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Wallet',
      dataIndex: 'isBonus',
      key: 'isBonus',
      width: 100,
      render: (v: number) =>
        v === 1 ? <Tag color="gold">Bonus</Tag> : <Tag color="green">Main</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: number) => <StatusBadge kind="order" status={v} />,
    },
    {
      title: 'Claimed At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v?: string) => formatDateTime(v),
    },
    {
      title: 'Settled At',
      dataIndex: 'settledAt',
      key: 'settledAt',
      width: 170,
      render: (v?: string) => formatDateTime(v),
    },
  ];

  return (
    <Card style={{ borderRadius: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 12,
        }}
      >
        <Button icon={<ReloadOutlined />} onClick={() => load(pageNo, pageSize)}>
          Refresh
        </Button>
      </div>
      <Table<CashRainOrderRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={orders}
        className="modern-table"
        scroll={{ x: 1000 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} claims`,
          onChange: (p, s) => load(p, s),
        }}
        locale={{ emptyText: <Empty description="No claims yet" /> }}
      />
    </Card>
  );
};

export default OrdersTab;

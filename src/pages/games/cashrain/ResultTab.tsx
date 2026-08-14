import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Table, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../../services/api';
import MoneyText from '../../../components/MoneyText';
import StatusBadge from '../../../components/StatusBadge';
import { GameResultDisplay } from '../../../components/ResultBall';
import { formatDateTime } from '../../../utils/format';
import { type RoundRow, type CashRainDetail, type RoundsResponse } from './cashRainShared';

const ResultTab = ({ detail }: { detail: CashRainDetail }) => {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(
    async (page = 1, size = 10) => {
      setLoading(true);
      try {
        const res = (await api.post('games/rounds', {
          gameId: detail.id,
          pageNo: page,
          pageSize: size,
        })) as RoundsResponse;
        setRounds(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo || page);
        setPageSize(res.pageSize || size);
      } catch {
        message.error('Failed to load rounds');
      } finally {
        setLoading(false);
      }
    },
    [detail.id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<RoundRow> = [
    {
      title: 'Round No',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 170,
      render: (v: string) => (
        <span
          style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}
        >
          {v}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: number) => <StatusBadge kind="round" status={v} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 200,
      render: (_, r) => (
        <GameResultDisplay
          gameType={detail.gameType}
          result={r.result}
          size={24}
        />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 140,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 140,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
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
        <Button
          icon={<ReloadOutlined />}
          onClick={() => load(pageNo, pageSize)}
        >
          Refresh
        </Button>
      </div>
      <Table<RoundRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rounds}
        className="modern-table"
        scroll={{ x: 960 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} rounds`,
          onChange: (p, s) => load(p, s),
        }}
        locale={{ emptyText: <Empty description="No rounds" /> }}
      />
    </Card>
  );
};

export default ResultTab;

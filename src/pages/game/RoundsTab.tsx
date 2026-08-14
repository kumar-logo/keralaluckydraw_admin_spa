import { useEffect, useState, useCallback } from 'react';
import { Descriptions, Table, Button, message, Modal, Tooltip } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import api from '../../services/api';
import { toPaginated } from '../../services/listResponse';
import { getApiErrorMessage } from '../../utils/apiError';
import MoneyText from '../../components/MoneyText';
import StatusBadge from '../../components/StatusBadge';
import { GameResultDisplay } from '../../components/ResultBall';
import { useDigitPositionConfig } from '../../hooks/useDigitPositionConfig';
import { formatDateTime } from '../../utils/format';
import { type RoundRecord, type RoundsResponse } from './gameShared';

const RoundsTab = ({
  gameId,
  gameType,
}: {
  gameId: number;
  gameType: string;
}) => {
  const { get: getDigitConfig } = useDigitPositionConfig();
  const digitConfig = getDigitConfig(gameId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoundRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailRecord, setDetailRecord] = useState<RoundRecord | null>(null);

  const fetchRounds = useCallback(
    async (page = 1, size = 10) => {
      setLoading(true);
      try {
        const res = toPaginated(
          (await api.post('games/rounds', {
            gameId,
            pageNo: page,
            pageSize: size,
          })) as RoundsResponse,
          page,
          size,
        );
        setData(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo);
        setPageSize(res.pageSize);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to load rounds'));
      } finally {
        setLoading(false);
      }
    },
    [gameId],
  );

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const columns: ColumnsType<RoundRecord> = [
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
      render: (val: number) => <StatusBadge kind="round" status={val} />,
    },
    {
      title: 'Result',
      key: 'result',
      width: 190,
      render: (_, r) => (
        <GameResultDisplay
          gameType={gameType}
          result={r.result}
          size={24}
          positionColors={digitConfig.colors}
          slatLabels={digitConfig.labels}
        />
      ),
    },
    {
      title: 'Total Bet',
      dataIndex: 'totalBet',
      key: 'totalBet',
      width: 130,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Payout',
      dataIndex: 'totalPayout',
      key: 'totalPayout',
      width: 130,
      render: (v) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'P/L',
      key: 'pl',
      width: 130,
      render: (_, r) => {
        const pl = Number(r.totalBet ?? 0) - Number(r.totalPayout ?? 0);
        return <MoneyText value={pl} variant="auto" showSign />;
      },
    },
    {
      title: 'Draw Time',
      dataIndex: 'drawTime',
      key: 'drawTime',
      width: 170,
      render: (v?: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'a',
      width: 44,
      fixed: 'right',
      render: (_, r) => (
        <Tooltip title="Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 12,
        }}
      >
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchRounds(pageNo, pageSize)}
        >
          Refresh
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        className="modern-table"
        scroll={{ x: 960 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} rounds`,
          onChange: (p, s) => fetchRounds(p, s),
        }}
      />
      <Modal
        title="Round Details"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={null}
        width={640}
      >
        {detailRecord && (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 12 }}
          >
            <Descriptions.Item label="Round No" span={2}>
              <span style={{ fontFamily: 'monospace' }}>
                {detailRecord.roundNo}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge kind="round" status={detailRecord.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Draw Time">
              {formatDateTime(detailRecord.drawTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Bet">
              <MoneyText value={detailRecord.totalBet} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Payout">
              <MoneyText value={detailRecord.totalPayout} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Result" span={2}>
              <div style={{ padding: 6 }}>
                <GameResultDisplay
                  gameType={gameType}
                  result={detailRecord.result}
                  size={30}
                  positionColors={digitConfig.colors}
                  slatLabels={digitConfig.labels}
                />
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default RoundsTab;

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Button,
  Space,
  message,
  Empty,
  Segmented,
  Dropdown,
  Tag,
  Alert,
} from 'antd';
import {
  CrownOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';

const LOTTERY_CREATE_ITEMS: { key: string; label: string; route: string }[] = [
  { key: 'kerala', label: 'Kerala Lottery', route: '/lottery/create/kerala' },
  { key: 'three-digit', label: '3-Digit Lottery', route: '/lottery/create/three-digit' },
  { key: 'four-five-digit', label: '4 & 5-Digit Lottery', route: '/lottery/create/four-five-digit' },
  { key: 'dubai', label: 'Dubai Lottery', route: '/lottery/create/dubai' },
];

const LOTTERY_SECTION_DEFS: {
  title: string;
  types: string[];
  route: string;
}[] = [
  {
    title: 'Kerala Lottery',
    types: ['kerala'],
    route: '/lottery/create/kerala',
  },
  {
    title: '3-Digit Lottery',
    types: ['three_digit'],
    route: '/lottery/create/three-digit',
  },
  {
    title: '4 & 5-Digit Lottery',
    types: ['four_five_digit'],
    route: '/lottery/create/four-five-digit',
  },
  { title: 'Dubai Lottery', types: ['dubai'], route: '/lottery/create/dubai' },
];
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LotteryGameCard from '../components/LotteryGameCard';
import ConfirmModal from '../components/ConfirmModal';
import { getApiErrorMessage } from '../utils/apiError';

interface LotteryGame {
  id: number;
  gameName: string;
  gameType: string;
  gameCode: string;
  status: number;
  isPaused: number;
  emergencyStop: number;
  drawInterval: number;
  mode: 'auto' | 'manual';
  pendingManualDraw: boolean;
  pendingDraws?: { id: number; roundNo: string; drawTime: string; status: number }[];
  pendingDrawCount?: number;
  closed?: boolean;
  lotteryType?: string;
  themeColor?: string;
  bgColor?: string;
  groupName?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  maxPrize?: string;
  sellingPrice?: number;
  isHidden?: number;
  totalBet?: number;
  totalPayout?: number;
  currentRound: {
    id: number;
    roundNo: string;
    drawTime: string;
    stopBetTime: string;
    status: number;
  } | null;
  lastDraw: { roundNo: string; result: unknown; drawTime: string } | null;
  todaySales: number;
  todayPayout: number;
  todayProfit: number;
  todayTickets: number;
  iconUrl?: string;
  coverUrl?: string;
}

const LotteryListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lotteries, setLotteries] = useState<LotteryGame[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await api.get('lottery/list')) as LotteryGame[] | unknown;
      setLotteries(Array.isArray(res) ? (res as LotteryGame[]) : []);
    } catch {
      message.error('Failed to load lotteries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const POLL_MS = 60000;
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData();
    }, POLL_MS);
    return () => clearInterval(iv);
  }, []);

  const handleToggleMode = async (id: number, autoGenerate: boolean) => {
    try {
      await api.post(`lottery/${id}/toggle-mode`, { autoGenerate });
      message.success(`Switched to ${autoGenerate ? 'Auto' : 'Manual'}`);
      fetchData();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to toggle mode'));
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`games/${deleteTarget.id}`);
      message.success('Lottery deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete lottery'));
    } finally {
      setDeleting(false);
    }
  };

  const handleControl = async (id: number, action: string) => {
    try {
      await api.post(`games/${id}/${action}`);
      message.success(`${action} successful`);
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, `${action} failed`));
    }
  };

  const handleTriggerDraw = async (roundId: number) => {
    try {
      await api.post('draws/trigger', { roundId });
      message.success('Draw triggered');
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to trigger draw'));
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'auto') return lotteries.filter((l) => l.mode === 'auto');
    if (filter === 'manual')
      return lotteries.filter((l) => l.mode === 'manual');
    if (filter === 'pending')
      return lotteries.filter((l) => l.pendingManualDraw);
    if (filter === 'closed') return lotteries.filter((l) => l.closed);
    return lotteries;
  }, [lotteries, filter]);

  const grouped = useMemo(() => {
    const used = new Set<number>();
    const out = LOTTERY_SECTION_DEFS.map((def) => {
      const items = filtered.filter((l) => def.types.includes(l.gameType));
      items.forEach((l) => used.add(l.id));
      return { ...def, items };
    }).filter((s) => s.items.length > 0);
    const leftovers = filtered.filter((l) => !used.has(l.id));
    if (leftovers.length)
      out.push({
        title: 'Other Lotteries',
        types: [],
        route: '',
        items: leftovers,
      });
    return out;
  }, [filtered]);

  const pendingGames = lotteries.filter((l) => l.pendingManualDraw);
  const pendingCount = pendingGames.length;
  const totalDueDraws = lotteries.reduce(
    (sum, l) => sum + (l.pendingDrawCount ?? (l.pendingManualDraw ? 1 : 0)),
    0,
  );
  const autoCount = lotteries.filter((l) => l.mode === 'auto').length;
  const manualCount = lotteries.filter((l) => l.mode === 'manual').length;
  const closedCount = lotteries.filter((l) => l.closed).length;

  return (
    <div className="page-container">
      <PageHeader
        title="All Lotteries"
        subtitle={`${lotteries.length} lotteries${totalDueDraws ? ` | ${totalDueDraws} draw${totalDueDraws > 1 ? 's' : ''} due` : ''}`}
        icon={<CrownOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
            <Dropdown
              trigger={['click']}
              menu={{
                items: LOTTERY_CREATE_ITEMS.map((l) => ({
                  key: l.key,
                  label: l.label,
                })),
                onClick: ({ key }) => {
                  const target = LOTTERY_CREATE_ITEMS.find((l) => l.key === key);
                  if (target) navigate(target.route);
                },
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Create Lottery <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        }
      />

      {totalDueDraws > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${totalDueDraws} draw${totalDueDraws > 1 ? 's' : ''} due across ${pendingCount} lotter${pendingCount > 1 ? 'ies' : 'y'}`}
          description={pendingGames
            .map(
              (l) =>
                `${l.gameName} (${l.pendingDrawCount ? l.pendingDrawCount : 1} due)`,
            )
            .join(' · ')}
          action={
            <Button size="small" onClick={() => setFilter('pending')}>
              Review
            </Button>
          }
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={filter}
          onChange={(val) => setFilter(val as string)}
          options={[
            { label: `All (${lotteries.length})`, value: 'all' },
            { label: `Auto (${autoCount})`, value: 'auto' },
            { label: `Manual (${manualCount})`, value: 'manual' },
            ...(pendingCount > 0
              ? [{ label: `Pending Draw (${pendingCount})`, value: 'pending' }]
              : []),
            { label: `Closed (${closedCount})`, value: 'closed' },
          ]}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {grouped.map((sec) => {
          const isOpen = !collapsed[sec.title];
          return (
            <div
              key={sec.title}
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--bg-card)',
              }}
            >
              <div
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [sec.title]: isOpen }))
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: 'var(--bg-card-alt)',
                }}
              >
                <RightOutlined
                  rotate={isOpen ? 90 : 0}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    transition: 'transform .2s',
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--text-primary)',
                  }}
                >
                  {sec.title}
                </span>
                <Tag style={{ borderRadius: 999, margin: 0 }}>
                  {sec.items.length}
                </Tag>
                {sec.route && (
                  <Button
                    size="small"
                    type="link"
                    icon={<PlusOutlined />}
                    style={{ marginLeft: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(sec.route);
                    }}
                  >
                    Create
                  </Button>
                )}
              </div>
              {isOpen && (
                <Row gutter={[16, 16]} style={{ padding: 16 }}>
                  {sec.items.map((g) => (
                    <Col key={g.id} xs={24} sm={12} xl={8} xxl={6}>
                      <LotteryGameCard
                        game={g}
                        onDetail={() =>
                          navigate(
                            g.gameType === 'kerala'
                              ? `/lottery/kerala/${g.id}`
                              : `/lottery/digit/${g.id}`,
                          )
                        }
                        onDelete={() => handleDelete(g.id, g.gameName)}
                        onToggleMode={(auto) => handleToggleMode(g.id, auto)}
                        onControl={(action) => handleControl(g.id, action)}
                        onTriggerDraw={(roundId) => handleTriggerDraw(roundId)}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          );
        })}
      </div>
      {!loading && lotteries.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                No Lotteries Created
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Create your first lottery to get started.
              </div>
            </div>
          }
          style={{ padding: 48 }}
        >
          <Dropdown
            trigger={['click']}
            menu={{
              items: LOTTERY_CREATE_ITEMS.map((l) => ({
                key: l.key,
                label: l.label,
              })),
              onClick: ({ key }) => {
                const target = LOTTERY_CREATE_ITEMS.find((l) => l.key === key);
                if (target) navigate(target.route);
              },
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              Create Lottery <DownOutlined />
            </Button>
          </Dropdown>
        </Empty>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Lottery?"
        okText="Delete"
        loading={deleting}
        description={
          <>
            Permanently delete <b>{deleteTarget?.name}</b>? This removes the
            lottery and all its configuration, rounds and orders. This action
            cannot be undone.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default LotteryListPage;

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Row,
  Col,
  Input,
  Select,
  Pagination,
  Spin,
  Empty,
  Tag,
  Button,
  Space,
  Tooltip,
  Dropdown,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  GlobalOutlined,
  HomeOutlined,
  DownOutlined,
  RightOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { typeName } from '../utils/gameTypes';
import { UserGameCard } from '../components/UserGameCard';
import MoneyText from '../components/MoneyText';
import { getApiErrorMessage } from '../utils/apiError';
import { LobbyGroupIcon } from './gamesPage/LobbyGroupIcon';
import { CardShell } from './gamesPage/CardShell';
import {
  gameDetailPath,
  FamilyAction,
  DEFAULT_SPRITE_WIDTH,
  DEFAULT_SPRITE_HEIGHT,
  GAME_CREATE_ITEMS,
  sectionCreateRoute,
  SECTION_DEFS,
  SECTION_FILTER_TYPE,
  cardImg,
  cardTheme,
  type GameRecord,
  type GamesListResponse,
  type LobbySpriteResponse,
  type LobbySprite,
} from './gamesPage/gamesPageShared';

const GamesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category =
    searchParams.get('category') === 'third_party' ? 'third_party' : 'our';
  const isThird = category === 'third_party';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GameRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(isThird ? 24 : 200);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [sprite, setSprite] = useState<LobbySprite | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [familyBusy, setFamilyBusy] = useState<string | null>(null);

  useEffect(() => {
    if (isThird) return;
    (async () => {
      try {
        const res = await api.get<unknown, LobbySpriteResponse>('lobby-config');
        const pos: Record<string, { x: number; y: number }> = {};
        const providers = Array.isArray(res.providers) ? res.providers : [];
        providers.forEach((p) => {
          if (p.filterType && pos[p.filterType] === undefined)
            pos[p.filterType] = { x: p.bigIconX, y: p.bigIconY };
        });
        setSprite({
          url: res.config?.filterIcon ? res.config.filterIcon : '',
          width: res.config?.filterWidth ?? DEFAULT_SPRITE_WIDTH,
          height: res.config?.filterHeight ?? DEFAULT_SPRITE_HEIGHT,
          pos,
        });
      } catch {
        setSprite(null);
      }
    })();
  }, [isThird]);

  const fetchGames = useCallback(
    async (page = 1, size = isThird ? 24 : 200, q = '', st?: number) => {
      setLoading(true);
      try {
        const res = await api.post<unknown, GamesListResponse>('games/list', {
          pageNo: page,
          pageSize: size,
          search: q ? q : undefined,
          status: st,
          category,
        });
        setData(res.list);
        setTotal(res.total);
        setPageNo(res.pageNo);
        setPageSize(res.pageSize);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to load games'));
      } finally {
        setLoading(false);
      }
    },
    [category, isThird],
  );

  useEffect(() => {
    const size = isThird ? 24 : 200;
    setPageNo(1);
    setPageSize(size);
    fetchGames(1, size, search, status);
  }, [category]);

  const toggleHidden = useCallback(
    async (game: { id: number; isHidden?: number; gameName: string }) => {
      const willHide = game.isHidden !== 1;
      try {
        await api.post(`games/${game.id}/${willHide ? 'hide' : 'show'}`);
        message.success(
          `${game.gameName} ${willHide ? 'hidden from' : 'shown to'} players`,
        );
        await fetchGames(pageNo, pageSize, search, status);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to update visibility'));
      }
    },
    [fetchGames, pageNo, pageSize, search, status],
  );

  const toggleStop = useCallback(
    async (game: { id: number; emergencyStop?: number; gameName: string }) => {
      const willStop = game.emergencyStop !== 1;
      if (willStop) {
        const ok = window.confirm(
          `Stop "${game.gameName}"? Open rounds will be cancelled and bets refunded.`,
        );
        if (!ok) return;
      }
      try {
        await api.post(
          `games/${game.id}/${willStop ? 'emergency-stop' : 'emergency-resume'}`,
        );
        message.success(
          `${game.gameName} ${willStop ? 'stopped' : 'resumed'}`,
        );
        await fetchGames(pageNo, pageSize, search, status);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to update game state'));
      }
    },
    [fetchGames, pageNo, pageSize, search, status],
  );

  const familyControl = useCallback(
    async (
      section: { title: string; games: GameRecord[] },
      action: FamilyAction,
    ) => {
      setFamilyBusy(section.title);
      try {
        await Promise.all(
          section.games.map((g) => api.post(`games/${g.id}/${action}`)),
        );
        const verb = action === FamilyAction.Stop ? 'stopped' : 'resumed';
        message.success(`${section.title} ${verb}`);
        await fetchGames(pageNo, pageSize, search, status);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to update games'));
      } finally {
        setFamilyBusy(null);
      }
    },
    [fetchGames, pageNo, pageSize, search, status],
  );

  const sections = useMemo(() => {
    const used = new Set<number>();
    const out = SECTION_DEFS.map((def) => {
      const games = data.filter((g) => def.types.includes(g.gameType));
      games.forEach((g) => used.add(g.id));
      return { ...def, games };
    }).filter((s) => s.games.length > 0);
    const leftovers = data.filter((g) => !used.has(g.id));
    if (leftovers.length)
      out.push({
        title: 'Other Games',
        icon: '',
        types: [],
        games: leftovers,
      });
    return out;
  }, [data]);

  const hasLaunchUid = (g: { gameUid?: string | null }) =>
    !!(g.gameUid && g.gameUid.trim());

  const launchCoverage = useMemo(() => {
    const withUid = data.filter(hasLaunchUid).length;
    return { withUid, totalLoaded: data.length };
  }, [data]);

  return (
    <div className="page-container">
      <PageHeader
        title={isThird ? 'Third-Party Games' : 'Our Games'}
        subtitle={
          isThird
            ? `${total} third-party (iframe) games • ${launchCoverage.withUid} of ${launchCoverage.totalLoaded} loaded have launch UID`
            : `${sections.length} sections • ${data.length} games — exactly as players see them`
        }
        icon={isThird ? <GlobalOutlined /> : <HomeOutlined />}
        iconBg={
          isThird
            ? 'var(--gradient-purple, var(--gradient-orange))'
            : 'var(--gradient-orange)'
        }
        extra={
          <Space wrap>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchGames(pageNo, pageSize, search, status)}
              />
            </Tooltip>
            {!isThird && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: GAME_CREATE_ITEMS.map((g) => ({
                    key: g.key,
                    label: g.label,
                  })),
                  onClick: ({ key }) => {
                    const target = GAME_CREATE_ITEMS.find((g) => g.key === key);
                    if (target) navigate(target.route);
                  },
                }}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  Create Game <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Space>
        }
      />

      <div className="filter-bar">
        <Row gutter={[12, 12]} align="middle">
          <Col flex="280px">
            <Input.Search
              placeholder="Search by name or code…"
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(v) => {
                setSearch(v);
                setPageNo(1);
                fetchGames(1, pageSize, v, status);
              }}
              onChange={(e) => {
                if (!e.target.value && search) {
                  setSearch('');
                  fetchGames(1, pageSize, '', status);
                }
              }}
            />
          </Col>
          <Col flex="160px">
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPageNo(1);
                fetchGames(1, pageSize, search, v);
              }}
              options={[
                { value: 1, label: 'Active' },
                { value: 0, label: 'Disabled' },
              ]}
            />
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {data.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`No ${isThird ? 'third-party' : 'our'} games`}
            style={{ padding: 48 }}
          />
        ) : isThird ? (
          <Row gutter={[16, 16]}>
            {data.map((g) => (
              <Col key={g.id} xs={12} sm={8} md={6} lg={4} xl={4}>
                <CardShell
                  img={cardImg(g)}
                  theme={cardTheme(g, g.id)}
                  onClick={() => navigate(gameDetailPath(g))}
                  title={g.gameName}
                  name={g.gameName}
                  cornerTag={
                    hasLaunchUid(g) ? undefined : (
                      <Tag color="error" style={{ margin: 0, fontSize: 10 }}>
                        No launch UID
                      </Tag>
                    )
                  }
                  sub={
                    <>
                      {typeName(g.gameType)}
                      {g.sellingPrice ? (
                        <span style={{ color: '#FFD84E', fontWeight: 700 }}>
                          <MoneyText value={g.sellingPrice} variant="neutral" />
                        </span>
                      ) : null}
                    </>
                  }
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((sec) => {
              const filterType = SECTION_FILTER_TYPE[sec.types[0]];
              const isOpen = expanded[sec.title];
              const allStopped = sec.games.every((g) => g.emergencyStop === 1);
              const sectionBusy = familyBusy === sec.title;
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
                      setExpanded((e) => ({ ...e, [sec.title]: !isOpen }))
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
                    <LobbyGroupIcon
                      filterType={filterType}
                      sprite={sprite}
                      imgUrl={
                        sec.games[0]?.lobbyIconUrl || sec.games[0]?.iconUrl
                      }
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
                      {sec.games.length}
                    </Tag>
                    <Space
                      size={4}
                      wrap
                      style={{ marginLeft: 'auto' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {allStopped ? (
                        <Button
                          size="small"
                          loading={sectionBusy}
                          icon={<PlayCircleOutlined />}
                          onClick={() =>
                            familyControl(sec, FamilyAction.Resume)
                          }
                        >
                          Resume
                        </Button>
                      ) : (
                        <Popconfirm
                          title="Stop all games in this family?"
                          description="Open rounds will be cancelled and bets refunded."
                          okText="Stop"
                          okButtonProps={{ danger: true }}
                          cancelText="Cancel"
                          onConfirm={() =>
                            familyControl(sec, FamilyAction.Stop)
                          }
                        >
                          <Button
                            size="small"
                            danger
                            loading={sectionBusy}
                            icon={<StopOutlined />}
                          >
                            Stop
                          </Button>
                        </Popconfirm>
                      )}
                      {sectionCreateRoute(sec.types) && (
                        <Button
                          size="small"
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const route = sectionCreateRoute(sec.types);
                            if (route) navigate(route);
                          }}
                        >
                          Create
                        </Button>
                      )}
                    </Space>
                  </div>
                  {isOpen && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(216px, 1fr))',
                        gap: 14,
                        padding: 16,
                      }}
                    >
                      {sec.games.map((g, i) => (
                        <UserGameCard
                          key={g.id}
                          game={g}
                          index={i}
                          onClick={() => navigate(gameDetailPath(g))}
                          onToggleHidden={toggleHidden}
                          onToggleStop={toggleStop}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Spin>

      {isThird && total > pageSize && (
        <div
          style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}
        >
          <Pagination
            current={pageNo}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={['24', '48', '96']}
            showTotal={(t) => `${t} games`}
            onChange={(p, s) => {
              setPageNo(p);
              setPageSize(s);
              fetchGames(p, s, search, status);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GamesPage;

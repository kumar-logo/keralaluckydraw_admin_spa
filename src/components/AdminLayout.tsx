import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../config/env';
import type { MenuProps } from 'antd';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Tooltip,
  Space,
  Tag,
  Grid,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  ExpandOutlined,
  SunOutlined,
  MoonOutlined,
  IdcardOutlined,
  WalletOutlined,
  BankOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

const SALESSMARTLY_AGENT_URL = 'https://app.salesmartly.com/login';
const THIRD_PARTY_GAME_URL = 'https://login.24gameapi.org/production/';
import { useAdminStore } from '../store';
import { useConfigStore } from '../store/configStore';
import { useTheme } from '../hooks/useTheme';
import ErrorBoundary from './ErrorBoundary';
import AdminChatWidget from './AdminChatWidget';
import {
  parentMap,
  visibleMenuItems as buildVisibleMenuItems,
  categoryFromSearch,
} from './adminLayout/menuConfig';
import { resolveAssetUrl } from '../utils/assetUrl';
import { adminHasPermission, Permission } from '../constants/permissions';

const { Header, Sider, Content } = Layout;

const DEFAULT_BRAND_NAME = 'Kerala Lucky Draw';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [pendingCount, setPendingCount] = useState(0);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const prevRechargeRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminStore();
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  useEffect(() => {
    fetchConfig();
  }, []);
  const appName = useConfigStore((s) => s.appName);
  const brandName = appName ? appName : DEFAULT_BRAND_NAME;
  useEffect(() => {
    document.title = `${brandName} Admin`;
  }, [brandName]);
  const { theme, toggleTheme } = useTheme();

  const activeParent =
    parentMap[location.pathname] ||
    (location.pathname.startsWith('/games/') ? 'games' : undefined) ||
    (location.pathname.startsWith('/lottery/')
      ? parentMap['/lottery/list']
      : undefined);
  const [openKeys, setOpenKeys] = useState<string[]>(
    activeParent ? [activeParent] : [],
  );

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    } else if (activeParent && !openKeys.includes(activeParent)) {
      setOpenKeys((prev) => [...prev, activeParent]);
    }
  }, [location.pathname, collapsed]);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  useEffect(() => {
    if (!admin) navigate('/login', { replace: true });
  }, [admin]);

  useEffect(() => {
    const playRechargeAlert = () => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const beep = (start: number, freq: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(
            0.25,
            ctx.currentTime + start + 0.02,
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + start + 0.18,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.2);
        };
        beep(0, 880);
        beep(0.22, 1175);
        setTimeout(() => ctx.close().catch(() => {}), 600);
      } catch {}
    };

    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        const res = await fetch(`${getApiBaseUrl()}/admin/api/v1/badge-counts`, {
          headers: { 'Content-Type': 'application/json', Token: token },
        });
        const data: { code: number; data?: Record<string, number> } =
          await res.json();
        if (data.code === 0 && data.data) {
          const counts = data.data;
          setBadges(counts);
          const pendingRecharge = counts.pendingRecharge;
          const pendingWithdraw = counts.pendingWithdraw;
          setPendingCount(pendingRecharge + pendingWithdraw);
          const nextRecharge = pendingRecharge;
          if (
            prevRechargeRef.current !== null &&
            nextRecharge > prevRechargeRef.current
          ) {
            playRechargeAlert();
          }
          prevRechargeRef.current = nextRecharge;
        }
      } catch {}
    };
    fetchBadges();
    const iv = setInterval(fetchBadges, 15000);
    window.addEventListener('admin:refresh-badges', fetchBadges);
    return () => {
      clearInterval(iv);
      window.removeEventListener('admin:refresh-badges', fetchBadges);
    };
  }, []);

  if (!admin) return null;

  const visibleMenuItems = buildVisibleMenuItems(admin);

  const canSeeReports = adminHasPermission(admin, Permission.Reports);

  const roleColor =
    admin.role === 'superadmin' || admin.role === 'super_admin'
      ? 'orange'
      : admin.role === 'admin'
        ? 'green'
        : 'default';

  return (
    <Layout
      style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}
    >
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-sider"
        width={260}
        collapsedWidth={isMobile ? 0 : 72}
        style={
          isMobile
            ? { position: 'fixed', height: '100vh', top: 0, left: 0, zIndex: 1001 }
            : undefined
        }
      >
        <div
          className="sidebar-logo"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {collapsed ? (
            <img
              className="sidebar-logo-icon"
              src="/images/logos/logo.png"
              alt={brandName}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <img
              className="sidebar-logo-icon"
              src="/images/logos/logo.png"
              alt={brandName}
            />
              <div>
                <span className="sidebar-logo-text">{brandName}</span>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginTop: -2,
                    fontWeight: 500,
                  }}
                >
                  Admin Panel
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sidebar-menu-wrap">
          <Menu
            mode="inline"
            selectedKeys={[
              location.pathname === '/games'
                ? `/games?category=${categoryFromSearch(location.search)}`
                : location.pathname,
            ]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={(keys) => setOpenKeys(keys)}
            items={visibleMenuItems.map((item) => {
              if (
                item.key === 'finance' &&
                (badges.pendingRecharge || badges.pendingWithdraw)
              ) {
                const total =
                  badges.pendingRecharge + badges.pendingWithdraw;
                return {
                  ...item,
                  label: (
                    <Badge count={total} size="small" offset={[8, 0]}>
                      {item.label}
                    </Badge>
                  ),
                  children: item.children?.map((c) => {
                    if (c.key === '/finance/recharge' && badges.pendingRecharge)
                      return {
                        ...c,
                        label: (
                          <Badge
                            count={badges.pendingRecharge}
                            size="small"
                            offset={[8, 0]}
                          >
                            {c.label}
                          </Badge>
                        ),
                      };
                    if (c.key === '/finance/withdraw' && badges.pendingWithdraw)
                      return {
                        ...c,
                        label: (
                          <Badge
                            count={badges.pendingWithdraw}
                            size="small"
                            offset={[8, 0]}
                          >
                            {c.label}
                          </Badge>
                        ),
                      };
                    return c;
                  }),
                };
              }
              if (item.key === 'lottery' && badges.pendingLotteryDraws) {
                return {
                  ...item,
                  label: (
                    <Badge
                      count={badges.pendingLotteryDraws}
                      size="small"
                      offset={[8, 0]}
                      color="orange"
                    >
                      {item.label}
                    </Badge>
                  ),
                  children: item.children?.map((c) => {
                    if (
                      c.key === '/lottery/draws' &&
                      badges.pendingLotteryDraws
                    )
                      return {
                        ...c,
                        label: (
                          <Badge
                            count={badges.pendingLotteryDraws}
                            size="small"
                            offset={[8, 0]}
                            color="orange"
                          >
                            {c.label}
                          </Badge>
                        ),
                      };
                    return c;
                  }),
                };
              }
              if (item.key === '/orders' && badges.unsettledOrders)
                return {
                  ...item,
                  label: (
                    <Badge
                      count={badges.unsettledOrders}
                      size="small"
                      offset={[8, 0]}
                      color="blue"
                    >
                      {item.label}
                    </Badge>
                  ),
                };
              if (
                item.key === '/messages' ||
                (item.children &&
                  item.children.some((c) => c.key === '/messages'))
              ) {
                if (item.children) {
                  return {
                    ...item,
                    children: item.children.map((c) => {
                      if (c.key === '/messages' && badges.unreadMessages)
                        return {
                          ...c,
                          label: (
                            <Badge
                              count={badges.unreadMessages}
                              size="small"
                              offset={[8, 0]}
                              color="red"
                            >
                              {c.label}
                            </Badge>
                          ),
                        };
                      return c;
                    }),
                  };
                }
              }
              return item;
            }) as MenuProps['items']}
            onClick={({ key }) => {
              navigate(key);
              if (isMobile) setCollapsed(true);
            }}
          />
        </div>
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user-card">
              <div style={{ position: 'relative' }}>
                <Avatar
                  size={36}
                  src={admin.avatar ? resolveAssetUrl(admin.avatar) : undefined}
                  style={{
                    background: 'var(--primary-gradient)',
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {(admin.displayName || admin.username)
                    .charAt(0)
                    .toUpperCase()}
                </Avatar>
                <div className="sidebar-online-dot" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {admin.displayName || admin.username}
                </div>
                <Tag
                  color={roleColor}
                  style={{
                    fontSize: 10,
                    padding: '0 6px',
                    lineHeight: '18px',
                    borderRadius: 4,
                    marginTop: 2,
                  }}
                >
                  {admin.role}
                </Tag>
              </div>
            </div>
          )}
          {collapsed && (
            <Tooltip
              title={admin.displayName || admin.username}
              placement="right"
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar
                    size={36}
                    src={
                      admin.avatar ? resolveAssetUrl(admin.avatar) : undefined
                    }
                    style={{
                      background: 'var(--primary-gradient)',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {(admin.displayName || admin.username)
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>
                  <div className="sidebar-online-dot" />
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </Sider>
      {isMobile && !collapsed && (
        <div
          className="admin-sider-backdrop"
          onClick={() => setCollapsed(true)}
        />
      )}
      <Layout
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 38, height: 38, borderRadius: 10 }}
            />
            <div className="header-breadcrumb">
              {location.pathname
                .split('/')
                .filter(Boolean)
                .map((seg, i, arr) => (
                  <span key={i}>
                    {i > 0 && (
                      <span
                        style={{ margin: '0 6px', color: 'var(--text-light)' }}
                      >
                        /
                      </span>
                    )}
                    <span
                      style={{
                        color:
                          i === arr.length - 1
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                        fontWeight: i === arr.length - 1 ? 600 : 400,
                        fontSize: 13,
                        textTransform: 'capitalize',
                      }}
                    >
                      {seg.replace(/-/g, ' ')}
                    </span>
                  </span>
                ))}
            </div>
          </div>
          <Space size={4}>
            {canSeeReports && (
              <Tooltip title="Manual Lottery Reports">
                <Button
                  type="text"
                  icon={<FilePdfOutlined />}
                  onClick={() => navigate('/reports/manual-lottery')}
                  style={{ width: 38, height: 38, borderRadius: 10 }}
                />
              </Tooltip>
            )}
            {badges.pendingRecharge > 0 && (
              <Tooltip
                title={`${badges.pendingRecharge} pending recharge requests`}
              >
                <Badge
                  count={badges.pendingRecharge}
                  size="small"
                  offset={[-2, 2]}
                >
                  <Button
                    type="text"
                    icon={<WalletOutlined />}
                    onClick={() => navigate('/finance/recharge')}
                    style={{ width: 38, height: 38, borderRadius: 10 }}
                  />
                </Badge>
              </Tooltip>
            )}
            {badges.pendingWithdraw > 0 && (
              <Tooltip
                title={`${badges.pendingWithdraw} pending withdraw requests`}
              >
                <Badge
                  count={badges.pendingWithdraw}
                  size="small"
                  offset={[-2, 2]}
                  color="orange"
                >
                  <Button
                    type="text"
                    icon={<BankOutlined />}
                    onClick={() => navigate('/finance/withdraw')}
                    style={{ width: 38, height: 38, borderRadius: 10 }}
                  />
                </Badge>
              </Tooltip>
            )}
            <Tooltip title="Live Chat (SalesSmartly)">
              <Button
                type="text"
                icon={<CustomerServiceOutlined />}
                onClick={() =>
                  window.open(
                    SALESSMARTLY_AGENT_URL,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
                style={{ width: 38, height: 38, borderRadius: 10 }}
              />
            </Tooltip>
            <Tooltip title="Third-Party Games Console">
              <Button
                type="text"
                icon={<AppstoreOutlined />}
                onClick={() =>
                  window.open(
                    THIRD_PARTY_GAME_URL,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
                style={{ width: 38, height: 38, borderRadius: 10 }}
              />
            </Tooltip>
            <Tooltip title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
              <Button
                type="text"
                icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={toggleTheme}
                className="theme-toggle-btn"
                style={{ width: 38, height: 38, borderRadius: 10 }}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  ...(pendingCount > 0
                    ? [
                        {
                          key: 'pending-recharge',
                          label: (
                            <div className="notification-item">
                              <div
                                className="notification-item-icon"
                                style={{ background: 'var(--gradient-orange)' }}
                              >
                                <WalletOutlined />
                              </div>
                              <div className="notification-item-content">
                                <div className="notification-item-title">
                                  {pendingCount} Pending Recharge
                                  {pendingCount > 1 ? 's' : ''}
                                </div>
                                <div className="notification-item-desc">
                                  Recharge requests awaiting approval
                                </div>
                              </div>
                            </div>
                          ),
                          onClick: () => navigate('/finance/recharge'),
                        },
                      ]
                    : []),
                  {
                    key: 'view-all',
                    label: (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--primary)',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        View All Notifications
                      </div>
                    ),
                    onClick: () => navigate('/messages'),
                  },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge dot={pendingCount > 0} offset={[-4, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ width: 38, height: 38, borderRadius: 10 }}
                />
              </Badge>
            </Dropdown>
            <Tooltip title="Fullscreen">
              <Button
                type="text"
                icon={<ExpandOutlined />}
                onClick={() => {
                  if (!document.fullscreenElement)
                    document.documentElement.requestFullscreen();
                  else document.exitFullscreen();
                }}
                style={{ width: 38, height: 38, borderRadius: 10 }}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <IdcardOutlined />,
                    label: 'My Profile',
                    onClick: () => navigate('/system/profile'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Logout',
                    danger: true,
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                  },
                ],
              }}
              placement="bottomRight"
            >
              <div className="header-user">
                <Avatar
                  size={34}
                  src={admin.avatar ? resolveAssetUrl(admin.avatar) : undefined}
                  style={{
                    background: 'var(--primary-gradient)',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {(admin.displayName || admin.username)
                    .charAt(0)
                    .toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <span className="header-user-name">
                    {admin.displayName || admin.username}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {admin.role}
                  </div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content className="admin-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
      <AdminChatWidget />
    </Layout>
  );
};

export default AdminLayout;

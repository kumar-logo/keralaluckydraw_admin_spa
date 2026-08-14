import type { ReactNode } from 'react';
import type { AdminInfo } from '../../store';
import { adminHasPermission } from '../../constants/permissions';
import {
  DashboardOutlined,
  UserOutlined,
  TrophyOutlined,
  OrderedListOutlined,
  PictureOutlined,
  NotificationOutlined,
  DollarOutlined,
  SettingOutlined,
  BankOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  TeamOutlined,
  AuditOutlined,
  MessageOutlined,
  CrownOutlined,
  PercentageOutlined,
  FieldTimeOutlined,
  AimOutlined,
  LineChartOutlined,
  PieChartOutlined,
  MoneyCollectOutlined,
  BellOutlined,
  MobileOutlined,
  GiftOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  WalletOutlined,
  FileProtectOutlined,
  FundProjectionScreenOutlined,
  KeyOutlined,
  SmileOutlined,
  RocketOutlined,
  GlobalOutlined,
  HomeOutlined,
  BgColorsOutlined,
  ShareAltOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

import { Permission } from '../../constants/permissions';

export const DEFAULT_GAME_CATEGORY = 'our';

export const categoryFromSearch = (search: string): string => {
  const category = new URLSearchParams(search).get('category');
  return category ? category : DEFAULT_GAME_CATEGORY;
};

export interface MenuEntry {
  key: string;
  icon: ReactNode;
  label: string;
  permission?: Permission;
  children?: MenuEntry[];
}

export const menuItems: MenuEntry[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    permission: Permission.Dashboard,
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: 'User Management',
    permission: Permission.Users,
  },
  {
    key: 'lottery',
    icon: <CrownOutlined />,
    label: 'Lottery',
    permission: Permission.Lottery,
    children: [
      {
        key: '/lottery/list',
        icon: <CrownOutlined />,
        label: 'All Lotteries',
        permission: Permission.Lottery,
      },
      {
        key: '/lottery/draws',
        icon: <AimOutlined />,
        label: 'Draw Management',
        permission: Permission.Lottery,
      },
      {
        key: '/lottery/results',
        icon: <FileProtectOutlined />,
        label: 'Results & Prizes',
        permission: Permission.Lottery,
      },
      {
        key: '/lottery/orders',
        icon: <OrderedListOutlined />,
        label: 'Lottery Tickets',
        permission: Permission.Lottery,
      },
      {
        key: '/lottery/report',
        icon: <FundProjectionScreenOutlined />,
        label: 'Lottery Report',
        permission: Permission.Lottery,
      },
    ],
  },
  {
    key: 'games',
    icon: <TrophyOutlined />,
    label: 'Games',
    permission: Permission.Games,
    children: [
      {
        key: '/games?category=our',
        icon: <HomeOutlined />,
        label: 'Our Games',
        permission: Permission.Games,
      },
      {
        key: '/games?category=third_party',
        icon: <GlobalOutlined />,
        label: 'Third-Party Games',
        permission: Permission.Games,
      },
    ],
  },
  {
    key: '/orders',
    icon: <OrderedListOutlined />,
    label: 'Orders',
    permission: Permission.Orders,
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: 'Finance',
    permission: Permission.Finance,
    children: [
      {
        key: '/finance/recharge',
        icon: <BankOutlined />,
        label: 'Recharge',
        permission: Permission.Finance,
      },
      {
        key: '/finance/withdraw',
        icon: <ThunderboltOutlined />,
        label: 'Withdraw',
        permission: Permission.Finance,
      },
      {
        key: '/finance/vip',
        icon: <CrownOutlined />,
        label: 'VIP Config',
        permission: Permission.Finance,
      },
      {
        key: '/finance/commission',
        icon: <PercentageOutlined />,
        label: 'Commission',
        permission: Permission.Finance,
      },
      {
        key: '/finance/recharge-awards',
        icon: <GiftOutlined />,
        label: 'Recharge Awards',
        permission: Permission.Finance,
      },
      {
        key: '/finance/gateways',
        icon: <BankOutlined />,
        label: 'Payment Gateways',
        permission: Permission.Finance,
      },
      {
        key: '/finance/settings',
        icon: <WalletOutlined />,
        label: 'Finance Settings',
        permission: Permission.Finance,
      },
    ],
  },
  {
    key: 'earn',
    icon: <RocketOutlined />,
    label: 'Earn Money',
    permission: Permission.Earn,
    children: [
      {
        key: '/earn/rank-config',
        icon: <TrophyOutlined />,
        label: 'Rank Config',
        permission: Permission.Earn,
      },
      {
        key: '/earn/cdkeys',
        icon: <KeyOutlined />,
        label: 'CD Keys',
        permission: Permission.Earn,
      },
    ],
  },
  {
    key: 'content',
    icon: <PictureOutlined />,
    label: 'Content',
    permission: Permission.Content,
    children: [
      {
        key: '/banners',
        icon: <PictureOutlined />,
        label: 'Banners',
        permission: Permission.Content,
      },
      {
        key: '/popups',
        icon: <AppstoreOutlined />,
        label: 'Popups',
        permission: Permission.Content,
      },
      {
        key: '/announcements',
        icon: <NotificationOutlined />,
        label: 'Announcements',
        permission: Permission.Content,
      },
      {
        key: '/messages',
        icon: <MessageOutlined />,
        label: 'Messages',
        permission: Permission.Content,
      },
      {
        key: '/activities',
        icon: <GiftOutlined />,
        label: 'Activities',
        permission: Permission.Content,
      },
      {
        key: '/checkin',
        icon: <CalendarOutlined />,
        label: 'Check-in Config',
        permission: Permission.Content,
      },
      {
        key: '/share-posters',
        icon: <PictureOutlined />,
        label: 'Share Posters',
        permission: Permission.Content,
      },
    ],
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
    permission: Permission.Reports,
    children: [
      {
        key: '/reports/overall',
        icon: <BarChartOutlined />,
        label: 'Overall Report',
        permission: Permission.Reports,
      },
      {
        key: '/reports/manual-lottery',
        icon: <FilePdfOutlined />,
        label: 'Manual Lottery Reports',
        permission: Permission.Reports,
      },
      {
        key: '/reports/revenue',
        icon: <LineChartOutlined />,
        label: 'Revenue',
        permission: Permission.Reports,
      },
      {
        key: '/reports/users',
        icon: <TeamOutlined />,
        label: 'User Report',
        permission: Permission.Reports,
      },
      {
        key: '/reports/games',
        icon: <PieChartOutlined />,
        label: 'Game Report',
        permission: Permission.Reports,
      },
      {
        key: '/reports/payments',
        icon: <DollarOutlined />,
        label: 'Payment Report',
        permission: Permission.Reports,
      },
      {
        key: '/reports/wages',
        icon: <MoneyCollectOutlined />,
        label: 'Wage Records',
        permission: Permission.Reports,
      },
      {
        key: '/reports/commissions',
        icon: <PercentageOutlined />,
        label: 'Agent Commissions',
        permission: Permission.Reports,
      },
      {
        key: '/reports/rebates',
        icon: <FieldTimeOutlined />,
        label: 'Rebate Records',
        permission: Permission.Reports,
      },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: 'System',
    permission: Permission.System,
    children: [
      {
        key: '/system/admins',
        icon: <TeamOutlined />,
        label: 'Admin Users',
        permission: Permission.System,
      },
      {
        key: '/system/roles',
        icon: <SafetyCertificateOutlined />,
        label: 'Roles & Permissions',
        permission: Permission.System,
      },
      { key: '/system/profile', icon: <IdcardOutlined />, label: 'Profile' },
      {
        key: '/system/general',
        icon: <GlobalOutlined />,
        label: 'General Settings',
        permission: Permission.System,
      },
      {
        key: '/system/notification-templates',
        icon: <BellOutlined />,
        label: 'Notification Templates',
        permission: Permission.System,
      },
      {
        key: '/system/third-party',
        icon: <GlobalOutlined />,
        label: 'Third-Party Integration',
        permission: Permission.System,
      },
      {
        key: '/system/firebase',
        icon: <BellOutlined />,
        label: 'Firebase (Push)',
        permission: Permission.System,
      },
      {
        key: '/system/app-version',
        icon: <MobileOutlined />,
        label: 'App Version',
        permission: Permission.System,
      },
      {
        key: '/finance/third-party-transactions',
        icon: <FundProjectionScreenOutlined />,
        label: 'Third-Party Transactions',
        permission: Permission.Finance,
      },
      {
        key: '/system/lobby',
        icon: <AppstoreOutlined />,
        label: 'Lobby Settings',
        permission: Permission.System,
      },
      {
        key: '/system/ui',
        icon: <BgColorsOutlined />,
        label: 'UI & Display',
        permission: Permission.System,
      },
      {
        key: '/system/share-odds',
        icon: <ShareAltOutlined />,
        label: 'Share & Odds',
        permission: Permission.System,
      },
      {
        key: '/system/avatars',
        icon: <SmileOutlined />,
        label: 'Avatars',
        permission: Permission.System,
      },
      {
        key: '/system/audit',
        icon: <AuditOutlined />,
        label: 'Audit Log',
        permission: Permission.System,
      },
      {
        key: '/system/schedulers',
        icon: <FieldTimeOutlined />,
        label: 'Schedulers',
        permission: Permission.System,
      },
    ],
  },
];

export const parentMap: Record<string, string> = {};
menuItems.forEach((item) => {
  if (item.children) {
    item.children.forEach((child) => {
      parentMap[child.key] = item.key;
    });
  }
});
[
  '/games',
  '/games/rounds',
  '/games/odds',
  '/games/schedule',
  '/games/fees',
].forEach((p) => {
  parentMap[p] = 'games';
});

export const canSeeEntry = (
  admin: AdminInfo | null,
  entry: MenuEntry,
): boolean => {
  if (entry.children && entry.children.length > 0) {
    return entry.children.some(
      (child) =>
        child.permission !== undefined && canSeeEntry(admin, child),
    );
  }
  if (entry.permission === undefined) return true;
  return adminHasPermission(admin, entry.permission);
};

export const visibleMenuItems = (admin: AdminInfo | null): MenuEntry[] =>
  menuItems
    .filter((item) => canSeeEntry(admin, item))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter((child) =>
              canSeeEntry(admin, child),
            ),
          }
        : item,
    );

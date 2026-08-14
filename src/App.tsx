import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd';
import { useThemeStore } from './store/themeStore';
import AdminLayout from './components/AdminLayout';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';
import { Permission } from './constants/permissions';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const GamesPage = lazy(() => import('./pages/GamesPage'));
const GameRoundsPage = lazy(() => import('./pages/GameRoundsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const BannersPage = lazy(() => import('./pages/BannersPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const RechargePage = lazy(() => import('./pages/RechargePage'));
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'));
const DrawManagementPage = lazy(() => import('./pages/DrawManagementPage'));
const OddsConfigPage = lazy(() => import('./pages/OddsConfigPage'));
const GameSchedulePage = lazy(() => import('./pages/GameSchedulePage'));
const VipConfigPage = lazy(() => import('./pages/VipConfigPage'));
const CommissionConfigPage = lazy(() => import('./pages/CommissionConfigPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const SchedulersPage = lazy(() => import('./pages/SchedulersPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const RevenueReportPage = lazy(() => import('./pages/RevenueReportPage'));
const UserReportPage = lazy(() => import('./pages/UserReportPage'));
const GameReportPage = lazy(() => import('./pages/GameReportPage'));
const GameFeeConfigPage = lazy(() => import('./pages/GameFeeConfigPage'));
const LotteryReportPage = lazy(() => import('./pages/LotteryReportPage'));
const ManualLotteryReportsPage = lazy(
  () => import('./pages/ManualLotteryReportsPage'),
);
const PaymentReportPage = lazy(() => import('./pages/PaymentReportPage'));
const WageRecordsPage = lazy(() => import('./pages/WageRecordsPage'));
const AgentCommissionsPage = lazy(
  () => import('./pages/AgentCommissionsPage'),
);
const RebateRecordsPage = lazy(() => import('./pages/RebateRecordsPage'));
const OverallReportPage = lazy(() => import('./pages/OverallReportPage'));
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'));
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'));
const PopupsPage = lazy(() => import('./pages/PopupsPage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const CheckinConfigPage = lazy(() => import('./pages/CheckinConfigPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const RechargeAwardsPage = lazy(() => import('./pages/RechargeAwardsPage'));
const RankConfigPage = lazy(() => import('./pages/RankConfigPage'));
const AvatarManagementPage = lazy(() => import('./pages/AvatarManagementPage'));
const SharePostersPage = lazy(() => import('./pages/SharePostersPage'));
const CDKeyPage = lazy(() => import('./pages/CDKeyPage'));
const PaymentGatewayPage = lazy(() => import('./pages/PaymentGatewayPage'));
const LotteryResultsPage = lazy(() => import('./pages/LotteryResultsPage'));
const LotteryOrdersPage = lazy(() => import('./pages/LotteryOrdersPage'));
const CreateColorPage = lazy(
  () => import('./pages/games/create/CreateColorPage'),
);
const CreateDicePage = lazy(() => import('./pages/games/create/CreateDicePage'));
const CreateRaceGamePage = lazy(
  () => import('./pages/games/create/CreateRaceGamePage'),
);
const CreateMysteryBoxPage = lazy(
  () => import('./pages/games/create/CreateMysteryBoxPage'),
);
const CreateLuckySpinPage = lazy(
  () => import('./pages/games/create/CreateLuckySpinPage'),
);
const CreateCashRainPage = lazy(
  () => import('./pages/games/create/CreateCashRainPage'),
);
const GameTypeDetailPage = lazy(() => import('./pages/GameTypeDetailPage'));
const LotteryListPage = lazy(() => import('./pages/LotteryListPage'));
const CreateKeralaLotteryPage = lazy(
  () => import('./pages/lottery/create/CreateKeralaLotteryPage'),
);
const CreateThreeDigitLotteryPage = lazy(
  () => import('./pages/lottery/create/CreateThreeDigitLotteryPage'),
);
const CreateFourFiveDigitLotteryPage = lazy(
  () => import('./pages/lottery/create/CreateFourFiveDigitLotteryPage'),
);
const CreateDubaiLotteryPage = lazy(
  () => import('./pages/lottery/create/CreateDubaiLotteryPage'),
);
const LotteryDrawPage = lazy(() => import('./pages/LotteryDrawPage'));
const FinanceConfigPage = lazy(() => import('./pages/FinanceConfigPage'));
const GeneralConfigPage = lazy(() => import('./pages/GeneralConfigPage'));
const ThirdPartyConfigPage = lazy(
  () => import('./pages/ThirdPartyConfigPage'),
);
const ThirdPartyTransactionsPage = lazy(
  () => import('./pages/ThirdPartyTransactionsPage'),
);
const NotificationTemplatePage = lazy(
  () => import('./pages/NotificationTemplatePage'),
);
const FirebaseConfigPage = lazy(() => import('./pages/FirebaseConfigPage'));
const AppVersionPage = lazy(() => import('./pages/AppVersionPage'));
const LobbyConfigPage = lazy(() => import('./pages/LobbyConfigPage'));
const UiConfigPage = lazy(() => import('./pages/UiConfigPage'));
const ShareOddsConfigPage = lazy(() => import('./pages/ShareOddsConfigPage'));
const KeralaLotteryDetailPage = lazy(
  () => import('./pages/lottery/KeralaLotteryDetailPage'),
);
const DigitLotteryDetailPage = lazy(
  () => import('./pages/lottery/DigitLotteryDetailPage'),
);
const DiceDetailPage = lazy(() => import('./pages/games/DiceDetailPage'));
const ColorDetailPage = lazy(() => import('./pages/games/ColorDetailPage'));
const RaceDetailPage = lazy(() => import('./pages/games/RaceDetailPage'));
const LuckySpinDetailPage = lazy(
  () => import('./pages/games/LuckySpinDetailPage'),
);
const MysteryBoxDetailPage = lazy(
  () => import('./pages/games/MysteryBoxDetailPage'),
);
const DubaiDetailPage = lazy(() => import('./pages/games/DubaiDetailPage'));
const CashRainDetailPage = lazy(
  () => import('./pages/games/CashRainDetailPage'),
);

function App() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0891b2',
          borderRadius: 8,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: isDark ? '#151d2e' : '#ffffff',
          colorBgElevated: isDark ? '#1a2438' : '#ffffff',
          colorBgLayout: isDark ? '#0c1222' : '#f8fafc',
          colorBorderSecondary: isDark ? '#293548' : '#f1f5f9',
          colorBorder: isDark ? '#293548' : '#e2e8f0',
          controlHeight: 38,
          fontSize: 14,
        },
        components: {
          Button: { controlHeight: 38, paddingInline: 20, fontWeight: 500 },
          Table: {
            headerBg: isDark ? '#1a2438' : '#f8fafc',
            headerColor: isDark ? '#94a3b8' : '#475569',
            rowHoverBg: isDark ? 'rgba(8, 145, 178, 0.08)' : '#ecfeff',
            borderColor: isDark ? '#293548' : '#f1f5f9',
            headerSplitColor: isDark ? '#293548' : '#e2e8f0',
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
          },
          Card: { paddingLG: 24 },
          Input: { controlHeight: 38 },
          Select: { controlHeight: 38 },
          Modal: { borderRadiusLG: 16 },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(8, 145, 178, 0.15)',
            darkItemSelectedColor: '#22d3ee',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
            itemBorderRadius: 8,
            iconMarginInlineEnd: 12,
          },
          Tabs: {
            inkBarColor: '#0891b2',
            itemActiveColor: '#0891b2',
            itemSelectedColor: '#0891b2',
            itemHoverColor: '#06b6d4',
          },
          Message: { contentBg: isDark ? '#1a2438' : '#ffffff' },
          Notification: {
            colorBgElevated: isDark ? '#1a2438' : '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <Suspense
          fallback={
            <div style={{ padding: 40 }}>
              <PageLoader />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission={Permission.Dashboard}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission={Permission.Users}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId"
                element={
                  <ProtectedRoute requiredPermission={Permission.Users}>
                    <UserDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/list"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <LotteryListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/create/kerala"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <CreateKeralaLotteryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/create/three-digit"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <CreateThreeDigitLotteryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/create/four-five-digit"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <CreateFourFiveDigitLotteryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/create/dubai"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <CreateDubaiLotteryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/kerala/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <KeralaLotteryDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/digit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <DigitLotteryDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/draws"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <DrawManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/draws/:roundId"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <LotteryDrawPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/report"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <LotteryReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/results"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <LotteryResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lottery/orders"
                element={
                  <ProtectedRoute requiredPermission={Permission.Lottery}>
                    <LotteryOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GamesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/type/:gameType"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GameTypeDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/color"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateColorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/dice"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateDicePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/race"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateRaceGamePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/mystery-box"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateMysteryBoxPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/lucky-spin"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateLuckySpinPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/create/cash-rain"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CreateCashRainPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/rounds"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GameRoundsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/odds"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <OddsConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/schedule"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GameSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/fees"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GameFeeConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/:id/detail"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <GameDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/dice/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <DiceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/color/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <ColorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/race/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <RaceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/lucky-spin/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <LuckySpinDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/mystery-box/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <MysteryBoxDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/dubai/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <DubaiDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/cash-rain/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.Games}>
                    <CashRainDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredPermission={Permission.Orders}>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/recharge"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <RechargePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/withdraw"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <WithdrawPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/third-party-transactions"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <ThirdPartyTransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/vip"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <VipConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/commission"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <CommissionConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/settings"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <FinanceConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/recharge-awards"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <RechargeAwardsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/gateways"
                element={
                  <ProtectedRoute requiredPermission={Permission.Finance}>
                    <PaymentGatewayPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/banners"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <BannersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/announcements"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <AnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/popups"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <PopupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <ActivitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkin"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <CheckinConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/share-posters"
                element={
                  <ProtectedRoute requiredPermission={Permission.Content}>
                    <SharePostersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/revenue"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <RevenueReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/users"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <UserReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/games"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <GameReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/payments"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <PaymentReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/wages"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <WageRecordsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/commissions"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <AgentCommissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/rebates"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <RebateRecordsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/overall"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <OverallReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/manual-lottery"
                element={
                  <ProtectedRoute requiredPermission={Permission.Reports}>
                    <ManualLotteryReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/general"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <GeneralConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/notification-templates"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <NotificationTemplatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/third-party"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <ThirdPartyConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/firebase"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <FirebaseConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/app-version"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <AppVersionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/lobby"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <LobbyConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/ui"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <UiConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/share-odds"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <ShareOddsConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/admins"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/audit"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/schedulers"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <SchedulersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/roles"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/avatars"
                element={
                  <ProtectedRoute requiredPermission={Permission.System}>
                    <AvatarManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/system/profile" element={<ProfilePage />} />
              <Route
                path="/earn/rank-config"
                element={
                  <ProtectedRoute requiredPermission={Permission.Earn}>
                    <RankConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/earn/cdkeys"
                element={
                  <ProtectedRoute requiredPermission={Permission.Earn}>
                    <CDKeyPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

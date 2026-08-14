import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Table,
  Descriptions,
  Tag,
  Select,
  Button,
  Card,
  Row,
  Col,
  Empty,
  Avatar,
  Modal,
  Tooltip,
  Popconfirm,
  Space,
  Input,
  Form,
  InputNumber,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import api from '../services/api';
import { useAdminStore } from '../store';
import { roleLevel, SUPER_ADMIN_LEVEL } from '../constants/roles';
import PageHeader from '../components/PageHeader';
import GameSelect from '../components/GameSelect';
import DateRangeFilter, { rangeToDates } from '../components/DateRangeFilter';
import StatsCard from '../components/StatsCard';
import PageLoader from '../components/PageLoader';
import MoneyText from '../components/MoneyText';
import { resolveAssetUrl } from '../utils/assetUrl';
import StatusBadge from '../components/StatusBadge';
import { GameResultDisplay } from '../components/ResultBall';
import { AdminBetContentRenderer } from '../components/AdminBetContentRenderer';
import BetTypeTag from '../components/BetTypeTag';
import { typeName } from '../utils/gameTypes';
import { useDigitPositionConfig } from '../hooks/useDigitPositionConfig';
import { gameVisualProps } from '../utils/gameVisualProps';
import {
  formatDateTime,
  formatDateTimeShort,
  formatPercent,
  orDash,
} from '../utils/format';
import { canResolveRecharge } from '../utils/recharge';
import { getApiErrorMessage, isFormValidationError } from '../utils/apiError';

interface UserDetail {
  userId: string;
  phone: string;
  nickname: string;
  avatar: string;
  balance: number;
  bonusBalance: number;
  vipLevel: number;
  inviteCode: string;
  invitedBy: string;
  channelId: string;
  isRecharge: number;
  status: number;
  createdAt: string;
  totalBet: number;
  totalWin: number;
  totalRecharge: number;
  totalWithdraw: number;
  totalOrders: number;
  wonOrders: number;
  directReferrals: number;
}
interface BetRecord {
  id: number;
  gameType: string;
  roundNo: string;
  totalAmount: number;
  winAmount: number;
  status: number;
  createdAt: string;
}
interface TransactionRecord {
  id: number;
  sourceType: string;
  amount: number;
  balance: number;
  refId: string;
  description: string;
  createdAt: string;
}
interface ReferralRecord {
  userId: string;
  nickname: string;
  phone: string;
  balance: number;
  vipLevel: number;
  isRecharge: number;
  createdAt: string;
}
interface TransferRecord {
  id: number;
  amount: number;
  giveAmount: number;
  credited: number;
  balanceAfter: number | null;
  orderNo: string;
  status: number;
  createdAt: string;
}
interface RechargeRecord {
  id: number;
  orderNo: string;
  userId: string;
  amount: number;
  channel: string;
  gatewayMode?: string;
  additionalVerification?: number;
  manualFallback?: number;
  status: number;
  remark?: string;
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
}

enum RechargeStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

type BetContent = Record<string, unknown>;
type RoundResult = Record<string, unknown>;

interface OrderRecord {
  id: number;
  orderNo: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  gameId: number;
  gameType: string;
  gameName?: string;
  roundNo: string;
  betType: string;
  betContent: BetContent | null;
  amount: number;
  totalAmount: number;
  odds: number;
  winAmount: number;
  prize: number;
  quantity: number;
  status: number;
  isBonus: number;
  createdAt: string;
  result?: RoundResult | null;
}

interface PaginatedResponse<T> {
  list: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const ORDER_STATUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Won' },
  { value: 2, label: 'Lost' },
  { value: 3, label: 'Cancelled' },
  { value: 4, label: 'Refunded' },
  { value: 5, label: 'Settled' },
];

interface ReferralsResponse {
  direct?: ReferralRecord[];
  indirect?: ReferralRecord[];
}

const sourceTypeOptions = [
  'recharge',
  'withdraw',
  'bet',
  'win',
  'bonus',
  'rebate',
  'commission',
  'transfer',
].map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));

const errorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

interface BalanceFormValues {
  type: 'add' | 'subtract';
  amount: number;
}

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { get: getDigitConfig } = useDigitPositionConfig();
  const admin = useAdminStore((s) => s.admin);
  const isSuperAdmin = roleLevel(admin?.role) >= SUPER_ADMIN_LEVEL;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const [bets, setBets] = useState<BetRecord[]>([]);
  const [betsTotal, setBetsTotal] = useState(0);
  const [betsPage, setBetsPage] = useState(1);
  const [betsSize, setBetsSize] = useState(10);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsGameIds, setBetsGameIds] = useState<number[]>([]);
  const [betsRange, setBetsRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [txns, setTxns] = useState<TransactionRecord[]>([]);
  const [txnsTotal, setTxnsTotal] = useState(0);
  const [txnsPage, setTxnsPage] = useState(1);
  const [txnsSize, setTxnsSize] = useState(10);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsSourceType, setTxnsSourceType] = useState<string | undefined>();
  const [txnsRange, setTxnsRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [directReferrals, setDirectReferrals] = useState<ReferralRecord[]>([]);
  const [indirectReferrals, setIndirectReferrals] = useState<ReferralRecord[]>(
    [],
  );
  const [referralsLoading, setReferralsLoading] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersSize, setOrdersSize] = useState(10);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersGameIds, setOrdersGameIds] = useState<number[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<number | undefined>();
  const [ordersRange, setOrdersRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderRecord | null>(null);

  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [transfersTotal, setTransfersTotal] = useState(0);
  const [transfersPage, setTransfersPage] = useState(1);
  const [transfersSize, setTransfersSize] = useState(10);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersRange, setTransfersRange] = useState<[Dayjs, Dayjs] | null>(
    null,
  );

  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [rechargesTotal, setRechargesTotal] = useState(0);
  const [rechargesPage, setRechargesPage] = useState(1);
  const [rechargesSize, setRechargesSize] = useState(10);
  const [rechargesLoading, setRechargesLoading] = useState(false);
  const [rechargesRange, setRechargesRange] = useState<[Dayjs, Dayjs] | null>(
    null,
  );
  const [rechargeReject, setRechargeReject] = useState<{
    open: boolean;
    orderNo: string;
  }>({ open: false, orderNo: '' });
  const [rechargeRejectRemark, setRechargeRejectRemark] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown, UserDetail>(`users/${userId}/detail`);
      setDetail(res);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load user detail'));
    } finally {
      setLoading(false);
    }
  };

  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceForm] = Form.useForm<BalanceFormValues>();
  const [balanceLoading, setBalanceLoading] = useState(false);

  const openBalanceModal = () => {
    balanceForm.resetFields();
    setBalanceModalOpen(true);
  };

  const handleBalance = async () => {
    try {
      const values = await balanceForm.validateFields();
      setBalanceLoading(true);
      await api.post(`users/${userId}/balance`, values);
      message.success('Balance adjusted successfully');
      setBalanceModalOpen(false);
      fetchDetail();
    } catch (err) {
      if (!isFormValidationError(err)) {
        message.error(getApiErrorMessage(err, 'Failed to adjust balance'));
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banSaving, setBanSaving] = useState(false);

  const handleToggleBan = () => {
    if (!detail) return;
    if (detail.status === 1) {
      setBanReason('');
      setBanModalOpen(true);
      return;
    }
    Modal.confirm({
      title: 'Unban this user?',
      content: 'The user will regain access to their account.',
      okText: 'Unban',
      onOk: async () => {
        try {
          await api.put(`users/${userId}`, { status: 1, banReason: '' });
          message.success('User unbanned');
          fetchDetail();
        } catch (err) {
          message.error(errorMessage(err, 'Failed to update user status'));
        }
      },
    });
  };

  const submitBan = async () => {
    setBanSaving(true);
    try {
      await api.put(`users/${userId}`, {
        status: 0,
        banReason: banReason.trim(),
      });
      message.success('User banned');
      setBanModalOpen(false);
      fetchDetail();
    } catch (err) {
      message.error(errorMessage(err, 'Failed to ban user'));
    } finally {
      setBanSaving(false);
    }
  };
  const fetchBets = async (
    page = betsPage,
    size = betsSize,
    gids = betsGameIds,
    range = betsRange,
  ) => {
    setBetsLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = await api.post<unknown, PaginatedResponse<BetRecord>>(
        `users/${userId}/bets`,
        {
          pageNo: page,
          pageSize: size,
          gameIds: gids.length > 0 ? gids : undefined,
          startDate,
          endDate,
        },
      );
      setBets(res.list);
      setBetsTotal(res.total);
      setBetsPage(res.pageNo);
      setBetsSize(res.pageSize);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load bets'));
    } finally {
      setBetsLoading(false);
    }
  };
  const fetchTransactions = async (
    page = txnsPage,
    size = txnsSize,
    sourceType = txnsSourceType,
    range = txnsRange,
  ) => {
    setTxnsLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = await api.post<unknown, PaginatedResponse<TransactionRecord>>(
        `users/${userId}/transactions`,
        {
          pageNo: page,
          pageSize: size,
          sourceType: sourceType ? sourceType : undefined,
          startDate,
          endDate,
        },
      );
      setTxns(res.list);
      setTxnsTotal(res.total);
      setTxnsPage(res.pageNo);
      setTxnsSize(res.pageSize);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load transactions'));
    } finally {
      setTxnsLoading(false);
    }
  };
  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const res = await api.get<unknown, ReferralsResponse>(
        `users/${userId}/referrals`,
      );
      setDirectReferrals(Array.isArray(res.direct) ? res.direct : []);
      setIndirectReferrals(Array.isArray(res.indirect) ? res.indirect : []);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load referrals'));
    } finally {
      setReferralsLoading(false);
    }
  };

  const fetchOrders = async (
    page = ordersPage,
    size = ordersSize,
    gids = ordersGameIds,
    status = ordersStatus,
    range = ordersRange,
  ) => {
    setOrdersLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = await api.post<unknown, PaginatedResponse<OrderRecord>>(
        'orders/list',
        {
          pageNo: page,
          pageSize: size,
          userId,
          gameIds: gids.length > 0 ? gids : undefined,
          status,
          startDate,
          endDate,
        },
      );
      setOrders(res.list);
      setOrdersTotal(res.total);
      setOrdersPage(res.pageNo);
      setOrdersSize(res.pageSize);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load orders'));
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchTransfers = async (
    page = transfersPage,
    size = transfersSize,
    range = transfersRange,
  ) => {
    setTransfersLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = await api.post<unknown, PaginatedResponse<TransferRecord>>(
        `users/${userId}/transfers`,
        {
          pageNo: page,
          pageSize: size,
          startDate,
          endDate,
        },
      );
      setTransfers(res.list);
      setTransfersTotal(res.total);
      setTransfersPage(res.pageNo);
      setTransfersSize(res.pageSize);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load transfer records'));
    } finally {
      setTransfersLoading(false);
    }
  };

  const fetchRecharges = async (
    page = rechargesPage,
    size = rechargesSize,
    range = rechargesRange,
  ) => {
    setRechargesLoading(true);
    try {
      const { startDate, endDate } = rangeToDates(range);
      const res = await api.post<unknown, PaginatedResponse<RechargeRecord>>(
        'finance/recharge/list',
        {
          pageNo: page,
          pageSize: size,
          search: userId,
          startDate,
          endDate,
        },
      );
      setRecharges(res.list);
      setRechargesTotal(res.total);
      setRechargesPage(res.pageNo);
      setRechargesSize(res.pageSize);
    } catch (err) {
      message.error(errorMessage(err, 'Failed to load recharge records'));
    } finally {
      setRechargesLoading(false);
    }
  };

  const handleRechargeApprove = async (orderNo: string) => {
    try {
      await api.post('finance/recharge/approve', { orderNo });
      message.success('Recharge approved successfully');
      fetchRecharges();
      fetchDetail();
    } catch (err) {
      message.error(errorMessage(err, 'Failed to approve recharge'));
    }
  };

  const handleRechargeReject = async () => {
    if (!rechargeRejectRemark.trim()) {
      message.warning('Please enter a rejection reason');
      return;
    }
    try {
      await api.post('finance/recharge/reject', {
        orderNo: rechargeReject.orderNo,
        remark: rechargeRejectRemark,
      });
      message.success('Recharge rejected');
      setRechargeReject({ open: false, orderNo: '' });
      setRechargeRejectRemark('');
      fetchRecharges();
    } catch (err) {
      message.error(errorMessage(err, 'Failed to reject recharge'));
    }
  };

  const canApproveRecharge = (r: RechargeRecord): boolean =>
    canResolveRecharge(r, r.status === RechargeStatus.Pending);

  const canRejectRecharge = (r: RechargeRecord): boolean =>
    canResolveRecharge(r, r.status === RechargeStatus.Pending);

  useEffect(() => {
    fetchDetail();
  }, [userId]);

  const handleTabChange = (key: string) => {
    if (key === 'orders')
      fetchOrders(1, ordersSize, ordersGameIds, ordersStatus, ordersRange);
    if (key === 'bets') fetchBets(1, betsSize, betsGameIds, betsRange);
    if (key === 'transactions')
      fetchTransactions(1, txnsSize, txnsSourceType, txnsRange);
    if (key === 'transfers') fetchTransfers(1, transfersSize, transfersRange);
    if (key === 'recharges') fetchRecharges(1, rechargesSize, rechargesRange);
    if (key === 'referrals') fetchReferrals();
  };

  const emptyText = (label: string) => ({
    emptyText: (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={label} />
    ),
  });

  const betColumns: ColumnsType<BetRecord> = [
    {
      title: 'Game Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 100,
      render: (v: string) => <Tag>{v?.toUpperCase()}</Tag>,
    },
    { title: 'Round No', dataIndex: 'roundNo', key: 'roundNo', width: 140 },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Win',
      dataIndex: 'winAmount',
      key: 'winAmount',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="auto" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) => <StatusBadge kind="order" status={v} />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTimeShort(v),
    },
  ];
  const orderColumns: ColumnsType<OrderRecord> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'Game Name',
      key: 'gameName',
      width: 150,
      render: (_: unknown, r: OrderRecord) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {orDash(r.gameName)}
        </span>
      ),
    },
    {
      title: 'Game Type',
      dataIndex: 'gameType',
      key: 'gameType',
      width: 130,
      render: (t: string, r: OrderRecord) => (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Tag>{typeName(t)}</Tag>
          {r.isBonus ? <Tag color="gold">B</Tag> : null}
        </span>
      ),
    },
    {
      title: 'Round',
      dataIndex: 'roundNo',
      key: 'roundNo',
      width: 150,
      render: (v: string) =>
        v ? (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            {v}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Picked',
      key: 'picked',
      width: 220,
      render: (_: unknown, r: OrderRecord) =>
        r.betContent ? (
          <AdminBetContentRenderer
            gameType={r.gameType}
            betContent={r.betContent}
            size={20}
            {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        ),
    },
    {
      title: 'Result',
      key: 'result',
      width: 220,
      render: (_: unknown, r: OrderRecord) => (
        <GameResultDisplay
          gameType={r.gameType}
          result={r.result}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Bet Type',
      dataIndex: 'betType',
      key: 'betType',
      width: 110,
      render: (v: string, r: OrderRecord) => (
        <BetTypeTag
          betType={v}
          {...gameVisualProps(r.gameType, getDigitConfig(r.gameId))}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Odds',
      dataIndex: 'odds',
      key: 'odds',
      width: 70,
      render: (v: number) =>
        v ? (
          <span style={{ color: 'var(--text-muted)' }}>
            {Number(v).toFixed(2)}x
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Win',
      key: 'win',
      width: 110,
      render: (_: unknown, r: OrderRecord) => (
        <MoneyText value={r.winAmount} variant="auto" />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) => <StatusBadge kind="order" status={v} />,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '',
      key: 'actions',
      width: 45,
      fixed: 'right',
      render: (_: unknown, r: OrderRecord) => (
        <Tooltip title="Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setOrderDetail(r)}
          />
        </Tooltip>
      ),
    },
  ];
  const txnColumns: ColumnsType<TransactionRecord> = [
    {
      title: 'Type',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 110,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    { title: 'Ref ID', dataIndex: 'refId', key: 'refId', width: 140 },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTimeShort(v),
    },
  ];
  const transferColumns: ColumnsType<TransferRecord> = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'Bonus Given',
      dataIndex: 'giveAmount',
      key: 'giveAmount',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="auto" showSign />,
    },
    {
      title: 'Credited',
      dataIndex: 'credited',
      key: 'credited',
      width: 130,
      render: (v: number) => <MoneyText value={v} variant="positive" />,
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 140,
      render: (v: number | null) =>
        v === null ? (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ) : (
          <MoneyText value={v} variant="neutral" />
        ),
    },
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {orDash(v)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) => <StatusBadge kind="transfer" status={v} />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
  ];
  const rechargeColumns: ColumnsType<RechargeRecord> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {orDash(v)}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => <MoneyText value={v} variant="approve" />,
    },
    {
      title: 'Gateway',
      key: 'gateway',
      width: 140,
      render: (_: unknown, r: RechargeRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.channel ? r.channel : 'Direct'}</div>
          {r.gatewayMode && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {r.gatewayMode === 'manual' ? 'Manual' : 'Auto'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: number) => <StatusBadge kind="recharge" status={v} />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Action',
      key: 'actions',
      width: 200,
      render: (_: unknown, r: RechargeRecord) => (
        <Space>
          {canApproveRecharge(r) && (
            <Popconfirm
              title="Approve this recharge?"
              onConfirm={() => handleRechargeApprove(r.orderNo)}
              okText="Approve"
            >
              <Button
                type="link"
                size="small"
                className="text-approve"
                icon={<CheckCircleOutlined />}
              >
                Approve
              </Button>
            </Popconfirm>
          )}
          {canRejectRecharge(r) && (
            <Button
              type="link"
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setRechargeReject({ open: true, orderNo: r.orderNo });
                setRechargeRejectRemark('');
              }}
            >
              Reject
            </Button>
          )}
          {r.status !== RechargeStatus.Pending && (
            <span style={{ color: 'var(--text-muted)' }}>—</span>
          )}
        </Space>
      ),
    },
  ];
  const referralColumns: ColumnsType<ReferralRecord> = [
    { title: 'User ID', dataIndex: 'userId', key: 'userId', width: 140 },
    { title: 'Nickname', dataIndex: 'nickname', key: 'nickname', width: 120 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      render: (v: number) => <MoneyText value={v} variant="neutral" />,
    },
    {
      title: 'VIP',
      dataIndex: 'vipLevel',
      key: 'vipLevel',
      width: 90,
      render: (v: number) =>
        v != null ? <Tag color="gold">VIP {v}</Tag> : <Tag>—</Tag>,
    },
    {
      title: 'Recharged',
      dataIndex: 'isRecharge',
      key: 'isRecharge',
      width: 100,
      render: (v: number) =>
        v === 1 ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTimeShort(v),
    },
  ];

  if (loading) return <PageLoader cards={4} />;
  if (!detail) return <PageLoader cards={4} />;

  const netPL = Number((detail.totalWin - detail.totalBet).toFixed(2));
  const winRate =
    detail.totalOrders > 0
      ? ((detail.wonOrders / detail.totalOrders) * 100).toFixed(1)
      : '0';

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <>
          <Card
            className="stats-card blue"
            style={{ marginBottom: 24 }}
            styles={{ body: { padding: 24 } }}
          >
            <div
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              {detail?.avatar ? (
                <Avatar
                  size={72}
                  src={resolveAssetUrl(detail.avatar)}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <Avatar
                  size={72}
                  icon={<UserOutlined />}
                  style={{
                    background: 'var(--gradient-blue)',
                    flexShrink: 0,
                    fontSize: 32,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {detail?.nickname || detail?.userId}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {detail?.phone} | {detail?.userId}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Tag color="gold">VIP {detail?.vipLevel}</Tag>
                  {detail?.status === 1 ? (
                    <Tag color="green">Active</Tag>
                  ) : (
                    <Tag color="red">Disabled</Tag>
                  )}
                  {detail?.isRecharge === 1 && (
                    <Tag color="blue">Recharged</Tag>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Balance
                </div>
                <MoneyText
                  value={detail.balance}
                  variant="positive"
                  large
                />
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Bonus:{' '}
                  <MoneyText
                    value={detail.bonusBalance}
                    variant="neutral"
                  />
                </div>
                <Button
                  danger={detail.status === 1}
                  size="small"
                  style={{ marginTop: 12 }}
                  onClick={handleToggleBan}
                >
                  {detail.status === 1 ? 'Ban User' : 'Unban User'}
                </Button>
              </div>
            </div>
            <Descriptions bordered column={{ xs: 1, sm: 3 }} size="small">
              <Descriptions.Item label="Invite Code">
                {detail?.inviteCode}
              </Descriptions.Item>
              <Descriptions.Item label="Invited By">
                {orDash(detail.invitedBy)}
              </Descriptions.Item>
              <Descriptions.Item label="Channel">
                {orDash(detail.channelId)}
              </Descriptions.Item>
              <Descriptions.Item label="Direct Referrals">
                {detail.directReferrals}
              </Descriptions.Item>
              <Descriptions.Item label="Win Rate">
                {formatPercent(winRate, 1)}
              </Descriptions.Item>
              <Descriptions.Item label="Joined">
                {formatDateTimeShort(detail?.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={8} lg={4}>
              <StatsCard
                title="Total Bet"
                value={detail.totalBet}
                icon={<DollarOutlined />}
                color="blue"
                prefix="₹"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <StatsCard
                title="Total Win"
                value={detail.totalWin}
                icon={<TrophyOutlined />}
                color="green"
                prefix="₹"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card
                className={`stats-card ${netPL >= 0 ? 'green' : 'red'}`}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <div className="stats-card-inner">
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      Net P/L
                    </div>
                    <MoneyText value={netPL} variant="auto" large showSign />
                  </div>
                  <div
                    className={`stats-card-icon ${netPL >= 0 ? 'green' : 'red'}`}
                  >
                    <PercentageOutlined />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <StatsCard
                title="Total Orders"
                value={detail.totalOrders}
                icon={<ShoppingCartOutlined />}
                color="cyan"
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <StatsCard
                title="Total Recharge"
                value={detail.totalRecharge}
                icon={<DollarOutlined />}
                color="orange"
                prefix="₹"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <StatsCard
                title="Total Withdraw"
                value={detail.totalWithdraw}
                icon={<DollarOutlined />}
                color="red"
                prefix="₹"
                precision={2}
              />
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'orders',
      label: 'My Orders',
      children: (
        <>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <GameSelect
              scope="all"
              value={ordersGameIds}
              onChange={(val) => {
                setOrdersGameIds(val);
                setOrdersPage(1);
                fetchOrders(1, ordersSize, val, ordersStatus, ordersRange);
              }}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Filter by Status"
              style={{ width: 180 }}
              options={ORDER_STATUS_OPTIONS}
              value={ordersStatus}
              onChange={(val) => {
                setOrdersStatus(val);
                setOrdersPage(1);
                fetchOrders(1, ordersSize, ordersGameIds, val, ordersRange);
              }}
            />
            <DateRangeFilter
              value={ordersRange}
              onChange={(range) => {
                setOrdersRange(range);
                setOrdersPage(1);
                fetchOrders(1, ordersSize, ordersGameIds, ordersStatus, range);
              }}
              style={{ width: 260 }}
            />
          </div>
          <Table
            columns={orderColumns}
            dataSource={orders}
            rowKey="id"
            loading={ordersLoading}
            className="modern-table"
            locale={emptyText('No orders found')}
            pagination={{
              current: ordersPage,
              pageSize: ordersSize,
              total: ordersTotal,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} orders`,
              onChange: (page, size) => {
                setOrdersPage(page);
                setOrdersSize(size);
                fetchOrders(page, size);
              },
            }}
            scroll={{ x: 1400 }}
          />
        </>
      ),
    },
    {
      key: 'bets',
      label: 'Bets',
      children: (
        <>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <GameSelect
              scope="all"
              value={betsGameIds}
              onChange={(val) => {
                setBetsGameIds(val);
                setBetsPage(1);
                fetchBets(1, betsSize, val, betsRange);
              }}
              style={{ width: 260 }}
            />
            <DateRangeFilter
              value={betsRange}
              onChange={(range) => {
                setBetsRange(range);
                setBetsPage(1);
                fetchBets(1, betsSize, betsGameIds, range);
              }}
              style={{ width: 260 }}
            />
          </div>
          <Table
            columns={betColumns}
            dataSource={bets}
            rowKey="id"
            loading={betsLoading}
            className="modern-table"
            locale={emptyText('No bets found')}
            pagination={{
              current: betsPage,
              pageSize: betsSize,
              total: betsTotal,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} bets`,
              onChange: (page, size) => {
                setBetsPage(page);
                setBetsSize(size);
                fetchBets(page, size);
              },
            }}
            scroll={{ x: 800 }}
          />
        </>
      ),
    },
    {
      key: 'transactions',
      label: 'Transactions',
      children: (
        <>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Select
              allowClear
              placeholder="Filter by Source Type"
              style={{ width: 200 }}
              options={sourceTypeOptions}
              value={txnsSourceType}
              onChange={(val) => {
                setTxnsSourceType(val);
                setTxnsPage(1);
                fetchTransactions(1, txnsSize, val, txnsRange);
              }}
            />
            <DateRangeFilter
              value={txnsRange}
              onChange={(range) => {
                setTxnsRange(range);
                setTxnsPage(1);
                fetchTransactions(1, txnsSize, txnsSourceType, range);
              }}
              style={{ width: 260 }}
            />
          </div>
          <Table
            columns={txnColumns}
            dataSource={txns}
            rowKey="id"
            loading={txnsLoading}
            className="modern-table"
            locale={emptyText('No transactions found')}
            pagination={{
              current: txnsPage,
              pageSize: txnsSize,
              total: txnsTotal,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} transactions`,
              onChange: (page, size) => {
                setTxnsPage(page);
                setTxnsSize(size);
                fetchTransactions(page, size);
              },
            }}
            scroll={{ x: 900 }}
          />
        </>
      ),
    },
    {
      key: 'transfers',
      label: 'Transfer Records',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <DateRangeFilter
              value={transfersRange}
              onChange={(range) => {
                setTransfersRange(range);
                setTransfersPage(1);
                fetchTransfers(1, transfersSize, range);
              }}
              style={{ width: 260 }}
            />
          </div>
          <Table
            columns={transferColumns}
            dataSource={transfers}
            rowKey="id"
            loading={transfersLoading}
            className="modern-table"
            locale={emptyText('No transfer records found')}
            pagination={{
              current: transfersPage,
              pageSize: transfersSize,
              total: transfersTotal,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} transfers`,
              onChange: (page, size) => {
                setTransfersPage(page);
                setTransfersSize(size);
                fetchTransfers(page, size);
              },
            }}
            scroll={{ x: 1000 }}
          />
        </>
      ),
    },
    {
      key: 'recharges',
      label: 'Recharges',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <DateRangeFilter
              value={rechargesRange}
              onChange={(range) => {
                setRechargesRange(range);
                setRechargesPage(1);
                fetchRecharges(1, rechargesSize, range);
              }}
              style={{ width: 260 }}
            />
          </div>
          <Table
            columns={rechargeColumns}
            dataSource={recharges}
            rowKey="id"
            loading={rechargesLoading}
            className="modern-table"
            rowClassName={(record) =>
              record.status === RechargeStatus.Pending ? 'pending-row' : ''
            }
            locale={emptyText('No recharge records found')}
            pagination={{
              current: rechargesPage,
              pageSize: rechargesSize,
              total: rechargesTotal,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} recharges`,
              onChange: (page, size) => {
                setRechargesPage(page);
                setRechargesSize(size);
                fetchRecharges(page, size);
              },
            }}
            scroll={{ x: 900 }}
          />
        </>
      ),
    },
    {
      key: 'referrals',
      label: 'Referrals',
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card
              title="Direct Referrals"
              size="small"
              className="chart-card"
              loading={referralsLoading}
            >
              <Table
                columns={referralColumns}
                dataSource={directReferrals}
                rowKey="userId"
                pagination={false}
                size="small"
                className="modern-table"
                locale={emptyText('No direct referrals')}
                scroll={{ x: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="Indirect Referrals"
              size="small"
              className="chart-card"
              loading={referralsLoading}
            >
              <Table
                columns={referralColumns}
                dataSource={indirectReferrals}
                rowKey="userId"
                pagination={false}
                size="small"
                className="modern-table"
                locale={emptyText('No indirect referrals')}
                scroll={{ x: 700 }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={`User ${userId}`}
        subtitle={detail.nickname ? detail.nickname : detail.phone}
        icon={<UserOutlined />}
        iconBg="var(--gradient-blue)"
        extra={
          <Space>
            {isSuperAdmin && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={openBalanceModal}
              >
                Balance
              </Button>
            )}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Space>
        }
      />
      <Tabs
        defaultActiveKey="overview"
        onChange={handleTabChange}
        items={tabItems}
      />

      <Modal
        title="Order Details"
        open={!!orderDetail}
        onCancel={() => setOrderDetail(null)}
        footer={null}
        width={650}
      >
        {orderDetail && (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Order No">
              <span style={{ fontFamily: 'monospace' }}>
                {orderDetail.orderNo}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Game">
              <span
                style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
              >
                <span style={{ fontWeight: 600 }}>
                  {orDash(orderDetail.gameName)}
                </span>
                <Tag>{typeName(orderDetail.gameType)}</Tag>
                {orderDetail.isBonus ? <Tag color="gold">Bonus</Tag> : null}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Round No">
              <span style={{ fontFamily: 'monospace' }}>
                {orDash(orderDetail.roundNo)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Bet Type">
              <BetTypeTag
                betType={orderDetail.betType}
                {...gameVisualProps(
                  orderDetail.gameType,
                  getDigitConfig(orderDetail.gameId),
                )}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {orderDetail.quantity ? orderDetail.quantity : 1}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <MoneyText value={orderDetail.totalAmount} variant="neutral" />
            </Descriptions.Item>
            <Descriptions.Item label="Odds">
              {orderDetail.odds ? `${Number(orderDetail.odds).toFixed(2)}x` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Win Amount">
              <MoneyText value={orderDetail.winAmount} variant="auto" />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge kind="order" status={orderDetail.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Created" span={2}>
              {formatDateTime(orderDetail.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Picked" span={2}>
              {orderDetail.betContent ? (
                <AdminBetContentRenderer
                  gameType={orderDetail.gameType}
                  betContent={orderDetail.betContent}
                  size={26}
                  {...gameVisualProps(
                    orderDetail.gameType,
                    getDigitConfig(orderDetail.gameId),
                  )}
                />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Result" span={2}>
              {orderDetail.result ? (
                <GameResultDisplay
                  gameType={orderDetail.gameType}
                  result={orderDetail.result}
                  size={26}
                  {...gameVisualProps(
                    orderDetail.gameType,
                    getDigitConfig(orderDetail.gameId),
                  )}
                />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Not drawn yet
                </span>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="Reject Recharge"
        open={rechargeReject.open}
        onOk={handleRechargeReject}
        onCancel={() => setRechargeReject({ open: false, orderNo: '' })}
        okText="Reject"
        okType="danger"
      >
        <p>
          Order: <strong>{rechargeReject.orderNo}</strong>
        </p>
        <Input.TextArea
          rows={3}
          value={rechargeRejectRemark}
          onChange={(e) => setRechargeRejectRemark(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </Modal>

      <Modal
        title="Ban User"
        open={banModalOpen}
        onOk={submitBan}
        onCancel={() => setBanModalOpen(false)}
        okText="Ban User"
        okType="danger"
        confirmLoading={banSaving}
      >
        <p style={{ marginBottom: 12 }}>
          The user will be blocked from logging in, betting and withdrawing, and
          will see an account-suspended screen. Add an optional message shown to
          them:
        </p>
        <Input.TextArea
          rows={3}
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          maxLength={255}
          placeholder="Reason / message shown to the user (optional)"
        />
      </Modal>

      <Modal
        title={`Adjust Balance - ${userId}`}
        open={balanceModalOpen}
        onOk={handleBalance}
        onCancel={() => setBalanceModalOpen(false)}
        confirmLoading={balanceLoading}
        destroyOnHidden
      >
        <Form form={balanceForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Select.Option value="add">Add</Select.Option>
                  <Select.Option value="subtract">Subtract</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="Enter amount"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDetailPage;

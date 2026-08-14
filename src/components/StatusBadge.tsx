import { useConfigStore } from '../store/configStore';

export type StatusKind =
  | 'order'
  | 'round'
  | 'recharge'
  | 'withdraw'
  | 'transfer'
  | 'message'
  | 'lottery'
  | 'config';

interface StatusBadgeProps {
  kind: StatusKind;
  status: number | string | null | undefined;
  fallbackText?: string;
  activeText?: string;
  inactiveText?: string;
}

const COLOR_TO_CLASS: Record<string, string | undefined> = {
  green: 'active',
  orange: 'pending',
  gold: 'pending',
  red: 'inactive',
  volcano: 'inactive',
  blue: 'info',
  cyan: 'completed',
  purple: 'processing',
  geekblue: 'processing',
  magenta: 'processing',
  default: 'cancelled',
  warning: 'pending',
  success: 'active',
  error: 'inactive',
  processing: 'processing',
};

const DEFAULT_CLASS = 'cancelled';

const resolveBadgeText = (
  entryText: string | undefined,
  fallbackText: string | undefined,
  status: number | string | null | undefined,
): string => {
  if (entryText) return entryText;
  if (fallbackText) return fallbackText;
  if (status === null || status === undefined) return '';
  return String(status);
};

const StatusBadge = ({
  kind,
  status,
  fallbackText,
  activeText = 'Active',
  inactiveText = 'Disabled',
}: StatusBadgeProps) => {
  const statusMaps = useConfigStore((s) => s.statusMaps);
  const n = Number(status);

  if (kind === 'config') {
    const active = n === 1;
    const text = active ? activeText : inactiveText;
    return (
      <span className={`status-badge ${active ? 'active' : 'inactive'}`}>
        {text}
      </span>
    );
  }

  const kindMap = statusMaps[kind];
  const entry = Number.isFinite(n) && kindMap ? kindMap[n] : undefined;
  const text = resolveBadgeText(entry?.text, fallbackText, status);
  const colorClass = entry ? COLOR_TO_CLASS[entry.color] : undefined;
  const cls = colorClass ? colorClass : DEFAULT_CLASS;
  return <span className={`status-badge ${cls}`}>{text}</span>;
};

export default StatusBadge;

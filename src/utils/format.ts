import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DISPLAY_TIME_ZONE = 'Asia/Kolkata';

export const CURRENCY_SYMBOL = '₹';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export const formatMoney = (
  value: number | string | null | undefined,
  options?: { symbol?: string; showSign?: boolean },
): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const symbol = options?.symbol ?? CURRENCY_SYMBOL;
  const sign = options?.showSign && n > 0 ? '+' : '';
  return `${sign}${symbol}${moneyFormatter.format(n)}`;
};

export const formatMoneyShort = (
  value: number | string | null | undefined,
  options?: { symbol?: string },
): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const symbol = options?.symbol ?? CURRENCY_SYMBOL;
  if (Math.abs(n) >= 10_000_000) return `${symbol}${(n / 10_000_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100_000) return `${symbol}${(n / 100_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}K`;
  return `${symbol}${moneyFormatter.format(n)}`;
};

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return numberFormatter.format(n);
};

export const formatPercent = (
  value: number | string | null | undefined,
  fractionDigits = 2,
): string => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(fractionDigits)}%`;
};

export const DATE_TIME_FORMAT = 'YYYY-MM-DD hh:mm:ss A';
export const DATE_TIME_SHORT_FORMAT = 'YYYY-MM-DD hh:mm A';
export const DATE_FORMAT = 'YYYY-MM-DD';
export const ROUND_TIME_FORMAT = 'DD-MM hh:mm A';
export const TIME_FORMAT = 'hh:mm A';
export const MONTH_DAY_TIME_FORMAT = 'MMM D, hh:mm A';

export const formatDateTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(DATE_TIME_FORMAT) : '—';
};

export const formatTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(TIME_FORMAT) : '—';
};

export const formatMonthDayTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(MONTH_DAY_TIME_FORMAT) : '—';
};

export const formatDateTimeShort = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(DATE_TIME_SHORT_FORMAT) : '—';
};

export const formatDate = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(DATE_FORMAT) : '—';
};

export const formatRoundTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  return d.isValid() ? d.format(ROUND_TIME_FORMAT) : '—';
};

export const formatRelativeTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—';
  const d = dayjs(value).tz(DISPLAY_TIME_ZONE);
  if (!d.isValid()) return '—';
  const diff = dayjs().diff(d, 'second');
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.format(DATE_FORMAT);
};

export const truncate = (value: string | null | undefined, length: number): string => {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length)}…` : value;
};

export const EM_DASH = '—';

export const orDash = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined || value === '') return EM_DASH;
  return String(value);
};

export const firstString = (
  ...values: (string | null | undefined)[]
): string => {
  for (const value of values) {
    if (value) return value;
  }
  return '';
};

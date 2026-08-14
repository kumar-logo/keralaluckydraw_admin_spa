import { formatMoney, CURRENCY_SYMBOL } from '../utils/format';

type MoneyVariant = 'auto' | 'positive' | 'negative' | 'neutral' | 'approve' | 'plain';

interface MoneyTextProps {
  value: number | string | null | undefined;
  variant?: MoneyVariant;
  large?: boolean;
  showSign?: boolean;
  symbol?: string;
  zeroAs?: string;
  className?: string;
}

const variantClass: Record<MoneyVariant, string> = {
  auto: '',
  positive: 'amount-positive',
  negative: 'amount-negative',
  neutral: 'amount-neutral',
  approve: 'amount-approve',
  plain: '',
};

const MoneyText = ({
  value,
  variant = 'neutral',
  large,
  showSign,
  symbol,
  zeroAs,
  className,
}: MoneyTextProps) => {
  const n = Number(value ?? 0);
  let resolved = variant;
  if (variant === 'auto') {
    if (!Number.isFinite(n) || n === 0) resolved = 'neutral';
    else resolved = n > 0 ? 'positive' : 'negative';
  }
  const classes = [variantClass[resolved], large ? 'amount-large' : '', className]
    .filter(Boolean)
    .join(' ');
  if (zeroAs && Number.isFinite(n) && n === 0) {
    return <span className={classes}>{zeroAs}</span>;
  }
  return (
    <span className={classes}>
      {formatMoney(value, { symbol: symbol ?? CURRENCY_SYMBOL, showSign })}
    </span>
  );
};

export default MoneyText;

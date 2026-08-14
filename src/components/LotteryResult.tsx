import { GameResultDisplay } from './ResultBall';

interface RawResult {
  digits?: unknown;
  drawResult?: unknown;
  result?: unknown;
  number?: unknown;
  positions?: unknown;
  prizes?: { first?: unknown };
}

export const resultDigits = (raw: unknown): string => {
  if (raw == null) return '';
  let r: unknown = raw;
  if (typeof raw === 'string') {
    try {
      r = JSON.parse(raw);
    } catch {
      return raw.replace(/[^0-9]/g, '');
    }
  }
  if (r == null) return '';
  const o = r as RawResult;
  if (Array.isArray(o.digits)) return o.digits.join('');
  if (o.drawResult != null) return String(o.drawResult);
  if (o.result != null && typeof o.result !== 'object') return String(o.result);
  if (o.number != null) return String(o.number);
  if (Array.isArray(o.positions)) return o.positions.join('');
  if (o.prizes?.first != null) return String(o.prizes.first);
  return '';
};

interface LotteryResultProps {
  gameType: string;
  result: unknown;
  size?: number;
  slatLabels?: string[];
  positionColors?: string[];
  themeColor?: string;
}

export const LotteryResult = ({
  gameType,
  result,
  size = 22,
  slatLabels,
  positionColors,
  themeColor,
}: LotteryResultProps) => (
  <GameResultDisplay
    gameType={gameType}
    result={result}
    size={size}
    slatLabels={slatLabels}
    positionColors={positionColors}
    themeColor={themeColor}
  />
);

export default LotteryResult;

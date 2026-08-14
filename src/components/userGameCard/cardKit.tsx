import { useEffect, useRef, useState } from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatMonthDayTime } from '../../utils/format';

export const GAME_INITIAL_PLACEHOLDER = '?';

export const gameInitial = (gameName: string): string => {
  const initial = gameName.charAt(0).toUpperCase();
  return initial ? initial : GAME_INITIAL_PLACEHOLDER;
};

export interface UserGame {
  id: number;
  gameName: string;
  gameType: string;
  gameCode: string;
  status: number;
  isPaused?: number;
  isHidden?: number;
  emergencyStop?: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  themeColor?: string;
  bgColor?: string;
  sellingPrice?: number;
  drawInterval?: number;
  countDown?: number;
  drawTime?: string | null;
  drawDue?: boolean;
  nextDrawTime?: string | null;
  isManual?: boolean;
  currentRound?: {
    roundNo?: string;
    drawTime?: string;
    status?: number;
  } | null;
  configJson?: {
    maxPrize?: string;
    quick?: boolean;
  } | null;
}

export const DIN = "'DIN Alternate','DIN',-apple-system,'Segoe UI',Roboto,sans-serif";

export const gameArt = (g: UserGame): string => {
  const art = g.iconUrl || g.bannerUrl || g.thumbnailUrl;
  return art ? art : '';
};
export const ticketPrice = (g: UserGame) => Number(g.sellingPrice ?? 0);
export const maxPrizeOf = (g: UserGame): string => {
  const maxPrize = g.configJson?.maxPrize;
  return maxPrize ? maxPrize : '';
};
export const isQuick = (g: UserGame) => !!g.configJson?.quick;

export const tickListeners = new Set<() => void>();
let tickStarted = false;
let tickNow = Date.now();
export const ensureClock = () => {
  if (tickStarted || typeof window === 'undefined') return;
  tickStarted = true;
  setInterval(() => {
    tickNow = Date.now();
    tickListeners.forEach((fn) => fn());
  }, 1000);
};
export const useSharedTick = () => {
  const [, force] = useState(0);
  useEffect(() => {
    ensureClock();
    const fn = () => force((x) => (x + 1) & 0xffff);
    tickListeners.add(fn);
    return () => {
      tickListeners.delete(fn);
    };
  }, []);
  return tickNow;
};

export const CountdownPill = ({
  seconds = 0,
  loop = 0,
  showDay = false,
  size = 12,
}: {
  seconds?: number;
  loop?: number;
  showDay?: boolean;
  size?: number;
}) => {
  const now = useSharedTick();
  const endRef = useRef(now + seconds * 1000);
  const seedRef = useRef(seconds);
  if (seedRef.current !== seconds) {
    seedRef.current = seconds;
    endRef.current = now + seconds * 1000;
  }
  let left = Math.round((endRef.current - now) / 1000);
  while (left <= 0 && loop > 0) {
    endRef.current += loop * 1000;
    left = Math.round((endRef.current - now) / 1000);
  }
  if (left < 0) left = 0;
  const d = Math.floor(left / 86400);
  const h = Math.floor(left / 3600) % (showDay ? 24 : Infinity);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const Unit = ({ v, u }: { v: number; u: string }) => (
    <>
      <span style={{ color: '#fff' }}>{pad(v)}</span>
      <span
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
          margin: '0 2px 0 1px',
        }}
      >
        {u}
      </span>
    </>
  );
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 5,
        padding: '2px 6px',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.2,
        fontFamily: DIN,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {showDay && d > 0 && <Unit v={d} u="d" />}
      <Unit v={h} u="h" />
      <Unit v={m} u="m" />
      <Unit v={s} u="s" />
    </div>
  );
};

export const formatDrawTime = (iso?: string | null): string => {
  if (!iso) return '';
  const formatted = formatMonthDayTime(iso);
  return formatted === '—' ? '' : formatted;
};

export const DrawDueChip = ({
  nextDrawTime,
  due = false,
  size = 12,
}: {
  nextDrawTime?: string | null;
  due?: boolean;
  size?: number;
}) => {
  const label = formatDrawTime(nextDrawTime);
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: due ? 'rgba(217,119,6,0.85)' : 'rgba(37,99,235,0.85)',
        borderRadius: 5,
        padding: '2px 7px',
        lineHeight: 1.25,
        fontFamily: DIN,
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: size,
          fontWeight: 800,
          letterSpacing: 0.3,
        }}
      >
        {due ? 'DRAW DUE' : 'MANUAL'}
      </span>
      {label && (
        <span
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: Math.max(8, size - 3),
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export const DrawTimer = ({ g, size }: { g: UserGame; size?: number }) =>
  g.isManual || g.drawDue ? (
    <DrawDueChip nextDrawTime={g.nextDrawTime} due={!!g.drawDue} size={size} />
  ) : (
    <CountdownPill
      seconds={g.countDown}
      loop={g.drawInterval}
      size={size}
    />
  );

export const PlayBtn = ({
  label = 'PLAY',
  wide = false,
}: {
  label?: string;
  wide?: boolean;
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      color: '#000',
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 12,
      height: 20,
      padding: wide ? '0 12px' : '0 10px',
      minWidth: 50,
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    }}
  >
    {label}
  </span>
);

export const PriceTicket = ({
  price,
  align = 'right',
}: {
  price: number;
  align?: 'left' | 'right';
}) => (
  <div
    style={{
      fontSize: 9,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: 700,
      textAlign: align,
    }}
  >
    <span style={{ color: '#fff', fontSize: 11 }}>₹{price}</span>/Ticket
  </div>
);

export const Art = ({
  g,
  style,
  fit = 'cover',
}: {
  g: UserGame;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
}) => {
  const src = resolveAssetUrl(gameArt(g));
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      style={{ objectFit: fit, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
};

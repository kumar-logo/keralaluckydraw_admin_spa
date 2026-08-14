import { typeName } from '../../utils/gameTypes';
import { orDash } from '../../utils/format';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
  gameInitial,
  DIN,
  gameArt,
  ticketPrice,
  maxPrizeOf,
  isQuick,
  CountdownPill,
  DrawDueChip,
  DrawTimer,
  PlayBtn,
  PriceTicket,
  Art,
  type UserGame,
} from './cardKit';

const ThreeDigitCard = ({ g }: { g: UserGame }) => (
  <div
    style={{
      background:
        g.themeColor ||
        g.bgColor ||
        'linear-gradient(to bottom,#8C5BFF,#4400B1)',
      borderRadius: 10,
      padding: 8,
      height: 108,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#fff',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <Art
        g={g}
        fit="contain"
        style={{ height: 50, maxWidth: '55%', borderRadius: 6 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 700,
          }}
        >
          WIN PRIZE
        </span>
        <span style={{ fontSize: 15, fontWeight: 900, fontFamily: DIN }}>
          {orDash(maxPrizeOf(g))}
        </span>
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
          {g.isManual
            ? 'Manual Draw'
            : g.drawDue
              ? 'Awaiting Draw'
              : isQuick(g)
                ? 'Next Draw'
                : 'New Draw'}
        </span>
        <DrawTimer g={g} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        <PriceTicket price={ticketPrice(g)} />
        <PlayBtn />
      </div>
    </div>
  </div>
);

const DubaiCard = ({ g }: { g: UserGame }) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      height: 104,
      color: '#fff',
    }}
  >
    <Art
      g={g}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to top,rgba(0,0,0,0.55),rgba(0,0,0,0) 55%)',
      }}
    />
    <div
      style={{
        position: 'relative',
        height: '100%',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {g.gameName}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700 }}>
            {g.isManual
              ? 'Manual Draw'
              : g.drawDue
                ? 'Awaiting Draw'
                : g.gameCode === 'P1Q' || isQuick(g)
                  ? '30S Draw'
                  : 'Hourly Draw'}
          </span>
          <DrawTimer g={g} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <PriceTicket price={ticketPrice(g)} align="left" />
          <PlayBtn label="Play Now" wide />
        </div>
      </div>
    </div>
  </div>
);

const FiveDigitCard = ({ g }: { g: UserGame }) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      height: 112,
      color: '#fff',
      background:
        g.themeColor ||
        g.bgColor ||
        'linear-gradient(to top,rgba(0,0,0,0.45),rgba(0,0,0,0) 60%)',
    }}
  >
    <Art
      g={g}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to top,rgba(0,0,0,0.45),rgba(0,0,0,0) 60%)',
      }}
    />
    <div
      style={{
        position: 'relative',
        height: '100%',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 900,
          fontFamily: DIN,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {g.gameName}
      </span>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <PriceTicket price={ticketPrice(g)} align="left" />
        <DrawTimer g={g} />
      </div>
    </div>
  </div>
);

const MYSTERY_GRADIENTS = [
  'linear-gradient(180deg,#FFB889,#C34F02)',
  'linear-gradient(180deg,#C4DBFF,#5386D8)',
  'linear-gradient(180deg,#E5BFF1,#A356BB)',
  'linear-gradient(180deg,#BFE7A7,#599A31)',
  'linear-gradient(180deg,#F6DB9B,#CAA03C)',
  'linear-gradient(180deg,#FBCFB4,#C26930)',
  'linear-gradient(180deg,#E9EDB6,#9EA810)',
  'linear-gradient(180deg,#F9C0C0,#C13B3B)',
];
const MysteryBoxCard = ({ g, index }: { g: UserGame; index: number }) => (
  <div
    style={{
      background:
        g.themeColor ||
        g.bgColor ||
        MYSTERY_GRADIENTS[index % MYSTERY_GRADIENTS.length],
      borderRadius: 10,
      padding: 8,
      height: 112,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <div
      style={{
        height: 62,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={resolveAssetUrl(g.bannerUrl || gameArt(g))}
        alt=""
        loading="lazy"
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
    </div>
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 2,
        background: 'linear-gradient(to bottom,#fff,rgba(255,255,255,0.6))',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 6,
        height: 24,
        color: '#000',
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      ₹{ticketPrice(g)}
      <span style={{ fontSize: 8, fontWeight: 400 }}>/Ticket</span>
    </div>
  </div>
);

const QUICK_THEME: Record<string, string> = {
  color: 'linear-gradient(135deg,#10b981,#0d9488)',
  dice: 'linear-gradient(135deg,#6366f1,#4f46e5)',
  race: 'linear-gradient(135deg,#f59e0b,#ea580c)',
  cash_rain: 'linear-gradient(135deg,#ec4899,#be123c)',
};

const DEFAULT_POSTER_THEME = 'linear-gradient(135deg,#0891b2,#22d3ee)';

const PosterCard = ({ g }: { g: UserGame }) => {
  const theme =
    g.themeColor ||
    g.bgColor ||
    QUICK_THEME[g.gameType] ||
    DEFAULT_POSTER_THEME;
  const cd = g.countDown;
  const src = resolveAssetUrl(gameArt(g));
  const prize = maxPrizeOf(g);
  return (
    <div
      style={{
        position: 'relative',
        height: 112,
        borderRadius: 10,
        overflow: 'hidden',
        background: theme,
        color: '#fff',
        padding: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
          flexShrink: 0,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.18)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            style={{
              width: '86%',
              height: '86%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        ) : (
          <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            {gameInitial(g.gameName)}
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px 0 2px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {g.gameName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 1,
            }}
          >
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
              {typeName(g.gameType)}
            </span>
            {prize && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#FFE08A' }}>
                · {prize}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {g.isManual || g.drawDue ? (
            <DrawDueChip
              nextDrawTime={g.nextDrawTime}
              due={!!g.drawDue}
              size={11}
            />
          ) : cd !== undefined && cd > 0 ? (
            <CountdownPill seconds={cd} loop={g.drawInterval} size={11} />
          ) : (
            <span />
          )}
          {ticketPrice(g) > 0 && <PriceTicket price={ticketPrice(g)} />}
        </div>
      </div>
    </div>
  );
};

export const CardForType = ({ g, index }: { g: UserGame; index: number }) => {
  switch (g.gameType) {
    case 'three_digit':
    case 'kerala':
      return <ThreeDigitCard g={g} />;
    case 'dubai':
      return <DubaiCard g={g} />;
    case 'four_five_digit':
      return <FiveDigitCard g={g} />;
    case 'mystery_box':
    case 'lucky_spin':
      return <MysteryBoxCard g={g} index={index} />;
    default:
      return <PosterCard g={g} />;
  }
};

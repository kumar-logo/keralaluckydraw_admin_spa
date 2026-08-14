import { useState } from 'react';
import { GameTypeKey } from './AdminBetContentRenderer';
import { CardForType } from './userGameCard/cards';
import type { UserGame } from './userGameCard/cardKit';

export { CardForType } from './userGameCard/cards';
export { gameArt } from './userGameCard/cardKit';
export type { UserGame } from './userGameCard/cardKit';

const statusBadge = (g: UserGame): { text: string; color: string } | null => {
  if (g.emergencyStop === 1) return { text: 'E-STOP', color: '#ef4444' };
  if (g.isPaused === 1) return { text: 'PAUSED', color: '#f59e0b' };
  if (g.status !== 1) return { text: 'DISABLED', color: '#64748b' };
  if (g.isHidden === 1) return { text: 'HIDDEN', color: '#64748b' };
  return null;
};

const HideToggleButton = ({
  hidden,
  busy,
  onToggle,
}: {
  hidden: boolean;
  busy: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    disabled={busy}
    title={hidden ? 'Show game to players' : 'Hide game from players'}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    style={{
      position: 'absolute',
      top: 6,
      left: 6,
      zIndex: 6,
      border: 'none',
      cursor: busy ? 'wait' : 'pointer',
      background: hidden ? '#16a34a' : 'rgba(0,0,0,0.6)',
      color: '#fff',
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 0.4,
      padding: '3px 8px',
      borderRadius: 999,
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      opacity: busy ? 0.6 : 1,
    }}
  >
    {hidden ? 'SHOW' : 'HIDE'}
  </button>
);

const StopToggleButton = ({
  stopped,
  busy,
  onToggle,
}: {
  stopped: boolean;
  busy: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    disabled={busy}
    title={stopped ? 'Resume game for players' : 'Stop game for players'}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    style={{
      position: 'absolute',
      bottom: 6,
      left: 6,
      zIndex: 6,
      border: 'none',
      cursor: busy ? 'wait' : 'pointer',
      background: stopped ? '#16a34a' : '#ef4444',
      color: '#fff',
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 0.4,
      padding: '3px 8px',
      borderRadius: 999,
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      opacity: busy ? 0.6 : 1,
    }}
  >
    {stopped ? 'RESUME' : 'STOP'}
  </button>
);

export const UserGameCard = ({
  game,
  index = 0,
  onClick,
  onToggleHidden,
  onToggleStop,
}: {
  game: UserGame;
  index?: number;
  onClick?: () => void;
  onToggleHidden?: (game: UserGame) => Promise<void> | void;
  onToggleStop?: (game: UserGame) => Promise<void> | void;
}) => {
  const badge = statusBadge(game);
  const dimmed = !!badge && badge.text !== 'HIDDEN';
  const [busy, setBusy] = useState(false);
  const [stopBusy, setStopBusy] = useState(false);
  const hidden = game.isHidden === 1;
  const stopped = game.emergencyStop === 1;
  const isMysteryBox = game.gameType === GameTypeKey.MysteryBox;
  const handleToggle = async () => {
    if (!onToggleHidden || busy) return;
    setBusy(true);
    try {
      await onToggleHidden(game);
    } finally {
      setBusy(false);
    }
  };
  const handleToggleStop = async () => {
    if (!onToggleStop || stopBusy) return;
    setStopBusy(true);
    try {
      await onToggleStop(game);
    } finally {
      setStopBusy(false);
    }
  };
  return (
    <div
      onClick={onClick}
      title={`${game.gameName} • ${game.gameCode}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 10,
        transition: 'transform .15s, box-shadow .15s',
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        opacity: dimmed ? 0.62 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)';
      }}
    >
      <CardForType g={game} index={index} />
      {onToggleHidden && (
        <HideToggleButton
          hidden={hidden}
          busy={busy}
          onToggle={handleToggle}
        />
      )}
      {onToggleStop && isMysteryBox && (
        <StopToggleButton
          stopped={stopped}
          busy={stopBusy}
          onToggle={handleToggleStop}
        />
      )}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: badge.color,
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.4,
            padding: '2px 7px',
            borderRadius: 999,
            zIndex: 5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {badge.text}
        </div>
      )}
    </div>
  );
};

export default UserGameCard;

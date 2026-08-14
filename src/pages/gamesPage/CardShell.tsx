import { GAME_INITIAL_PLACEHOLDER } from './gamesPageShared';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const CardShell = ({
  img,
  theme,
  onClick,
  title,
  badge,
  cornerTag,
  name,
  sub,
}: {
  img?: string;
  theme: string;
  onClick: () => void;
  title: string;
  badge?: string;
  cornerTag?: React.ReactNode;
  name: string;
  sub: React.ReactNode;
}) => (
  <div
    onClick={onClick}
    title={title}
    style={{
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      cursor: 'pointer',
      background: theme,
      aspectRatio: '3 / 4',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      transition: 'transform .15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    {img ? (
      <img
        src={resolveAssetUrl(img)}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    ) : (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 800,
          color: '#fff',
        }}
      >
        {name.charAt(0).toUpperCase()
          ? name.charAt(0).toUpperCase()
          : GAME_INITIAL_PLACEHOLDER}
      </div>
    )}
    {badge && (
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 20,
        }}
      >
        {badge}
      </div>
    )}
    {cornerTag && (
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1,
        }}
      >
        {cornerTag}
      </div>
    )}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '22px 10px 10px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 3,
          color: 'rgba(255,255,255,0.85)',
          fontSize: 11,
        }}
      >
        {sub}
      </div>
    </div>
  </div>
);


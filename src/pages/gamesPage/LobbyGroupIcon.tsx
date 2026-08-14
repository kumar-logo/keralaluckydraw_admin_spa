import { AppstoreOutlined } from '@ant-design/icons';
import { LOBBY_SPRITE_SCALE, type LobbySprite } from './gamesPageShared';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const LobbyGroupIcon = ({
  filterType,
  sprite,
  imgUrl,
}: {
  filterType?: string;
  sprite: LobbySprite | null;
  imgUrl?: string;
}) => {
  const p = filterType && sprite ? sprite.pos[filterType] : undefined;
  if (sprite?.url && p) {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          flexShrink: 0,
          backgroundColor: '#0f172a',
          backgroundImage: `url(${resolveAssetUrl(sprite.url)})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${sprite.width * LOBBY_SPRITE_SCALE}px ${sprite.height * LOBBY_SPRITE_SCALE}px`,
          backgroundPosition: `-${p.x * LOBBY_SPRITE_SCALE}px -${p.y * LOBBY_SPRITE_SCALE}px`,
        }}
      />
    );
  }
  if (imgUrl) {
    return (
      <img
        src={resolveAssetUrl(imgUrl)}
        alt=""
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          flexShrink: 0,
          objectFit: 'cover',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        flexShrink: 0,
        background: 'rgba(8,145,178,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppstoreOutlined style={{ color: 'var(--text-muted)' }} />
    </div>
  );
};

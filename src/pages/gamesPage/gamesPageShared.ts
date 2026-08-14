export const FALLBACK_THEMES = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#be123c)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
];

export const gameDetailPath = (g: { id: number; gameType: string }) => {
  switch (g.gameType) {
    case 'dice':
      return `/games/dice/${g.id}`;
    case 'color':
      return `/games/color/${g.id}`;
    case 'race':
      return `/games/race/${g.id}`;
    case 'lucky_spin':
      return `/games/lucky-spin/${g.id}`;
    case 'mystery_box':
      return `/games/mystery-box/${g.id}`;
    case 'dubai':
      return `/games/dubai/${g.id}`;
    case 'cash_rain':
      return `/games/cash-rain/${g.id}`;
    default:
      return `/games/${g.id}/detail`;
  }
};

export enum FamilyAction {
  Stop = 'emergency-stop',
  Resume = 'emergency-resume',
}

export interface GameRecord {
  id: number;
  gameName: string;
  gameType: string;
  gameCode: string;
  gameUid?: string | null;
  status: number;
  isPaused: number;
  isHidden: number;
  emergencyStop: number;
  isThirdParty: number;
  iconUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  lobbyIconUrl?: string;
  themeColor?: string;
  bgColor?: string;
  sellingPrice?: number;
  drawInterval?: number;
  countDown?: number;
  drawTime?: string | null;
  currentRound?: {
    roundNo?: string;
    drawTime?: string;
    status?: number;
  } | null;
  configJson?: { maxPrize?: string } | null;
}

export interface GamesListResponse {
  list: GameRecord[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface LobbySpriteProvider {
  filterType?: string;
  bigIconX: number;
  bigIconY: number;
}

export interface LobbySpriteResponse {
  providers?: LobbySpriteProvider[];
  config?: {
    filterIcon?: string;
    filterWidth?: number;
    filterHeight?: number;
  };
}

export const DEFAULT_SPRITE_WIDTH = 518;
export const DEFAULT_SPRITE_HEIGHT = 794;
export const GAME_INITIAL_PLACEHOLDER = '?';

export const GAME_CREATE_ITEMS: { key: string; label: string; route: string }[] = [
  { key: 'color', label: 'Colour Prediction', route: '/games/create/color' },
  { key: 'dice', label: 'Dice', route: '/games/create/dice' },
  { key: 'race', label: 'Run & Guess', route: '/games/create/race' },
  { key: 'mystery-box', label: 'Mystery Box', route: '/games/create/mystery-box' },
  { key: 'lucky-spin', label: 'Lucky Spin', route: '/games/create/lucky-spin' },
  { key: 'cash-rain', label: 'Cash Rain', route: '/games/create/cash-rain' },
];

export const SECTION_CREATE_ROUTE: Record<string, string> = {
  color: '/games/create/color',
  dice: '/games/create/dice',
  race: '/games/create/race',
  mystery_box: '/games/create/mystery-box',
  lucky_spin: '/games/create/lucky-spin',
  cash_rain: '/games/create/cash-rain',
};

export const sectionCreateRoute = (types: string[]): string | null => {
  for (const t of types) {
    if (SECTION_CREATE_ROUTE[t]) return SECTION_CREATE_ROUTE[t];
  }
  return null;
};

export const SECTION_DEFS: { title: string; icon: string; types: string[] }[] = [
  { title: 'Colour Prediction', icon: '', types: ['color'] },
  { title: 'Dice', icon: '', types: ['dice'] },
  { title: 'Run & Guess', icon: '', types: ['race'] },
  { title: 'Mystery Box', icon: '', types: ['mystery_box'] },
  { title: 'Lucky Spin', icon: '', types: ['lucky_spin'] },
  { title: 'Cash Rain', icon: '', types: ['cash_rain'] },
];

export const SECTION_FILTER_TYPE: Record<string, string> = {
  color: 'WinGo',
  dice: 'K3',
  race: 'Run&Guess',
  mystery_box: 'BonusGames',
  lucky_spin: 'BonusGames',
  cash_rain: 'BonusGames',
};

export const LOBBY_SPRITE_SCALE = 0.6;

export interface LobbySprite {
  url: string;
  width: number;
  height: number;
  pos: Record<string, { x: number; y: number }>;
}

export const cardImg = (g: Partial<GameRecord>) =>
  g.bannerUrl || g.thumbnailUrl || g.iconUrl;
export const cardTheme = (g: Partial<GameRecord>, seed = 0) =>
  g.themeColor || g.bgColor || FALLBACK_THEMES[seed % FALLBACK_THEMES.length];

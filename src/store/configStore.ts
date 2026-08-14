import { create } from 'zustand';
import api from '../services/api';

export interface GameTypeOption {
  value: string;
  label: string;
  isLottery: boolean;
  iconUrl: string | null;
  emoji: string;
  themeColor: string | null;
}

export interface StatusEntry {
  text: string;
  color: string;
}

export interface GroupedConfig {
  id: number;
  key: string;
  value: string;
  description: string;
  type: string;
  label: string;
  sortOrder: number;
}

interface ConfigMetaResponse {
  appName: string;
  gameTypes: GameTypeOption[];
  lotteryColors: Record<string, string>;
  statusMaps: Record<string, Record<number, StatusEntry>>;
  intervalPresets: { value: number; label: string }[];
  prizeTierOptions: string[];
  positionColors: string[];
  positionGradients: { from: string; to: string }[];
}

interface ConfigState {
  loaded: boolean;
  appName: string;
  gameTypes: GameTypeOption[];
  lotteryTypes: GameTypeOption[];
  gameOnlyTypes: GameTypeOption[];
  lotteryColors: Record<string, string>;
  statusMaps: Record<string, Record<number, StatusEntry>>;
  intervalPresets: { value: number; label: string }[];
  prizeTierOptions: string[];
  positionColors: string[];
  positionGradients: { from: string; to: string }[];
  groupedConfigs: Record<string, GroupedConfig[]>;
  fetchConfig: () => Promise<void>;
  fetchGroupedConfigs: () => Promise<void>;
  getStatusEntry: (mapKey: string, status: number) => StatusEntry;
  getGameTypeColor: (gameType: string) => string;
  getGameTypeEmoji: (gameType: string) => string;
  isLotteryType: (gameType: string) => boolean;
}

const DEFAULT_STATUS: StatusEntry = { text: 'Unknown', color: 'default' };
const GAME_TYPE_FALLBACK_COLOR = '#94a3b8';
const LOTTERY_FALLBACK_COLOR = '#0891b2';
const GAME_TYPE_FALLBACK_EMOJI = '🎮';

export const useConfigStore = create<ConfigState>((set, get) => ({
  loaded: false,
  appName: '',
  gameTypes: [],
  lotteryTypes: [],
  gameOnlyTypes: [],
  lotteryColors: {},
  statusMaps: {},
  intervalPresets: [],
  prizeTierOptions: [],
  positionColors: [],
  positionGradients: [],
  groupedConfigs: {},

  fetchConfig: async () => {
    if (get().loaded) return;
    try {
      const res = await api.get<unknown, ConfigMetaResponse>('config/meta');
      const gameTypes = res.gameTypes;
      set({
        loaded: true,
        appName: res.appName,
        gameTypes,
        lotteryTypes: gameTypes.filter((t) => t.isLottery),
        gameOnlyTypes: gameTypes.filter((t) => !t.isLottery),
        lotteryColors: res.lotteryColors,
        statusMaps: res.statusMaps,
        intervalPresets: res.intervalPresets,
        prizeTierOptions: res.prizeTierOptions,
        positionColors: res.positionColors,
        positionGradients: res.positionGradients,
      });
    } catch {
      set({ loaded: true });
    }
  },

  fetchGroupedConfigs: async () => {
    try {
      const res = await api.get<unknown, Record<string, GroupedConfig[]>>(
        'config/grouped',
      );
      set({ groupedConfigs: res });
    } catch (err) {
      console.debug('Failed to fetch grouped configs', err);
    }
  },

  getStatusEntry: (mapKey: string, status: number) => {
    const map = get().statusMaps[mapKey];
    const entry = map ? map[status] : undefined;
    return entry ? entry : DEFAULT_STATUS;
  },

  getGameTypeColor: (gameType: string) => {
    const gt = get().gameTypes.find((t) => t.value === gameType);
    if (!gt) return GAME_TYPE_FALLBACK_COLOR;
    if (gt.themeColor) return gt.themeColor;
    const lotteryColor = get().lotteryColors[gt.label];
    return lotteryColor ? lotteryColor : LOTTERY_FALLBACK_COLOR;
  },

  getGameTypeEmoji: (gameType: string) => {
    const gt = get().gameTypes.find((t) => t.value === gameType);
    return gt ? gt.emoji : GAME_TYPE_FALLBACK_EMOJI;
  },

  isLotteryType: (gameType: string) => {
    return get().lotteryTypes.some((t) => t.value === gameType);
  },
}));

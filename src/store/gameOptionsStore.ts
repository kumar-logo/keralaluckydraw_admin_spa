import { create } from 'zustand';
import api from '../services/api';

export type GameScope = 'all' | 'in_house' | 'lottery';

export interface GameOption {
  id: number;
  name: string;
  gameType: string;
  isLottery: number;
  isThirdParty: number;
}

interface ScopeState {
  loaded: boolean;
  loading: boolean;
  options: GameOption[];
}

interface GameOptionsState {
  byScope: Record<GameScope, ScopeState>;
  fetchOptions: (scope: GameScope) => Promise<void>;
}

const emptyScope = (): ScopeState => ({
  loaded: false,
  loading: false,
  options: [],
});

export const useGameOptionsStore = create<GameOptionsState>((set, get) => ({
  byScope: {
    all: emptyScope(),
    in_house: emptyScope(),
    lottery: emptyScope(),
  },
  fetchOptions: async (scope: GameScope) => {
    const current = get().byScope[scope];
    if (current.loaded || current.loading) return;
    set((state) => ({
      byScope: {
        ...state.byScope,
        [scope]: { ...state.byScope[scope], loading: true },
      },
    }));
    try {
      const options = (await api.post('games/options', {
        scope,
      })) as unknown as GameOption[];
      set((state) => ({
        byScope: {
          ...state.byScope,
          [scope]: { loaded: true, loading: false, options },
        },
      }));
    } catch {
      set((state) => ({
        byScope: {
          ...state.byScope,
          [scope]: { ...state.byScope[scope], loading: false },
        },
      }));
    }
  },
}));

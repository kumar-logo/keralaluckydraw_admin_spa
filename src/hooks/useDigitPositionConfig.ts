import { useEffect, useState } from 'react';
import api from '../services/api';
import type { RaceRunner } from '../components/RaceBadges';

export interface DigitPositionEntry {
  colors: string[];
  labels: string[];
  numberColors: Record<string, string[]>;
  palette: Record<string, string>;
  themeColor: string | null;
  raceRunners: RaceRunner[];
}

type DigitPositionMap = Record<number, DigitPositionEntry>;

const EMPTY_ENTRY: DigitPositionEntry = {
  colors: [],
  labels: [],
  numberColors: {},
  palette: {},
  themeColor: null,
  raceRunners: [],
};

const EMPTY_MAP: DigitPositionMap = {};

let cache: DigitPositionMap | null = null;
let inflight: Promise<DigitPositionMap> | null = null;
const subscribers = new Set<(map: DigitPositionMap) => void>();

const fetchMap = (): Promise<DigitPositionMap> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = api
    .get<unknown, DigitPositionMap>('games/digit-position-config')
    .then((res) => {
      cache = res;
      inflight = null;
      subscribers.forEach((fn) => fn(cache as DigitPositionMap));
      return cache;
    })
    .catch(() => {
      cache = {};
      inflight = null;
      subscribers.forEach((fn) => fn(cache as DigitPositionMap));
      return cache;
    });
  return inflight;
};

export const getDigitPositionEntry = (
  gameId: number | string | null | undefined,
): DigitPositionEntry => {
  if (!cache || gameId == null) return EMPTY_ENTRY;
  return cache[Number(gameId)] ?? EMPTY_ENTRY;
};

export const useDigitPositionConfig = (): {
  get: (gameId: number | string | null | undefined) => DigitPositionEntry;
  ready: boolean;
} => {
  const [map, setMap] = useState<DigitPositionMap>(cache ?? EMPTY_MAP);
  const [ready, setReady] = useState<boolean>(cache != null);

  useEffect(() => {
    let active = true;
    const onUpdate = (next: DigitPositionMap) => {
      if (!active) return;
      setMap(next);
      setReady(true);
    };
    subscribers.add(onUpdate);
    void fetchMap().then((next) => onUpdate(next));
    return () => {
      active = false;
      subscribers.delete(onUpdate);
    };
  }, []);

  const get = (gameId: number | string | null | undefined): DigitPositionEntry => {
    if (gameId == null) return EMPTY_ENTRY;
    return map[Number(gameId)] ?? EMPTY_ENTRY;
  };

  return { get, ready };
};

export default useDigitPositionConfig;

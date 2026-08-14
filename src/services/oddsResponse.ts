interface OddsEnvelope<T> {
  gameId?: number;
  odds?: T[];
  list?: T[];
}

const isEnvelope = <T>(v: unknown): v is OddsEnvelope<T> =>
  typeof v === 'object' && v !== null;

export const toOddsRows = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!isEnvelope<T>(value)) return [];
  if (Array.isArray(value.odds)) return value.odds;
  if (Array.isArray(value.list)) return value.list;
  return [];
};

export const TYPE_NAMES: Record<string, string> = {
  color: 'Colour Prediction',
  dice: 'Dice',
  race: 'Run & Guess',
  three_digit: '3 Digit',
  four_five_digit: '4 & 5 Digit',
  dubai: 'Dubai',
  kerala: 'Kerala',
  mystery_box: 'Mystery Box',
  lucky_spin: 'Lucky Spin',
  cash_rain: 'Cash Rain',
};

export const typeName = (t: string) =>
  TYPE_NAMES[t] ||
  (t ? t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Game');

const BET_TYPE_WORDS: Record<string, string> = {
  big: 'Big',
  small: 'Small',
  odd: 'Odd',
  even: 'Even',
  red: 'Red',
  green: 'Green',
  violet: 'Violet',
  number: 'Number',
  color: 'Colour',
  ticket: 'Ticket',
  ticket_insured: 'Insured',
  ticket_regular: 'Regular',
  regular: 'Regular',
  insured: 'Insured',
  champion: 'Champion',
  top3: 'Top 3',
  group: 'Group',
};

export const betTypeLabel = (raw: unknown): string => {
  if (raw === null || raw === undefined) return '-';
  const value = String(raw).trim();
  if (!value) return '-';

  const lower = value.toLowerCase();
  if (BET_TYPE_WORDS[lower]) return BET_TYPE_WORDS[lower];

  const prefixMatch = value.match(/^(?:number|p\d+b|p\d+|bet)_(.+)$/i);
  if (prefixMatch) {
    const rest = prefixMatch[1];
    const restLower = rest.toLowerCase();
    if (BET_TYPE_WORDS[restLower]) return BET_TYPE_WORDS[restLower];
    return rest;
  }

  if (/^x?[A-E]{1,5}$/.test(value)) return value;

  if (value.includes('_')) {
    return value
      .split('_')
      .map((part) => {
        const partLower = part.toLowerCase();
        if (BET_TYPE_WORDS[partLower]) return BET_TYPE_WORDS[partLower];
        if (/^x?[A-E]{1,5}$/.test(part)) return part;
        if (/^\d+$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }

  return value;
};

export const ON_DEMAND_GAME_TYPES = new Set<string>([
  'lucky_spin',
  'mystery_box',
  'cash_rain',
]);

export const isOnDemandGame = (gameType: string): boolean =>
  ON_DEMAND_GAME_TYPES.has(gameType);

export const FAMILY_OPTIONS = [
  { value: 'color', label: 'Colour & Number' },
  { value: 'dice', label: 'Dice' },
  { value: 'single_digit', label: 'Single Digit (Dubai)' },
  { value: 'digit3', label: '3 Digit' },
  { value: 'digit5', label: '4 & 5 Digit' },
  { value: 'race', label: 'Run & Guess' },
  { value: 'lottery', label: 'Kerala Lottery' },
];

export const sampleResult = (
  gameType: string,
  colorMap?: Record<string, string[]>,
): Record<string, number | number[] | string> => {
  switch (gameType) {
    case 'color':
      return { number: 7 };
    case 'dice':
      return { dice: [3, 5, 2] };
    case 'kerala':
      return { drawResult: '123456' };
    case 'three_digit':
      return { digits: [1, 2, 3] };
    case 'four_five_digit':
      return { digits: [1, 2, 3, 4, 5] };
    case 'dubai':
      return { digits: [7] };
    case 'race':
    case 'cash_rain':
      return { positions: [3, 1, 4, 2, 5] };
    default:
      return colorMap ? { number: 0 } : { number: 0 };
  }
};

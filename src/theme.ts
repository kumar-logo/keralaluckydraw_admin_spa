const getCSSVar = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return val || fallback;
};

export const CHART_COLORS = [
  () => getCSSVar('--chart-1', '#6366f1'),
  () => getCSSVar('--chart-2', '#10b981'),
  () => getCSSVar('--chart-3', '#f59e0b'),
  () => getCSSVar('--chart-4', '#ef4444'),
  () => getCSSVar('--chart-5', '#8b5cf6'),
  () => getCSSVar('--chart-6', '#06b6d4'),
  () => getCSSVar('--chart-7', '#ec4899'),
  () => getCSSVar('--chart-8', '#f97316'),
];

export const getChartColors = (): string[] => CHART_COLORS.map((fn) => fn());

export const themeColor = {
  success: () => getCSSVar('--success', '#10b981'),
  danger: () => getCSSVar('--danger', '#ef4444'),
  warning: () => getCSSVar('--warning', '#f59e0b'),
  info: () => getCSSVar('--info', '#3b82f6'),
  primary: () => getCSSVar('--primary', '#0891b2'),
  purple: () => getCSSVar('--color-purple', '#8b5cf6'),
  indigo: () => getCSSVar('--color-indigo', '#6366f1'),
  cyan: () => getCSSVar('--color-cyan', '#06b6d4'),
  pink: () => getCSSVar('--color-pink', '#ec4899'),
  orange: () => getCSSVar('--color-orange', '#f97316'),
  approve: () => getCSSVar('--color-approve', '#059669'),
};

export const GAME_COLORS = {
  red: () => getCSSVar('--game-color-red', '#be0000'),
  green: () => getCSSVar('--game-color-green', '#109216'),
  violet: () => getCSSVar('--game-color-violet', '#670fbf'),
};

export const K3_COLORS = {
  big: () => getCSSVar('--k3-big', '#e20000'),
  small: () => getCSSVar('--k3-small', '#0090e2'),
  green: () => getCSSVar('--k3-green', '#02921b'),
  odd: () => getCSSVar('--k3-odd', '#b91010'),
  even: () => getCSSVar('--k3-even', '#176be3'),
};

export const POSITION_COLORS = [
  () => getCSSVar('--pos-1', '#D50000'),
  () => getCSSVar('--pos-2', '#0087D4'),
  () => getCSSVar('--pos-3', '#BD6600'),
  () => getCSSVar('--pos-4', '#008B59'),
];

export const FIVED_COLORS: Record<string, () => string> = {
  A: () => getCSSVar('--fived-a', '#BE0000'),
  B: () => getCSSVar('--fived-b', '#FF8A00'),
  C: () => getCSSVar('--fived-c', '#007CEF'),
  D: () => getCSSVar('--fived-d', '#00B209'),
  E: () => getCSSVar('--fived-e', '#00C7CE'),
};

export const RACE_COLORS = [
  () => getCSSVar('--race-kerala', '#00B92B'),
  () => getCSSVar('--race-tamil', '#D80000'),
  () => getCSSVar('--race-mp', '#F5D000'),
  () => getCSSVar('--race-mh', '#DB7500'),
  () => getCSSVar('--race-ka', '#B800D0'),
  () => getCSSVar('--race-nl', '#0012D4'),
];

export const getPositionColors = (): string[] =>
  POSITION_COLORS.map((fn) => fn());
export const getRaceColors = (): string[] => RACE_COLORS.map((fn) => fn());

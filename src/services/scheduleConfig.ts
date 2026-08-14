export interface ScheduleConfigRaw {
  config?: {
    roundDuration?: number;
    stopBetBefore?: number;
    drawDelay?: number;
    autoGenerate?: boolean;
  };
  drawInterval?: number;
}

export interface ScheduleConfigForm {
  drawInterval: number;
  stopBetBefore: number;
  drawDelay: number;
  autoGenerate: boolean;
}

const DEFAULT_DRAW_INTERVAL = 60;
const DEFAULT_STOP_BET_BEFORE = 10;
const DEFAULT_DRAW_DELAY = 5;

const firstNumber = (...values: (number | undefined)[]): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && value > 0) return value;
  }
  return undefined;
};

export const toScheduleConfigForm = (raw: ScheduleConfigRaw): ScheduleConfigForm => {
  const config = raw.config;
  return {
    drawInterval:
      firstNumber(config?.roundDuration, raw.drawInterval) ?? DEFAULT_DRAW_INTERVAL,
    stopBetBefore:
      typeof config?.stopBetBefore === 'number'
        ? config.stopBetBefore
        : DEFAULT_STOP_BET_BEFORE,
    drawDelay:
      typeof config?.drawDelay === 'number' ? config.drawDelay : DEFAULT_DRAW_DELAY,
    autoGenerate: config?.autoGenerate !== false,
  };
};

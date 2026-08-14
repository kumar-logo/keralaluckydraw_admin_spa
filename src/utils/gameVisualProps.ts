import { GameTypeKey } from '../components/AdminBetContentRenderer';
import type { RaceRunner } from '../components/RaceBadges';
import type { DigitPositionEntry } from '../hooks/useDigitPositionConfig';

export interface GameVisualProps {
  positionColors?: string[];
  slatLabels?: string[];
  numberColors?: Record<string, string[]>;
  palette?: Record<string, string>;
  themeColor?: string;
  raceRunners?: RaceRunner[];
}

export const gameVisualProps = (
  gameType: string,
  entry: DigitPositionEntry,
): GameVisualProps => {
  switch (gameType) {
    case GameTypeKey.ThreeDigit:
    case GameTypeKey.FourFiveDigit:
      return { positionColors: entry.colors, slatLabels: entry.labels };
    case GameTypeKey.Color:
      return { numberColors: entry.numberColors, palette: entry.palette };
    case GameTypeKey.Dubai:
      return {
        themeColor: entry.themeColor !== null ? entry.themeColor : undefined,
      };
    case GameTypeKey.Race:
      return { raceRunners: entry.raceRunners };
    default:
      return {};
  }
};

export default gameVisualProps;

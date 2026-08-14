import { RaceRunner, RaceTop3Result } from './RaceBadges';

const SINGLE_RUNNER_COUNT = 6;
const TOP3_COUNT = 3;

interface RaceResultProps {
  positions: number[];
  single?: boolean;
  raceRunners?: RaceRunner[] | null;
}

const RaceResult = ({ positions, single, raceRunners }: RaceResultProps) => {
  if (!positions || !Array.isArray(positions) || positions.length === 0) {
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  }

  const top3 = positions.slice(0, TOP3_COUNT);
  const isSingle =
    single ?? Math.max(...positions) <= SINGLE_RUNNER_COUNT;

  return (
    <RaceTop3Result top3={top3} single={isSingle} raceRunners={raceRunners} />
  );
};

export default RaceResult;

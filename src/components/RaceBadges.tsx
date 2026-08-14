import { CSSProperties, memo } from 'react';

export interface RaceRunner {
  name: string;
  nameShort: string;
  colorHex: string;
  spriteKey: string | null;
}

export const RACE_SPRITE_IMAGE = '/images/race/effect.webp';

const SPRITE_SHEET_WIDTH = 13.25;
const SPRITE_SHEET_HEIGHT = 10.75;

const STATE_COLORS = [
  '#00B92B',
  '#D80000',
  '#F5D000',
  '#DB7500',
  '#B800D0',
  '#0012D4',
];

const STATE_SPRITE_NAMES = [
  'kerala',
  'tamil',
  'madhya',
  'maharashtra',
  'karnataka',
  'nagaland',
];

const PLAYER_SPRITE_NAMES = [
  'keralaPlayer',
  'tamilPlayer',
  'madhyaPlayer',
  'maharashtraPlayer',
  'karnatakaPlayer',
  'nagalandPlayer',
];

const RANK_SPRITE_NAMES = ['rankTop1', 'rankTop2', 'rankTop3'];

const SPRITE_POSITIONS: Record<string, [number, number]> = {
  kerala: [0, 7.25],
  tamil: [2, 7.25],
  madhya: [4, 7.25],
  maharashtra: [6, 7.25],
  karnataka: [8, 7.25],
  nagaland: [10, 7.25],
  keralaPlayer: [0, 5.25],
  tamilPlayer: [2, 5.25],
  madhyaPlayer: [4, 5.25],
  maharashtraPlayer: [6, 5.25],
  karnatakaPlayer: [8, 5.25],
  nagalandPlayer: [10, 5.25],
  rankTop1: [3.75, 9.25],
  rankTop2: [5.25, 9.25],
  rankTop3: [6.75, 9.25],
};

const RUNNER_NUMBER_FONT_REM = 0.5;
const RUNNER_NUMBER_LINE_REM = 0.625;
const RUNNER_NUMBER_WIDTH_REM = 1;
const RUNNER_NUMBER_OFFSET_REM = 0.5;
const RUNNER_NUMBER_BOTTOM_REM = -0.125;
const RUNNER_NUMBER_RADIUS_REM = 0.25;
const PLAYER_BADGE_PADDING_REM = 0.125;

const REM_TO_PX = 16;

export const getRunnerState = (
  runnerNum: number,
  isSingle: boolean,
  runnerCount = 6,
): number =>
  isSingle
    ? runnerNum - 1
    : Math.floor((runnerNum - 1) / 2) % Math.max(runnerCount, 1);

const runnerColor = (
  state: number,
  raceRunners?: RaceRunner[] | null,
): string =>
  raceRunners?.[state]?.colorHex ?? STATE_COLORS[state % STATE_COLORS.length];

const spriteStyle = (
  spriteKey: string,
  scale: number,
  sideRem: number,
): CSSProperties => {
  const [x, y] = SPRITE_POSITIONS[spriteKey] ?? [0, 0];
  return {
    width: sideRem + 'rem',
    height: sideRem + 'rem',
    backgroundImage: `url(${RACE_SPRITE_IMAGE})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${SPRITE_SHEET_WIDTH * scale}rem ${SPRITE_SHEET_HEIGHT * scale}rem`,
    backgroundPosition: `${-x * scale}rem ${-y * scale}rem`,
  };
};

export const RankBadge = memo(
  ({ no, size = 24 }: { no: number; size?: number }) => {
    const scale = size / 24;
    const sideRem = size / REM_TO_PX;
    const spriteKey = RANK_SPRITE_NAMES[no] ?? RANK_SPRITE_NAMES[0];
    return <div style={spriteStyle(spriteKey, scale, sideRem)} />;
  },
);

const GroupSprite = memo(
  ({
    state,
    size,
    isPlayer,
  }: {
    state: number;
    size: number;
    isPlayer: boolean;
  }) => {
    const scale = size / 32;
    const sideRem = size / REM_TO_PX;
    const list = isPlayer ? PLAYER_SPRITE_NAMES : STATE_SPRITE_NAMES;
    const spriteKey = list[state] ?? list[0];
    return <div style={spriteStyle(spriteKey, scale, sideRem)} />;
  },
);

export const GroupBadge = memo(
  ({ state, size = 24 }: { state: number; size?: number }) => (
    <GroupSprite state={state} size={size} isPlayer={false} />
  ),
);

export const PlayerBadge = memo(
  ({
    state,
    size = 20,
    raceRunners,
  }: {
    state: number;
    size?: number;
    raceRunners?: RaceRunner[] | null;
  }) => {
    const sideRem = size / REM_TO_PX + 0.25;
    return (
      <div
        style={{
          padding: PLAYER_BADGE_PADDING_REM + 'rem',
          borderRadius: '9999px',
          width: sideRem + 'rem',
          height: sideRem + 'rem',
          backgroundColor: runnerColor(state, raceRunners),
          boxSizing: 'border-box',
        }}
      >
        <GroupSprite state={state} size={size} isPlayer />
      </div>
    );
  },
);

export const RaceTop3Result = ({
  top3,
  single,
  raceRunners,
}: {
  top3: number[];
  single: boolean;
  raceRunners?: RaceRunner[] | null;
}) => {
  if (!top3.length) {
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  }
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', columnGap: '0.5rem' }}
    >
      {top3.map((runnerNo, rank) => {
        const state = getRunnerState(runnerNo, single);
        return (
          <span
            key={runnerNo}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <RankBadge no={rank} />
            <span style={{ position: 'relative' }}>
              <PlayerBadge size={20} state={state} raceRunners={raceRunners} />
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  marginLeft: -RUNNER_NUMBER_OFFSET_REM + 'rem',
                  bottom: RUNNER_NUMBER_BOTTOM_REM + 'rem',
                  width: RUNNER_NUMBER_WIDTH_REM + 'rem',
                  textAlign: 'center',
                  color: '#ffffff',
                  fontSize: RUNNER_NUMBER_FONT_REM + 'rem',
                  lineHeight: RUNNER_NUMBER_LINE_REM + 'rem',
                  fontWeight: 700,
                  borderRadius: RUNNER_NUMBER_RADIUS_REM + 'rem',
                  backgroundColor: runnerColor(state, raceRunners),
                }}
              >
                {runnerNo}
              </span>
            </span>
          </span>
        );
      })}
      {!single && <GroupBadge size={20} state={getRunnerState(top3[0], false)} />}
    </span>
  );
};

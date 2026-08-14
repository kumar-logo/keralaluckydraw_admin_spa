import { useEffect, useMemo } from 'react';
import { Select } from 'antd';
import {
  useGameOptionsStore,
  type GameScope,
  type GameOption,
} from '../store/gameOptionsStore';
import { typeName } from '../utils/gameTypes';

interface GameSelectProps {
  value: number[] | undefined;
  onChange: (value: number[]) => void;
  scope?: GameScope;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const GameSelect = ({
  value,
  onChange,
  scope = 'all',
  placeholder = 'Filter by Game',
  style,
  disabled,
}: GameSelectProps) => {
  const { byScope, fetchOptions } = useGameOptionsStore();
  const scopeState = byScope[scope];

  useEffect(() => {
    void fetchOptions(scope);
  }, [scope, fetchOptions]);

  const options = useMemo(() => {
    const toOption = (g: GameOption) => ({
      value: g.id,
      label: `${g.name} · ${typeName(g.gameType)}`,
      search: `${g.name} ${g.gameType} ${typeName(g.gameType)} ${g.id}`.toLowerCase(),
    });
    const lotteries = scopeState.options.filter((g) => g.isLottery === 1);
    const games = scopeState.options.filter(
      (g) => g.isLottery !== 1 && g.isThirdParty !== 1,
    );
    const thirdParty = scopeState.options.filter((g) => g.isThirdParty === 1);
    const groups: {
      label: string;
      title: string;
      options: ReturnType<typeof toOption>[];
    }[] = [];
    if (lotteries.length)
      groups.push({
        label: `Lotteries (${lotteries.length})`,
        title: 'Lotteries',
        options: lotteries.map(toOption),
      });
    if (games.length)
      groups.push({
        label: `Games (${games.length})`,
        title: 'Games',
        options: games.map(toOption),
      });
    if (thirdParty.length)
      groups.push({
        label: `Third Party (${thirdParty.length})`,
        title: 'Third Party',
        options: thirdParty.map(toOption),
      });
    return groups;
  }, [scopeState.options]);

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      maxTagCount="responsive"
      loading={scopeState.loading}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      value={value}
      onChange={(vals) => onChange(vals as number[])}
      options={options}
      filterOption={(input, option) =>
        ((option as { search?: string })?.search ?? '').includes(
          input.toLowerCase(),
        )
      }
    />
  );
};

export default GameSelect;

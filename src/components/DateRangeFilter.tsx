import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { DATE_FORMAT } from '../utils/format';

const { RangePicker } = DatePicker;

export interface DateRangeValue {
  startDate?: string;
  endDate?: string;
}

interface DateRangeFilterProps {
  value: [Dayjs, Dayjs] | null;
  onChange: (range: [Dayjs, Dayjs] | null) => void;
  style?: React.CSSProperties;
}

export const rangeToDates = (
  range: [Dayjs, Dayjs] | null,
): DateRangeValue => ({
  startDate: range && range[0] ? range[0].format(DATE_FORMAT) : undefined,
  endDate: range && range[1] ? range[1].format(DATE_FORMAT) : undefined,
});

const DateRangeFilter = ({ value, onChange, style }: DateRangeFilterProps) => (
  <RangePicker
    style={{ width: '100%', ...style }}
    value={value}
    onChange={(range) => onChange(range as [Dayjs, Dayjs] | null)}
    placeholder={['Start Date', 'End Date']}
  />
);

export default DateRangeFilter;

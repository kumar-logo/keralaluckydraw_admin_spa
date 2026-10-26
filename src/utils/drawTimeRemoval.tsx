import { Modal } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const DRAW_TIME_FORMAT = 'DD MMM YYYY, hh:mm A';

const secondKey = (d: Dayjs): number => Math.floor(d.valueOf() / 1000);

const toDrawTimeList = (value: unknown): Dayjs[] =>
  Array.isArray(value)
    ? value.filter((d): d is Dayjs => dayjs.isDayjs(d) && d.isValid())
    : [];

export const liveDrawTimes = (times: string[] | null | undefined): Dayjs[] =>
  Array.isArray(times) ? toDrawTimeList(times.map((t) => dayjs(t))) : [];

export const removedDrawTimes = (
  initial: Dayjs[],
  current: unknown,
): Dayjs[] => {
  const kept = new Set(toDrawTimeList(current).map(secondKey));
  const now = dayjs();
  return initial.filter((d) => d.isAfter(now) && !kept.has(secondKey(d)));
};

export const confirmDrawTimeRemoval = (removed: Dayjs[]): Promise<boolean> => {
  if (removed.length === 0) return Promise.resolve(true);
  return new Promise((resolve) => {
    Modal.confirm({
      title: `Delete ${removed.length} draw${removed.length === 1 ? '' : 's'}?`,
      width: 460,
      okText: 'Delete & Save',
      okButtonProps: { danger: true },
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            These draw times were removed. Their rounds will be deleted:
          </p>
          <ul style={{ paddingLeft: 18, marginBottom: 8 }}>
            {removed.map((d) => (
              <li key={d.valueOf()}>{d.format(DRAW_TIME_FORMAT)}</li>
            ))}
          </ul>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            A draw that already sold tickets cannot be deleted here — cancel it
            in Draw Management so the tickets are refunded.
          </p>
        </div>
      ),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

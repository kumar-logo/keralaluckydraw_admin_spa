import { useEffect, useState, useCallback } from 'react';
import { Button, Space, Row, Col, message, Card, Switch, InputNumber, TimePicker, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';
import { minutesToDayjs, dayjsToMinutes, type CashRainWindowRow } from './gameShared';

const CashRainWindowsTab = ({ gameId }: { gameId: number }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [windows, setWindows] = useState<CashRainWindowRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get(`games/${gameId}/cashrain-windows`)) as {
        windows?: CashRainWindowRow[];
      };
      setWindows(
        (res.windows || []).map((w) => ({
          dayStart: w.dayStart ?? 1,
          dayEnd: w.dayEnd ?? 31,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          maxClaimsPerUser: w.maxClaimsPerUser ?? 1,
          status: w.status,
        })),
      );
    } catch {
      message.error('Failed to load active windows');
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    load();
  }, [load]);

  const setRow = (i: number, patch: Partial<CashRainWindowRow>) =>
    setWindows((list) => list.map((w, j) => (j === i ? { ...w, ...patch } : w)));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`games/${gameId}/cashrain-windows`, {
        windows: windows.map((w) => ({
          dayStart: w.dayStart,
          dayEnd: w.dayEnd,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          maxClaimsPerUser: w.maxClaimsPerUser,
          status: w.status,
        })),
      });
      message.success('Active windows saved');
      load();
    } catch {
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader cards={1} />;

  return (
    <Card style={{ borderRadius: 12, maxWidth: 860 }}>
      <Alert
        type={windows.length === 0 ? 'warning' : 'info'}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          windows.length === 0
            ? 'No active windows — Cash Rain is currently CLOSED'
            : 'Cash Rain is playable only during these windows'
        }
        description="Times are India Standard Time (IST). Each window runs on the given days of the month and clock range; players can join only inside an active window. Claims / user caps how many Cash Rain rewards one player may take inside a single window (set 0 to fully block). Outside every window — and when no window is configured or all are switched Off — the Start button is disabled and shows the next slot. Example schedule: days 1–7 run 6 slots/day, days 8–31 run 3 slots/day. A window may cross midnight (e.g. 23:00 – 00:59)."
      />
      {windows.length > 0 && (
        <Row
          gutter={8}
          style={{
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <Col xs={7} md={6}>
            Days of month (1–31)
          </Col>
          <Col xs={9} md={9}>
            Active time (IST)
          </Col>
          <Col xs={3} md={3}>
            Claims / user
          </Col>
          <Col xs={3} md={4}>
            Status
          </Col>
          <Col xs={2} />
        </Row>
      )}
      {windows.map((w, i) => (
        <Row key={i} gutter={8} align="middle" style={{ marginBottom: 8 }}>
          <Col xs={7} md={6}>
            <Space size={4} align="center">
              <InputNumber
                min={1}
                max={31}
                value={w.dayStart}
                onChange={(v) => setRow(i, { dayStart: Number(v ?? 1) })}
                style={{ width: 56 }}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <InputNumber
                min={1}
                max={31}
                value={w.dayEnd}
                onChange={(v) => setRow(i, { dayEnd: Number(v ?? 31) })}
                style={{ width: 56 }}
              />
            </Space>
          </Col>
          <Col xs={9} md={9}>
            <Space size={4} align="center">
              <TimePicker
                format="HH:mm"
                minuteStep={1}
                allowClear={false}
                needConfirm={false}
                value={minutesToDayjs(w.startMinute)}
                onChange={(d) => setRow(i, { startMinute: dayjsToMinutes(d) })}
                style={{ width: 88 }}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <TimePicker
                format="HH:mm"
                minuteStep={1}
                allowClear={false}
                needConfirm={false}
                value={minutesToDayjs(w.endMinute)}
                onChange={(d) => setRow(i, { endMinute: dayjsToMinutes(d) })}
                style={{ width: 88 }}
              />
            </Space>
          </Col>
          <Col xs={3} md={3}>
            <InputNumber
              min={0}
              max={9999}
              value={w.maxClaimsPerUser}
              onChange={(v) => setRow(i, { maxClaimsPerUser: Number(v ?? 1) })}
              style={{ width: 64 }}
            />
          </Col>
          <Col xs={3} md={4}>
            <Switch
              checked={w.status === 1}
              checkedChildren="On"
              unCheckedChildren="Off"
              onChange={(c) => setRow(i, { status: c ? 1 : 0 })}
            />
          </Col>
          <Col xs={2}>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setWindows((l) => l.filter((_, j) => j !== i))}
            />
          </Col>
        </Row>
      ))}
      <Space style={{ marginTop: 8 }}>
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            setWindows((l) => [
              ...l,
              {
                dayStart: 1,
                dayEnd: 31,
                startMinute: 540,
                endMinute: 599,
                maxClaimsPerUser: 1,
                status: 1,
              },
            ])
          }
        >
          Add Window
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Windows
        </Button>
      </Space>
    </Card>
  );
};

export default CashRainWindowsTab;

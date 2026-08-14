import { useState, useEffect } from 'react';
import {
  Table,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  message,
  Tabs,
} from 'antd';
import {
  BgColorsOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from '../components/PageHeader';

interface UiConfigData {
  spriteScale: number;
  catLottery: number;
  catCasino: number;
  catSlot: number;
  catLobby: number;
  catLive: number;
  catFishing: number;
}
interface StatusRow {
  domain: string;
  status: number;
  text: string;
  color: string;
}
interface PositionRow {
  color: string;
  gradientFrom: string;
  gradientTo: string;
}
interface PayRateRow {
  odds: number;
  type: number;
}
interface GradientRow {
  gradient: string;
}
interface TabRow {
  key: string;
  label: string;
}

interface UiConfigResponse {
  config?: Partial<UiConfigData> & Record<string, unknown>;
  statusMap?: StatusRow[];
  positions?: PositionRow[];
  payRates?: PayRateRow[];
  gradients?: GradientRow[];
  resultTabs?: TabRow[];
}

const DOMAIN_OPTIONS = ['round', 'order', 'recharge', 'withdraw'].map((d) => ({
  label: d,
  value: d,
}));

const DEFAULT_COLOR_INPUT = '#000000';

const isHex = (v: string): boolean => /^#([0-9a-fA-F]{3}){1,2}$/.test(v);

const ColorField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span
      style={{
        display: 'inline-block',
        width: 22,
        height: 22,
        borderRadius: 4,
        border: '1px solid var(--border, #d9d9d9)',
        background: isHex(value) ? value : 'transparent',
      }}
    />
    <Input
      type={isHex(value) || value === '' ? 'color' : 'text'}
      value={value ? value : DEFAULT_COLOR_INPUT}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 60, padding: 2 }}
    />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="#hex or token"
      style={{ flex: 1 }}
    />
  </div>
);

const delBtn = (onClick: () => void) => (
  <Button danger size="small" icon={<DeleteOutlined />} onClick={onClick} />
);

const DEFAULT_UI_CONFIG: UiConfigData = {
  spriteScale: 0.75,
  catLottery: 1,
  catCasino: 5,
  catSlot: 6,
  catLobby: 1020,
  catLive: 1025,
  catFishing: 1026,
};

const numericOrDefault = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : fallback;
};

const nullableNumber = (value: number | null, fallback: number): number =>
  value === null ? fallback : value;

const UiConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<UiConfigData>(DEFAULT_UI_CONFIG);
  const [statusMap, setStatusMap] = useState<StatusRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [payRates, setPayRates] = useState<PayRateRow[]>([]);
  const [gradients, setGradients] = useState<GradientRow[]>([]);
  const [resultTabs, setResultTabs] = useState<TabRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<unknown, UiConfigResponse>('ui-config');
      if (r.config) {
        const c = r.config;
        setConfig({
          spriteScale: numericOrDefault(
            c.spriteScale,
            DEFAULT_UI_CONFIG.spriteScale,
          ),
          catLottery: numericOrDefault(
            c.catLottery,
            DEFAULT_UI_CONFIG.catLottery,
          ),
          catCasino: numericOrDefault(c.catCasino, DEFAULT_UI_CONFIG.catCasino),
          catSlot: numericOrDefault(c.catSlot, DEFAULT_UI_CONFIG.catSlot),
          catLobby: numericOrDefault(c.catLobby, DEFAULT_UI_CONFIG.catLobby),
          catLive: numericOrDefault(c.catLive, DEFAULT_UI_CONFIG.catLive),
          catFishing: numericOrDefault(
            c.catFishing,
            DEFAULT_UI_CONFIG.catFishing,
          ),
        });
      }
      const statusRows = Array.isArray(r.statusMap) ? r.statusMap : [];
      const positionRows = Array.isArray(r.positions) ? r.positions : [];
      const payRateRows = Array.isArray(r.payRates) ? r.payRates : [];
      const gradientRows = Array.isArray(r.gradients) ? r.gradients : [];
      const tabRows = Array.isArray(r.resultTabs) ? r.resultTabs : [];
      setStatusMap(
        statusRows.map((x) => ({
          domain: x.domain,
          status: x.status,
          text: x.text,
          color: x.color,
        })),
      );
      setPositions(
        positionRows.map((x) => ({
          color: x.color,
          gradientFrom: x.gradientFrom,
          gradientTo: x.gradientTo,
        })),
      );
      setPayRates(
        payRateRows.map((x) => ({
          odds: Number(x.odds),
          type: x.type,
        })),
      );
      setGradients(gradientRows.map((x) => ({ gradient: x.gradient })));
      setResultTabs(tabRows.map((x) => ({ key: x.key, label: x.label })));
    } catch {
      message.error('Failed to load UI config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('ui-config', {
        config,
        statusMap,
        positions: positions.map((r, i) => ({ ...r, sortOrder: i })),
        payRates: payRates.map((r, i) => ({ ...r, sortOrder: i })),
        gradients: gradients.map((r, i) => ({ ...r, sortOrder: i })),
        resultTabs: resultTabs.map((r, i) => ({ ...r, sortOrder: i })),
      });
      message.success('UI config saved');
      load();
    } catch (e) {
      message.error(getApiErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  function upd<T>(setter: React.Dispatch<React.SetStateAction<T[]>>) {
    return (i: number, key: keyof T, val: unknown) =>
      setter((prev) =>
        prev.map((r, x) => (x === i ? { ...r, [key]: val } : r)),
      );
  }
  function del<T>(arr: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) {
    return (i: number) => () => setter(arr.filter((_, x) => x !== i));
  }

  const uStatus = upd(setStatusMap);
  const uPos = upd(setPositions);
  const uPay = upd(setPayRates);
  const uGrad = upd(setGradients);
  const uTab = upd(setResultTabs);

  const statusCols: ColumnsType<StatusRow> = [
    {
      title: 'Domain',
      width: 140,
      render: (_, r, i) => (
        <Select
          value={r.domain}
          options={DOMAIN_OPTIONS}
          onChange={(v) => uStatus(i, 'domain', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Status',
      width: 90,
      render: (_, r, i) => (
        <InputNumber
          value={r.status}
          min={0}
          onChange={(v) => uStatus(i, 'status', nullableNumber(v, 0))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Text',
      render: (_, r, i) => (
        <Input
          value={r.text}
          onChange={(e) => uStatus(i, 'text', e.target.value)}
        />
      ),
    },
    {
      title: 'Color',
      width: 280,
      render: (_, r, i) => (
        <ColorField
          value={r.color}
          onChange={(v) => uStatus(i, 'color', v)}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => delBtn(del(statusMap, setStatusMap)(i)),
    },
  ];
  const posCols: ColumnsType<PositionRow> = [
    {
      title: 'Color',
      render: (_, r, i) => (
        <ColorField value={r.color} onChange={(v) => uPos(i, 'color', v)} />
      ),
    },
    {
      title: 'Gradient From',
      render: (_, r, i) => (
        <ColorField
          value={r.gradientFrom}
          onChange={(v) => uPos(i, 'gradientFrom', v)}
        />
      ),
    },
    {
      title: 'Gradient To',
      render: (_, r, i) => (
        <ColorField
          value={r.gradientTo}
          onChange={(v) => uPos(i, 'gradientTo', v)}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => delBtn(del(positions, setPositions)(i)),
    },
  ];
  const payCols: ColumnsType<PayRateRow> = [
    {
      title: 'Odds',
      render: (_, r, i) => (
        <InputNumber
          value={r.odds}
          step={0.01}
          onChange={(v) => uPay(i, 'odds', nullableNumber(v, 0))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Type',
      render: (_, r, i) => (
        <InputNumber
          value={r.type}
          onChange={(v) => uPay(i, 'type', nullableNumber(v, 0))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => delBtn(del(payRates, setPayRates)(i)),
    },
  ];
  const gradCols: ColumnsType<GradientRow> = [
    {
      title: 'CSS Gradient',
      render: (_, r, i) => (
        <Input
          value={r.gradient}
          onChange={(e) => uGrad(i, 'gradient', e.target.value)}
        />
      ),
    },
    {
      title: 'Preview',
      width: 140,
      render: (_, r) => (
        <div
          style={{
            width: '100%',
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--border, #d9d9d9)',
            background: r.gradient ? r.gradient : 'transparent',
          }}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => delBtn(del(gradients, setGradients)(i)),
    },
  ];
  const tabCols: ColumnsType<TabRow> = [
    {
      title: 'Key',
      render: (_, r, i) => (
        <Input value={r.key} onChange={(e) => uTab(i, 'key', e.target.value)} />
      ),
    },
    {
      title: 'Label',
      render: (_, r, i) => (
        <Input
          value={r.label}
          onChange={(e) => uTab(i, 'label', e.target.value)}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => delBtn(del(resultTabs, setResultTabs)(i)),
    },
  ];

  const tableTab = <T extends object>(
    key: string,
    label: string,
    cols: ColumnsType<T>,
    data: T[],
    onAdd: () => void,
  ) => ({
    key,
    label: `${label} (${data.length})`,
    children: (
      <Card variant="borderless">
        <Table<T>
          rowKey={(_, i) => `${key}${i}`}
          columns={cols}
          dataSource={data}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content', y: 460 }}
        />
        <Button
          icon={<PlusOutlined />}
          style={{ marginTop: 12 }}
          onClick={onAdd}
        >
          Add Row
        </Button>
      </Card>
    ),
  });

  const tabItems = [
    {
      key: 'config',
      label: 'Categories & Scale',
      children: (
        <Card variant="borderless">
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <div style={{ marginBottom: 4 }}>Sprite Scale</div>
              <InputNumber
                value={config.spriteScale}
                step={0.05}
                min={0}
                onChange={(v) =>
                  setConfig({ ...config, spriteScale: nullableNumber(v, DEFAULT_UI_CONFIG.spriteScale) })
                }
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div style={{ marginBottom: 4 }}>Lottery Category ID</div>
              <InputNumber
                value={config.catLottery}
                onChange={(v) => setConfig({ ...config, catLottery: nullableNumber(v, DEFAULT_UI_CONFIG.catLottery) })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div style={{ marginBottom: 4 }}>Casino Category ID</div>
              <InputNumber
                value={config.catCasino}
                onChange={(v) => setConfig({ ...config, catCasino: nullableNumber(v, DEFAULT_UI_CONFIG.catCasino) })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <div style={{ marginBottom: 4 }}>Slot Category ID</div>
              <InputNumber
                value={config.catSlot}
                onChange={(v) => setConfig({ ...config, catSlot: nullableNumber(v, DEFAULT_UI_CONFIG.catSlot) })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Lobby Category ID</div>
              <InputNumber
                value={config.catLobby}
                onChange={(v) => setConfig({ ...config, catLobby: nullableNumber(v, DEFAULT_UI_CONFIG.catLobby) })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Live Category ID</div>
              <InputNumber
                value={config.catLive}
                onChange={(v) => setConfig({ ...config, catLive: nullableNumber(v, DEFAULT_UI_CONFIG.catLive) })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Fishing Category ID</div>
              <InputNumber
                value={config.catFishing}
                onChange={(v) =>
                  setConfig({ ...config, catFishing: nullableNumber(v, DEFAULT_UI_CONFIG.catFishing) })
                }
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>
      ),
    },
    tableTab<StatusRow>('status', 'Status Maps', statusCols, statusMap, () =>
      setStatusMap([
        ...statusMap,
        { domain: 'round', status: 0, text: '', color: '' },
      ]),
    ),
    tableTab<PositionRow>('positions', 'Positions', posCols, positions, () =>
      setPositions([
        ...positions,
        { color: '', gradientFrom: '', gradientTo: '' },
      ]),
    ),
    tableTab<PayRateRow>('payrates', 'Pay Rates', payCols, payRates, () =>
      setPayRates([...payRates, { odds: 0, type: 0 }]),
    ),
    tableTab<GradientRow>('grads', 'Box Gradients', gradCols, gradients, () =>
      setGradients([...gradients, { gradient: '' }]),
    ),
    tableTab<TabRow>('tabs', 'Result Tabs', tabCols, resultTabs, () =>
      setResultTabs([...resultTabs, { key: '', label: '' }]),
    ),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="UI / Display Configuration"
        subtitle="Colour maps, status badges, race/lottery styling & home render config"
        icon={<BgColorsOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={loading}
            onClick={handleSave}
          >
            Save
          </Button>
        }
      />
      <Tabs items={tabItems} />
    </div>
  );
};

export default UiConfigPage;

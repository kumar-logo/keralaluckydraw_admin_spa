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
  AppstoreOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getApiErrorMessage } from '../utils/apiError';

const DEFAULT_FILTER_WIDTH = 518;
const DEFAULT_FILTER_HEIGHT = 794;

const numberOrZero = (value: number | null): number =>
  value === null ? 0 : value;

interface LobbySectionRow {
  scope: string;
  filterType: string;
  filterName: string;
  rows: number | null;
}

interface LobbyProviderRow {
  categoryId: number | null;
  filterType: string;
  filterName: string;
  bigIconX: number;
  bigIconY: number;
  iconX: number;
  iconY: number;
}

interface LobbyConfigData {
  filterIcon: string;
  lightIcon: string;
  filterWidth: number;
  filterHeight: number;
}

const SPRITE_PREVIEW_SCALE = 0.75;

const SCOPE_OPTIONS = [
  { label: 'Lobby', value: 'lobby' },
  { label: 'Lottery', value: 'lottery' },
];

const CATEGORY_OPTIONS = [
  { label: 'Main (Lobby)', value: 'main' },
  { label: 'Casino (5)', value: '5' },
  { label: 'Slot (6)', value: '6' },
  { label: 'Live (1025)', value: '1025' },
  { label: 'Fishing (1026)', value: '1026' },
];

const catToUi = (c: number | null): string =>
  c === null || c === undefined ? 'main' : String(c);
const catFromUi = (v: string): number | null =>
  v === 'main' ? null : Number(v);

const LobbyConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LobbyConfigData>({
    filterIcon: '',
    lightIcon: '',
    filterWidth: 518,
    filterHeight: 794,
  });
  const [sections, setSections] = useState<LobbySectionRow[]>([]);
  const [providers, setProviders] = useState<LobbyProviderRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res: {
        config?: LobbyConfigData;
        sections?: LobbySectionRow[];
        providers?: LobbyProviderRow[];
      } = await api.get('lobby-config');
      if (res.config)
        setConfig({
          filterIcon: res.config.filterIcon,
          lightIcon: res.config.lightIcon,
          filterWidth: res.config.filterWidth,
          filterHeight: res.config.filterHeight,
        });
      const sectionRows = Array.isArray(res.sections) ? res.sections : [];
      const providerRows = Array.isArray(res.providers) ? res.providers : [];
      setSections(
        sectionRows.map((s) => ({
          scope: s.scope,
          filterType: s.filterType,
          filterName: s.filterName,
          rows: s.rows,
        })),
      );
      setProviders(
        providerRows.map((p) => ({
          categoryId: p.categoryId,
          filterType: p.filterType,
          filterName: p.filterName,
          bigIconX: p.bigIconX,
          bigIconY: p.bigIconY,
          iconX: p.iconX,
          iconY: p.iconY,
        })),
      );
    } catch {
      message.error('Failed to load lobby config');
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
      await api.post('lobby-config', {
        config,
        sections: sections.map((s, i) => ({ ...s, sortOrder: i })),
        providers: providers.map((p, i) => ({ ...p, sortOrder: i })),
      });
      message.success('Lobby config saved');
      load();
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (i: number, key: keyof LobbySectionRow, val: unknown) =>
    setSections((prev) =>
      prev.map((r, x) => (x === i ? { ...r, [key]: val } : r)),
    );
  const updateProvider = (
    i: number,
    key: keyof LobbyProviderRow,
    val: unknown,
  ) =>
    setProviders((prev) =>
      prev.map((r, x) => (x === i ? { ...r, [key]: val } : r)),
    );

  const sectionColumns: ColumnsType<LobbySectionRow> = [
    {
      title: 'Scope',
      width: 120,
      render: (_, r, i) => (
        <Select
          value={r.scope}
          options={SCOPE_OPTIONS}
          onChange={(v) => updateSection(i, 'scope', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Filter Type',
      render: (_, r, i) => (
        <Input
          value={r.filterType}
          onChange={(e) => updateSection(i, 'filterType', e.target.value)}
        />
      ),
    },
    {
      title: 'Display Name',
      render: (_, r, i) => (
        <Input
          value={r.filterName}
          onChange={(e) => updateSection(i, 'filterName', e.target.value)}
        />
      ),
    },
    {
      title: 'Rows',
      width: 90,
      render: (_, r, i) => (
        <InputNumber
          value={r.rows}
          min={0}
          onChange={(v) => updateSection(i, 'rows', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setSections(sections.filter((_, x) => x !== i))}
        />
      ),
    },
  ];

  const providerColumns: ColumnsType<LobbyProviderRow> = [
    {
      title: 'Icon',
      width: 64,
      render: (_, r) =>
        config.filterIcon ? (
          <div
            title={`x ${r.bigIconX}, y ${r.bigIconY}`}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              backgroundColor: '#0f172a',
              backgroundImage: `url(${resolveAssetUrl(config.filterIcon)})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${config.filterWidth * SPRITE_PREVIEW_SCALE}px ${config.filterHeight * SPRITE_PREVIEW_SCALE}px`,
              backgroundPosition: `-${r.bigIconX * SPRITE_PREVIEW_SCALE}px -${r.bigIconY * SPRITE_PREVIEW_SCALE}px`,
            }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      title: 'Category',
      width: 140,
      render: (_, r, i) => (
        <Select
          value={catToUi(r.categoryId)}
          options={CATEGORY_OPTIONS}
          onChange={(v) => updateProvider(i, 'categoryId', catFromUi(v))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Filter Type',
      render: (_, r, i) => (
        <Input
          value={r.filterType}
          onChange={(e) => updateProvider(i, 'filterType', e.target.value)}
        />
      ),
    },
    {
      title: 'Display Name',
      render: (_, r, i) => (
        <Input
          value={r.filterName}
          onChange={(e) => updateProvider(i, 'filterName', e.target.value)}
        />
      ),
    },
    {
      title: 'Big X',
      width: 80,
      render: (_, r, i) => (
        <InputNumber
          value={r.bigIconX}
          onChange={(v) => updateProvider(i, 'bigIconX', numberOrZero(v))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Big Y',
      width: 80,
      render: (_, r, i) => (
        <InputNumber
          value={r.bigIconY}
          onChange={(v) => updateProvider(i, 'bigIconY', numberOrZero(v))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Icon X',
      width: 80,
      render: (_, r, i) => (
        <InputNumber
          value={r.iconX}
          onChange={(v) => updateProvider(i, 'iconX', numberOrZero(v))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Icon Y',
      width: 80,
      render: (_, r, i) => (
        <InputNumber
          value={r.iconY}
          onChange={(v) => updateProvider(i, 'iconY', numberOrZero(v))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, _r, i) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setProviders(providers.filter((_, x) => x !== i))}
        />
      ),
    },
  ];

  const tabItems = [
    {
      key: 'config',
      label: 'Icons & Size',
      children: (
        <Card variant="borderless">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 4 }}>Filter Sprite Icon URL</div>
              <Input
                value={config.filterIcon}
                onChange={(e) =>
                  setConfig({ ...config, filterIcon: e.target.value })
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 4 }}>Light Icon URL</div>
              <Input
                value={config.lightIcon}
                onChange={(e) =>
                  setConfig({ ...config, lightIcon: e.target.value })
                }
              />
            </Col>
            <Col xs={12} sm={8} md={6} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Sprite Width</div>
              <InputNumber
                value={config.filterWidth}
                min={1}
                onChange={(v) =>
                  setConfig({
                    ...config,
                    filterWidth: v === null ? DEFAULT_FILTER_WIDTH : v,
                  })
                }
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={8} md={6} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Sprite Height</div>
              <InputNumber
                value={config.filterHeight}
                min={1}
                onChange={(v) =>
                  setConfig({
                    ...config,
                    filterHeight: v === null ? DEFAULT_FILTER_HEIGHT : v,
                  })
                }
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'sections',
      label: `Sections (${sections.length})`,
      children: (
        <Card variant="borderless">
          <Table<LobbySectionRow>
            rowKey={(_, i) => `s${i}`}
            columns={sectionColumns}
            dataSource={sections}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
          <Button
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            onClick={() =>
              setSections([
                ...sections,
                { scope: 'lobby', filterType: '', filterName: '', rows: 2 },
              ])
            }
          >
            Add Section
          </Button>
        </Card>
      ),
    },
    {
      key: 'providers',
      label: `Providers (${providers.length})`,
      children: (
        <Card variant="borderless">
          <Table<LobbyProviderRow>
            rowKey={(_, i) => `p${i}`}
            columns={providerColumns}
            dataSource={providers}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content', y: 520 }}
          />
          <Button
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            onClick={() =>
              setProviders([
                ...providers,
                {
                  categoryId: null,
                  filterType: '',
                  filterName: '',
                  bigIconX: 0,
                  bigIconY: 0,
                  iconX: 0,
                  iconY: 0,
                },
              ])
            }
          >
            Add Provider
          </Button>
        </Card>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Lobby Configuration"
        subtitle="Home/lobby sections, provider sprite map & icons"
        icon={<AppstoreOutlined />}
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

export default LobbyConfigPage;

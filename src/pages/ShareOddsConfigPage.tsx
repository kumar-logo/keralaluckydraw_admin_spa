import { useState, useEffect } from 'react';
import { Table, Input, Button, Card, message, Tabs, Empty, Tag } from 'antd';
import {
  ShareAltOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageUpload from '../components/ImageUpload';
import { getApiErrorMessage } from '../utils/apiError';

interface ShareRow {
  name: string;
  icon: string;
  url: string;
}
interface OddsRow {
  betCode: string;
  oddsClass: string;
}

interface ShareOddsResponse {
  shareChannels?: ShareRow[];
  oddsAliases?: OddsRow[];
}

const ShareOddsConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareChannels, setShareChannels] = useState<ShareRow[]>([]);
  const [oddsAliases, setOddsAliases] = useState<OddsRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = (await api.get(
        'share-odds-config',
      )) as unknown as ShareOddsResponse;
      const channels = Array.isArray(r.shareChannels) ? r.shareChannels : [];
      const aliases = Array.isArray(r.oddsAliases) ? r.oddsAliases : [];
      setShareChannels(
        channels.map((c) => ({
          name: c.name,
          icon: c.icon,
          url: c.url,
        })),
      );
      setOddsAliases(
        aliases.map((o) => ({
          betCode: o.betCode,
          oddsClass: o.oddsClass,
        })),
      );
    } catch {
      message.error('Failed to load share/odds config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateBeforeSave = (): string | null => {
    for (let i = 0; i < shareChannels.length; i++) {
      const r = shareChannels[i];
      if (!r.name?.trim()) return `Share channel #${i + 1}: name is required`;
      if (!r.url?.trim())
        return `Share channel #${i + 1}: URL template is required`;
    }
    for (let i = 0; i < oddsAliases.length; i++) {
      const r = oddsAliases[i];
      if (!r.betCode?.trim())
        return `Odds alias #${i + 1}: bet code is required`;
    }
    return null;
  };

  const handleSave = async () => {
    const err = validateBeforeSave();
    if (err) {
      message.error(err);
      return;
    }
    setSaving(true);
    try {
      await api.post('share-odds-config', {
        shareChannels: shareChannels.map((r, i) => ({ ...r, sortOrder: i })),
        oddsAliases: oddsAliases.map((r, i) => ({ ...r, sortOrder: i })),
      });
      message.success('Share & odds config saved');
      load();
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const uShare = (i: number, k: keyof ShareRow, v: string) =>
    setShareChannels((p) => p.map((r, x) => (x === i ? { ...r, [k]: v } : r)));
  const uOdds = (i: number, k: keyof OddsRow, v: string) =>
    setOddsAliases((p) => p.map((r, x) => (x === i ? { ...r, [k]: v } : r)));

  const shareCols: ColumnsType<ShareRow> = [
    {
      title: 'Name',
      width: 200,
      render: (_, r, i) => (
        <Input
          value={r.name}
          status={!r.name?.trim() ? 'error' : undefined}
          placeholder="Required"
          onChange={(e) => uShare(i, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'Icon',
      width: 220,
      render: (_, r, i) => (
        <ImageUpload
          value={r.icon}
          onChange={(url) => uShare(i, 'icon', url)}
          urlPlaceholder="Icon URL"
          folder="icons"
        />
      ),
    },
    {
      title: 'URL Template',
      render: (_, r, i) => (
        <Input
          value={r.url}
          status={!r.url?.trim() ? 'error' : undefined}
          placeholder="Required, e.g. https://wa.me/?text={msg}"
          onChange={(e) => uShare(i, 'url', e.target.value)}
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
          onClick={() =>
            setShareChannels(shareChannels.filter((_, x) => x !== i))
          }
        />
      ),
    },
  ];
  const oddsCols: ColumnsType<OddsRow> = [
    {
      title: 'Bet Code',
      render: (_, r, i) => (
        <Input
          value={r.betCode}
          status={!r.betCode?.trim() ? 'error' : undefined}
          placeholder="Required"
          onChange={(e) => uOdds(i, 'betCode', e.target.value)}
        />
      ),
    },
    {
      title: 'Odds Class',
      render: (_, r, i) => (
        <Input
          value={r.oddsClass}
          onChange={(e) => uOdds(i, 'oddsClass', e.target.value)}
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
          onClick={() => setOddsAliases(oddsAliases.filter((_, x) => x !== i))}
        />
      ),
    },
  ];

  const dirty = (() => {
    for (const r of shareChannels) if (!r.name?.trim() || !r.url?.trim()) return true;
    for (const r of oddsAliases) if (!r.betCode?.trim()) return true;
    return false;
  })();

  const tabItems = [
    {
      key: 'share',
      label: `Share Channels (${shareChannels.length})`,
      children: (
        <Card variant="borderless">
          <Table<ShareRow>
            rowKey={(_, i) => `s${i}`}
            columns={shareCols}
            dataSource={shareChannels}
            pagination={false}
            size="small"
            loading={loading}
            scroll={{ x: 'max-content' }}
            className="modern-table"
            locale={{
              emptyText: (
                <Empty description="No share channels — click Add Channel" />
              ),
            }}
          />
          <Button
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            onClick={() =>
              setShareChannels([
                ...shareChannels,
                { name: '', icon: '', url: '' },
              ])
            }
          >
            Add Channel
          </Button>
        </Card>
      ),
    },
    {
      key: 'odds',
      label: `Odds Aliases (${oddsAliases.length})`,
      children: (
        <Card variant="borderless">
          <Table<OddsRow>
            rowKey={(_, i) => `o${i}`}
            columns={oddsCols}
            dataSource={oddsAliases}
            pagination={false}
            size="small"
            loading={loading}
            scroll={{ x: 'max-content' }}
            className="modern-table"
            locale={{
              emptyText: (
                <Empty description="No odds aliases — click Add Alias" />
              ),
            }}
          />
          <Button
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            onClick={() =>
              setOddsAliases([...oddsAliases, { betCode: '', oddsClass: '' }])
            }
          >
            Add Alias
          </Button>
          <div
            style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}
          >
            Maps a bet code to an odds class at settlement (empty = use stored
            odds).
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Share & Odds Aliases"
        subtitle="Social share channels and bet-code odds aliases"
        icon={<ShareAltOutlined />}
        iconBg="var(--gradient-indigo)"
        extra={
          <>
            {dirty && (
              <Tag color="warning" style={{ marginRight: 8 }}>
                Fix required fields
              </Tag>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading || dirty}
              onClick={handleSave}
            >
              Save
            </Button>
          </>
        }
      />
      <Tabs items={tabItems} />
    </div>
  );
};

export default ShareOddsConfigPage;

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Space, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { firstString } from '../../../utils/format';
import { type RuleSection } from './colorShared';

const RulesTab = ({ gameId }: { gameId: number }) => {
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const normalize = (rj: unknown): RuleSection[] => {
    const src = Array.isArray(rj)
      ? rj
      : (rj as { sections?: unknown[] })?.sections;
    if (Array.isArray(src))
      return src.map((s) => {
        if (typeof s === 'string') return { title: '', content: s };
        const o = s as {
          title?: string;
          content?: string;
          body?: string;
          text?: string;
          sortOrder?: number;
        };
        return {
          title: firstString(o.title),
          content: firstString(o.content, o.body, o.text),
          sortOrder: o.sortOrder,
        };
      });
    if (typeof rj === 'string' && rj.trim())
      return [{ title: '', content: rj }];
    return [];
  };

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${gameId}/config`)) as {
        rules?: unknown;
      };
      setSections(normalize(cfg.rules));
    } catch {
      message.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const update = (i: number, k: keyof RuleSection, val: string) =>
    setSections((s) => s.map((x, j) => (j === i ? { ...x, [k]: val } : x)));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`games/${gameId}/rules`, {
        sections: sections
          .filter((s) => s.title.trim() || s.content.trim())
          .map((s, i) => ({
            title: s.title,
            content: s.content,
            sortOrder: s.sortOrder ?? i,
          })),
      });
      message.success('Rules saved');
      loadRules();
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
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Player-facing rules"
        description="Each section appears in the game's How-to-Play / Rules screen. Add a section per topic."
      />
      {sections.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No rules yet — add the first section."
          style={{ margin: '12px 0 20px' }}
        />
      )}
      {sections.map((s, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="Section title — e.g. How to Play"
              value={s.title}
              onChange={(e) => update(i, 'title', e.target.value)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                setSections((prev) => prev.filter((_, j) => j !== i))
              }
            />
          </div>
          <Input.TextArea
            rows={3}
            placeholder="Rule text shown to players…"
            value={s.content}
            onChange={(e) => update(i, 'content', e.target.value)}
          />
        </div>
      ))}
      <Space style={{ marginTop: 4 }}>
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            setSections((s) => [...s, { title: '', content: '' }])
          }
        >
          Add Section
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          loading={saving}
        >
          Save Rules
        </Button>
      </Space>
    </Card>
  );
};

export default RulesTab;

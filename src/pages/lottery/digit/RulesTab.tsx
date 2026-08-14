import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Space,
  message,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import {
  type RuleSection,
} from './digitShared';

interface RuleSectionLike {
  title?: string;
  content?: string;
  body?: string;
  text?: string;
}

const normalizeRules = (rj: unknown): RuleSection[] => {
  const src = Array.isArray(rj)
    ? rj
    : (rj as { sections?: unknown } | null)?.sections;
  if (Array.isArray(src))
    return src.map((s: unknown) =>
      typeof s === 'string'
        ? { title: '', content: s }
        : {
            title: (s as RuleSectionLike).title || '',
            content:
              (s as RuleSectionLike).content ||
              (s as RuleSectionLike).body ||
              (s as RuleSectionLike).text ||
              '',
          },
    );
  if (typeof rj === 'string' && rj.trim()) return [{ title: '', content: rj }];
  return [];
};

const RulesTab = ({ gameId }: { gameId: number }) => {
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${gameId}/config`)) as {
        rules?: unknown;
      };
      setSections(normalizeRules(cfg.rules));
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
        sections: sections.filter((s) => s.title.trim() || s.content.trim()),
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
        description="These sections appear in the game's How-to-Play / Rules screen. Add a section per topic (How to Play, Payouts, Draw Schedule)."
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
          onClick={() => setSections((s) => [...s, { title: '', content: '' }])}
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

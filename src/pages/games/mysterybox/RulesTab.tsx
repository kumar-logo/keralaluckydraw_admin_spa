import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Space, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import PageLoader from '../../../components/PageLoader';
import { normalizeRules, type RuleSection, type ConfigResponse } from './mysteryBoxShared';

const RulesTab = ({ gameId }: { gameId: number }) => {
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${gameId}/config`)) as ConfigResponse;
      setSections(normalizeRules(cfg.rules));
    } catch {
      message.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [gameId]);
  useEffect(() => {
    load();
  }, [load]);

  const update = (i: number, key: keyof RuleSection, val: string) =>
    setSections((s) => s.map((x, j) => (j === i ? { ...x, [key]: val } : x)));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`games/${gameId}/rules`, {
        sections: sections.filter((s) => s.title.trim() || s.content.trim()),
      });
      message.success('Rules saved');
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
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Player-facing rules"
        description="These sections appear in the game's How-to-Play / Rules screen. Add a section per topic."
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

import { useEffect, useState, useCallback } from 'react';
import { Button, Row, Col, message, Card, Switch, InputNumber, Input, Form, Empty, ColorPicker, Divider, Alert } from 'antd';
import { SettingOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, PictureOutlined, BgColorsOutlined } from '@ant-design/icons';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';
import ImageUpload from '../../components/ImageUpload';
import { typeName } from '../../utils/gameTypes';
import { usesOdds, LOTTERY_TYPES, toHex, MECHANICS, type MechField, type GameDetail } from './gameShared';

const ConfigTab = ({
  detail,
  reload,
}: {
  detail: GameDetail;
  reload: () => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prizeTiers, setPrizeTiers] = useState<
    { level: number; prizeLabel?: string; prizeValue: number }[]
  >([]);
  const [prefixes, setPrefixes] = useState('');
  const fields = MECHANICS[detail.gameType] || [];
  const isLottery = LOTTERY_TYPES.includes(detail.gameType);
  const hasPrefix = detail.gameType === 'kerala';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = (await api.get(`games/${detail.id}/config`)) as {
        scalar?: Record<string, unknown>;
        race?: { runnerCount?: number };
        pick4?: { pick4Price?: number; pick5Price?: number };
        kerala?: { ticketLength?: number; canInsurance?: number };
        punjab?: { canInsurance?: number };
        prizeTiers?: Array<{ level: number; prize?: string; intPrize?: number }>;
        prefixes?: string[];
      };
      const scalar = (cfg.scalar || {}) as Record<string, unknown>;
      const cfgVals: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.k === 'maxPrize') cfgVals[f.k] = scalar.maxPrize;
        else if (f.k === 'payRate') cfgVals[f.k] = scalar.payRate;
        else if (f.k === 'cycleSec') cfgVals[f.k] = scalar.quickCycleSec;
        else if (f.k === 'isQuick') cfgVals[f.k] = !!scalar.isQuick;
        else if (f.k === 'runnerCount') cfgVals[f.k] = cfg.race?.runnerCount;
        else if (f.k === 'pick4Price') cfgVals[f.k] = cfg.pick4?.pick4Price;
        else if (f.k === 'pick5Price') cfgVals[f.k] = cfg.pick4?.pick5Price;
        else if (f.k === 'ticketLength')
          cfgVals[f.k] =
            detail.gameType === 'punjab'
              ? scalar.digitCount
              : cfg.kerala?.ticketLength;
        else if (f.k === 'canInsurance')
          cfgVals[f.k] =
            detail.gameType === 'punjab'
              ? !!cfg.punjab?.canInsurance
              : !!cfg.kerala?.canInsurance;
        else cfgVals[f.k] = scalar[f.k];
      }
      form.setFieldsValue({
        gameName: detail.gameName,
        gameUid: detail.gameUid ?? '',
        emoji: detail.emoji,
        description: detail.description,
        iconUrl: detail.iconUrl,
        bannerUrl: detail.bannerUrl,
        thumbnailUrl: detail.thumbnailUrl,
        themeColor: detail.themeColor,
        bgColor: detail.bgColor,
        textColor: detail.textColor,
        borderColor: detail.borderColor,
        minBet: detail.minBet,
        maxBet: detail.maxBet,
        sellingPrice: detail.sellingPrice,
        ...cfgVals,
      });
      setPrizeTiers(
        (cfg.prizeTiers || []).map((t) => ({
          level: t.level,
          prizeLabel: t.prize,
          prizeValue: Number(t.intPrize ?? 0),
        })),
      );
      setPrefixes((cfg.prefixes || []).join(', '));
    } catch {
      message.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [detail.id]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await api.put(`games/${detail.id}`, {
        gameName: v.gameName,
        gameUid: (v.gameUid ?? '').trim() || null,
        emoji: v.emoji,
        description: v.description,
        iconUrl: v.iconUrl,
        bannerUrl: v.bannerUrl,
        thumbnailUrl: v.thumbnailUrl,
        themeColor: toHex(v.themeColor),
        bgColor: toHex(v.bgColor),
        textColor: toHex(v.textColor),
        borderColor: toHex(v.borderColor),
        minBet: v.minBet,
        maxBet: v.maxBet,
        sellingPrice: v.sellingPrice,
      });
      const payload: Record<string, unknown> = {};
      const has = (k: string) => fields.some((f) => f.k === k);
      if (has('maxPrize')) payload.maxPrize = v.maxPrize;
      if (has('payRate')) payload.payRate = v.payRate;
      if (has('cycleSec')) payload.quickCycleSec = v.cycleSec;
      if (has('isQuick')) payload.isQuick = !!v.isQuick;
      if (has('runnerCount')) payload.race = { runnerCount: v.runnerCount };
      if (detail.gameType === 'four_five_digit')
        payload.pick4 = { pick4Price: v.pick4Price, pick5Price: v.pick5Price };
      if (detail.gameType === 'punjab') {
        payload.punjab = { canInsurance: v.canInsurance ? 1 : 0 };
        if (v.ticketLength !== undefined) payload.digitCount = v.ticketLength;
      } else if (hasPrefix) {
        payload.kerala = {
          ticketLength: v.ticketLength,
          canInsurance: v.canInsurance ? 1 : 0,
        };
        payload.prefixes = prefixes
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (has('digitCount')) {
        payload.digitCount = v.digitCount;
      }
      if (isLottery) {
        payload.prizeTiers = prizeTiers
          .filter((t) => t.level !== undefined && t.level !== null)
          .map((t) => ({
            level: Number(t.level),
            prizeLabel: t.prizeLabel,
            prizeValue: Number(t.prizeValue) || 0,
          }));
      }
      await api.put(`games/${detail.id}/config`, payload);
      message.success('Configuration saved');
      reload();
      load();
    } catch (e) {
      if ((e as { errorFields?: unknown })?.errorFields) return;
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: MechField) => (
    <Col xs={12} md={6} key={f.k}>
      <Form.Item
        name={f.k}
        label={f.label}
        extra={f.extra}
        valuePropName={f.kind === 'bool' ? 'checked' : 'value'}
      >
        {f.kind === 'bool' ? (
          <Switch />
        ) : f.kind === 'text' ? (
          <Input placeholder="—" />
        ) : (
          <InputNumber min={f.min ?? 0} max={f.max} style={{ width: '100%' }} />
        )}
      </Form.Item>
    </Col>
  );

  const setTier = (
    i: number,
    k: 'level' | 'prizeLabel' | 'prizeValue',
    val: unknown,
  ) =>
    setPrizeTiers((list) =>
      list.map((t, j) => (j === i ? { ...t, [k]: val } : t)),
    );

  if (loading) return <PageLoader cards={3} />;

  return (
    <Form form={form} layout="vertical">
      <Card
        title={
          <>
            <PictureOutlined /> Images
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={24}>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Icon
            </div>
            <Form.Item name="iconUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Banner
            </div>
            <Form.Item name="bannerUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
          <Col>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Thumbnail
            </div>
            <Form.Item name="thumbnailUrl" noStyle>
              <ImageUpload folder="games" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <BgColorsOutlined /> Branding & Colours
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="gameName" label="Display Name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="emoji" label="Emoji">
              <Input maxLength={4} placeholder="optional" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="gameUid"
              label="Aggregator Game UID (game_uid)"
              extra="Launch id sent to the aggregator (blank = game code)."
            >
              <Input placeholder="e.g. JILI-SlotGame-001" allowClear />
            </Form.Item>
          </Col>
          {detail.isThirdParty === 1 && (
            <Col xs={24} md={12}>
              <Form.Item
                shouldUpdate={(prev, cur) => prev.gameUid !== cur.gameUid}
                noStyle
              >
                {({ getFieldValue }) =>
                  String(getFieldValue('gameUid') ?? '').trim() ? null : (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginTop: 28 }}
                      message="No launch UID set"
                      description="Required for launch — the game will fall back to its game code, which may fail at the aggregator."
                    />
                  )
                }
              </Form.Item>
            </Col>
          )}
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Row gutter={16}>
          <Col>
            <Form.Item name="themeColor" label="Theme">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="bgColor" label="Background">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="textColor" label="Text">
              <ColorPicker showText />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="borderColor" label="Border">
              <ColorPicker showText />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <>
            <SettingOutlined /> {typeName(detail.gameType)} Mechanics & Limits
          </>
        }
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Row gutter={16}>
          {fields.length > 0 ? (
            fields.map(renderField)
          ) : (
            <Col span={24}>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                No extra mechanics for this game — payouts come from{' '}
                {usesOdds(detail.gameType) ? 'the Odds tab' : 'prize tiers'}.
              </div>
            </Col>
          )}
        </Row>
        <Divider style={{ margin: '8px 0 16px' }} />
        <Row gutter={16}>
          <Col xs={8} md={6}>
            <Form.Item name="minBet" label="Min Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={6}>
            <Form.Item name="maxBet" label="Max Bet">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={6}>
            <Form.Item name="sellingPrice" label="Ticket Price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {isLottery && (
        <Card
          title={
            <>
              <SettingOutlined /> Prize Tiers
            </>
          }
          size="small"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          {prizeTiers.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No prize tiers configured"
              style={{ margin: '8px 0 16px' }}
            />
          )}
          {prizeTiers.map((t, i) => (
            <Row key={i} gutter={8} align="middle" style={{ marginBottom: 8 }}>
              <Col xs={5} md={3}>
                <InputNumber
                  placeholder="Level"
                  min={1}
                  value={t.level}
                  onChange={(val) => setTier(i, 'level', val)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={10} md={8}>
                <Input
                  placeholder="Label — e.g. 1st"
                  value={t.prizeLabel}
                  onChange={(e) => setTier(i, 'prizeLabel', e.target.value)}
                />
              </Col>
              <Col xs={7} md={6}>
                <InputNumber
                  placeholder="Prize amount"
                  min={0}
                  value={t.prizeValue}
                  onChange={(val) => setTier(i, 'prizeValue', val)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={2} md={2}>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    setPrizeTiers((l) => l.filter((_, j) => j !== i))
                  }
                />
              </Col>
            </Row>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              setPrizeTiers((l) => [
                ...l,
                { level: l.length + 1, prizeLabel: '', prizeValue: 0 },
              ])
            }
          >
            Add Tier
          </Button>
        </Card>
      )}

      {hasPrefix && (
        <Card
          title={
            <>
              <SettingOutlined /> 2nd-Place Prefixes
            </>
          }
          size="small"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <Input.TextArea
            rows={2}
            value={prefixes}
            onChange={(e) => setPrefixes(e.target.value)}
            placeholder="Comma or space separated — e.g. A, B, C, D, E"
          />
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}
          >
            Allowed 2nd-place letter prefixes for Kerala ticket numbers.
          </div>
        </Card>
      )}

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={save}
        loading={saving}
      >
        Save Configuration
      </Button>
    </Form>
  );
};

export default ConfigTab;

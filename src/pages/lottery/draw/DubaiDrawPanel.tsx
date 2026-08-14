import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Row, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { useConfigStore } from '../../../store/configStore';
import {
  DubaiNumberIcon,
  DUBAI_DEFAULT_THEME_COLOR,
  hasDubaiIcon,
} from '../../../components/DubaiIcons';
import { GameResultDisplay } from '../../../components/ResultBall';
import PreviewOutcome from './PreviewOutcome';
import { DrawGameType, type DrawPanelProps, type PreviewData } from './drawTypes';
import { getApiErrorMessage } from '../../../utils/apiError';

const DubaiDrawPanel = ({ round, game, readOnly, onConfirm }: DrawPanelProps) => {
  const getGameTypeColor = useConfigStore((s) => s.getGameTypeColor);
  const themeColor =
    game.themeColor ||
    getGameTypeColor(DrawGameType.Dubai) ||
    DUBAI_DEFAULT_THEME_COLOR;

  const rangeMin =
    Number.isInteger(game.numberMin) && Number(game.numberMin) >= 1
      ? Number(game.numberMin)
      : 1;
  const rangeMax =
    Number.isInteger(game.numberMax) && Number(game.numberMax) >= rangeMin
      ? Number(game.numberMax)
      : 36;
  const dubaiNumbers = Array.from(
    { length: rangeMax - rangeMin + 1 },
    (_, i) => rangeMin + i,
  );

  const [entry, setEntry] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPreview = useCallback(
    async (value: string) => {
      if (!value) {
        setPreview(null);
        return;
      }
      setLoading(true);
      try {
        const res = await api.post<unknown, PreviewData>(
          `draws/${round.id}/preview`,
          { result: { drawResult: value } },
        );
        setPreview(res);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Preview failed'));
      } finally {
        setLoading(false);
      }
    },
    [round.id],
  );

  useEffect(() => {
    if (readOnly) {
      const settled = round.result?.drawResult;
      if (settled != null) setEntry(String(settled));
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runPreview(entry), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entry, readOnly, runPreview, round.result?.drawResult]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          title={readOnly ? 'Final Result' : 'Pick the Winning Number'}
          style={{ borderRadius: 12, borderTop: `3px solid ${themeColor}` }}
        >
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            {readOnly
              ? 'This draw is settled.'
              : 'Select the single winning number. The preview updates automatically.'}
          </div>
          {readOnly && round.result ? (
            <div style={{ padding: '8px 0' }}>
              <GameResultDisplay
                gameType={DrawGameType.Dubai}
                result={round.result}
                size={48}
                themeColor={themeColor}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {dubaiNumbers.map((n) => {
                const active = entry === String(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEntry(String(n))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: active ? `${themeColor}1a` : 'var(--bg-card)',
                      border: `2px solid ${
                        active ? themeColor : 'var(--border-default)'
                      }`,
                      color: active ? themeColor : 'var(--text-primary)',
                      transition: 'all .12s',
                    }}
                  >
                    {hasDubaiIcon(n) ? (
                      <DubaiNumberIcon number={n} size={34} color={themeColor} />
                    ) : null}
                    <span style={{ fontWeight: 700 }}>{n}</span>
                  </button>
                );
              })}
            </div>
          )}
          {!readOnly && (
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                danger
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => onConfirm(entry)}
                disabled={!entry || !preview}
              >
                Confirm &amp; Settle
              </Button>
            </div>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <PreviewOutcome
          preview={preview}
          loading={loading}
          emptyText={readOnly ? 'Settled' : 'Pick a number to preview the outcome'}
        />
      </Col>
    </Row>
  );
};

export default DubaiDrawPanel;

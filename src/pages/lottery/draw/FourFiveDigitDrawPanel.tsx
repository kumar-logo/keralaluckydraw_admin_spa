import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Empty, Spin, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import { GameResultDisplay } from '../../../components/ResultBall';
import DrawDigitInput from './DrawDigitInput';
import SlatResultView from './SlatResultView';
import {
  type DrawPanelProps,
  type SlatReadingResponse,
} from './drawTypes';
import { deriveSlatLabels } from '../../../utils/slatLabels';
import { getApiErrorMessage } from '../../../utils/apiError';

const FourFiveDigitDrawPanel = ({
  round,
  game,
  ticketLength,
  readOnly,
  onConfirm,
  positionColors: gamePositionColors,
  slatProducts,
}: DrawPanelProps) => {
  const length = ticketLength;
  const positionColors = Array.isArray(gamePositionColors)
    ? gamePositionColors
    : [];
  const [entry, setEntry] = useState('');
  const [reading, setReading] = useState<SlatReadingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const labels = useMemo(() => {
    const fromReading = reading?.reading.labeled.map((cell) => cell.label);
    if (fromReading && fromReading.length === length) return fromReading;
    return deriveSlatLabels(length, slatProducts);
  }, [reading, length, slatProducts]);

  const colors = useMemo(
    () =>
      labels.map((_, i) => {
        const color = positionColors[i];
        return color ? color : '';
      }),
    [labels, positionColors],
  );

  const fetchReading = useCallback(
    async (drawResult?: string) => {
      setLoading(true);
      try {
        const query = drawResult ? `?drawResult=${drawResult}` : '';
        const res = await api.get<unknown, SlatReadingResponse>(
          `games/${game.id}/rounds/${round.id}/slat-reading${query}`,
        );
        setReading(res);
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to read result'));
      } finally {
        setLoading(false);
      }
    },
    [game.id, round.id],
  );

  useEffect(() => {
    if (readOnly) {
      void fetchReading();
      const settled = round.result?.drawResult;
      if (settled != null) setEntry(String(settled));
    }
  }, [readOnly, fetchReading, round.result?.drawResult]);

  useEffect(() => {
    if (readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (entry.length < length) {
      setReading(null);
      return;
    }
    debounceRef.current = setTimeout(() => void fetchReading(entry), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entry, length, readOnly, fetchReading]);

  return (
    <div>
      <Card
        title={readOnly ? 'Settled Result' : `Enter ${length}-Digit Result`}
        style={{ borderRadius: 12 }}
      >
        <div
          style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}
        >
          {readOnly
            ? 'This draw is settled. Ticket-level profit/loss below.'
            : `Type the ${length} winning digits. The slat reading updates automatically.`}
        </div>
        {readOnly && round.result ? (
          <div style={{ padding: '8px 0' }}>
            <GameResultDisplay
              gameType={game.gameType}
              result={round.result}
              slatLabels={labels}
              positionColors={colors}
              themeColor={game.themeColor ? game.themeColor : undefined}
              size={44}
            />
          </div>
        ) : null}
        {!readOnly && (
          <DrawDigitInput
            length={length}
            labels={labels}
            colors={colors}
            value={entry}
            onChange={setEntry}
          />
        )}
        {!readOnly && (
          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              danger
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => onConfirm(entry)}
              disabled={entry.length < length || !reading}
            >
              Confirm &amp; Settle
            </Button>
          </div>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        {loading && !reading ? (
          <Card style={{ borderRadius: 12 }}>
            <Spin />
          </Card>
        ) : reading ? (
          <SlatResultView data={reading} positionColors={colors} />
        ) : (
          <Card style={{ borderRadius: 12 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={`Enter a ${length}-digit result to preview profit/loss`}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default FourFiveDigitDrawPanel;

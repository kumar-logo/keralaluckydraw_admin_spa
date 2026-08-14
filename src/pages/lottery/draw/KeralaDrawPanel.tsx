import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Row, Table, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import MoneyText from '../../../components/MoneyText';
import { GameResultDisplay } from '../../../components/ResultBall';
import DrawDigitInput from './DrawDigitInput';
import PreviewOutcome from './PreviewOutcome';
import type { DrawPanelProps, PrizeTier, PreviewData } from './drawTypes';
import { getApiErrorMessage } from '../../../utils/apiError';

const KeralaDrawPanel = ({
  round,
  ticketLength,
  readOnly,
  onConfirm,
  prizeTiers,
}: DrawPanelProps & { prizeTiers?: PrizeTier[] }) => {
  const length = ticketLength;
  const [entry, setEntry] = useState('');
  const [prefix, setPrefix] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPreview = useCallback(
    async (value: string) => {
      if (value.length < length) {
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
    [round.id, length],
  );

  useEffect(() => {
    if (readOnly) {
      const settled = round.result?.drawResult;
      if (settled != null) setEntry(String(settled));
      if (round.result?.prefix) setPrefix(String(round.result.prefix));
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runPreview(entry), 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entry, readOnly, runPreview, round.result?.drawResult]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          title={readOnly ? 'Final Result' : 'Enter Kerala Result'}
          style={{ borderRadius: 12 }}
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
              : `Type the ${length}-digit winning number. The preview updates automatically.`}
          </div>
          {readOnly && round.result ? (
            <div style={{ padding: '8px 0' }}>
              <GameResultDisplay
                gameType="kerala"
                result={round.result}
                size={44}
              />
            </div>
          ) : (
            <DrawDigitInput
              length={length}
              value={entry}
              onChange={setEntry}
              prefix={prefix}
              onPrefixChange={setPrefix}
              prefixLabel="Series"
            />
          )}
          {!readOnly && (
            <div style={{ marginTop: 20 }}>
              <Button
                type="primary"
                danger
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => onConfirm(entry, prefix)}
                disabled={entry.length < length || !preview}
              >
                Confirm &amp; Settle
              </Button>
            </div>
          )}
        </Card>

        {prizeTiers && prizeTiers.length > 0 && (
          <Card
            title="Prize Tiers"
            size="small"
            style={{ borderRadius: 12, marginTop: 16 }}
          >
            <Table<PrizeTier>
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
              dataSource={prizeTiers}
              columns={[
                { title: 'Tier', dataIndex: 'prizeTier', width: 70 },
                { title: 'Name', dataIndex: 'prizeName' },
                {
                  title: 'Amount',
                  dataIndex: 'prizeAmt',
                  width: 130,
                  render: (v: number) => (
                    <MoneyText value={v} variant="neutral" />
                  ),
                },
              ]}
            />
          </Card>
        )}
      </Col>
      <Col xs={24} lg={10}>
        <PreviewOutcome
          preview={preview}
          loading={loading}
          emptyText={
            readOnly ? 'Settled' : 'Enter a result to preview the outcome'
          }
        />
      </Col>
    </Row>
  );
};

export default KeralaDrawPanel;

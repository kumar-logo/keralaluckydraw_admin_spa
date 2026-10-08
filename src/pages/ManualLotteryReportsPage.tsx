import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  Space,
  message,
  Avatar,
  Tag,
  Divider,
  DatePicker,
} from 'antd';
import {
  FilePdfOutlined,
  ReloadOutlined,
  TrophyOutlined,
  FileExcelOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { downloadFile } from '../services/download';
import PageHeader from '../components/PageHeader';
import { resolveAssetUrl } from '../utils/assetUrl';
import { formatDateTimeShort } from '../utils/format';
import { getApiErrorMessage } from '../utils/apiError';

const { RangePicker } = DatePicker;
const DATE_FORMAT = 'YYYY-MM-DD';

interface ManualLotteryDraw {
  gameId: number;
  gameName: string;
  iconUrl: string | null;
  gameType: string;
  firstDrawDay: string;
  lastDrawDay: string;
  drawCount: number;
  startDate: string | null;
  slotLabels: string[];
}

interface LoadedRange {
  startDate: string | null;
  endDate: string | null;
}

interface DrawSlot {
  value: string;
  label: string;
}

interface ReportSlotList {
  isMultiDraw: boolean;
  drawSlots: DrawSlot[];
  digitLengths: DrawSlot[];
}

const ALL_DIGITS = 'all';

type ReportKind = 'profit-loss' | 'number-wise';

const buildDownloadPath = (
  kind: ReportKind,
  gameId: number,
  roundId: string,
  digitLength: string,
): string => {
  const params = new URLSearchParams();
  params.set('gameId', String(gameId));
  params.set('roundId', roundId);
  if (digitLength && digitLength !== ALL_DIGITS)
    params.set('digitLength', digitLength);
  return `/lottery/report/${kind}/download?${params.toString()}`;
};

const formatDrawDay = (drawDay: string): string =>
  dayjs(drawDay).format('DD MMM YYYY');

const formatDrawDayRange = (first: string, last: string): string =>
  first === last
    ? formatDrawDay(first)
    : `${formatDrawDay(first)} - ${formatDrawDay(last)}`;

const ManualLotteryReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [draws, setDraws] = useState<ManualLotteryDraw[]>([]);
  const [activeDraw, setActiveDraw] = useState<ManualLotteryDraw | null>(null);
  const [slots, setSlots] = useState<DrawSlot[]>([]);
  const [digitLengths, setDigitLengths] = useState<DrawSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [digitLength, setDigitLength] = useState<string>(ALL_DIGITS);
  const [downloading, setDownloading] = useState<string>('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [loadedRange, setLoadedRange] = useState<LoadedRange>({
    startDate: null,
    endDate: null,
  });

  const loadDraws = async () => {
    setLoading(true);
    try {
      const range: LoadedRange = {
        startDate: startDate ? startDate.format(DATE_FORMAT) : null,
        endDate: endDate ? endDate.format(DATE_FORMAT) : null,
      };
      const params = new URLSearchParams();
      if (range.startDate) params.set('startDate', range.startDate);
      if (range.endDate) params.set('endDate', range.endDate);
      const qs = params.toString();
      const res = (await api.get(
        qs ? `lottery/report/manual-draws?${qs}` : 'lottery/report/manual-draws',
      )) as unknown as ManualLotteryDraw[];
      setDraws(Array.isArray(res) ? res : []);
      setLoadedRange(range);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load manual lotteries'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraws();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const openModal = useCallback(async (draw: ManualLotteryDraw) => {
    setActiveDraw(draw);
    setDigitLength(ALL_DIGITS);
    setSlots([]);
    setDigitLengths([]);
    setSlotsLoading(true);
    try {
      const params = new URLSearchParams();
      if (loadedRange.startDate) params.set('startDate', loadedRange.startDate);
      if (loadedRange.endDate) params.set('endDate', loadedRange.endDate);
      const qs = params.toString();
      const res = (await api.get(
        qs
          ? `lottery/report/slots/${draw.gameId}?${qs}`
          : `lottery/report/slots/${draw.gameId}`,
      )) as unknown as ReportSlotList;
      setSlots(res.drawSlots);
      setDigitLengths(res.digitLengths);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load draw slots'));
    } finally {
      setSlotsLoading(false);
    }
  }, [loadedRange]);

  const closeModal = () => {
    setActiveDraw(null);
    setSlots([]);
    setDigitLengths([]);
    setDownloading('');
  };

  const downloadOne = async (
    kind: ReportKind,
    roundId: string,
    busyKey: string,
  ) => {
    if (!activeDraw) return;
    setDownloading(busyKey);
    try {
      await downloadFile(
        buildDownloadPath(kind, activeDraw.gameId, roundId, digitLength),
        `${kind}_${roundId}.pdf`,
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Download failed'));
    } finally {
      setDownloading('');
    }
  };

  const downloadAllSlots = async (kind: ReportKind) => {
    if (!activeDraw) return;
    if (slots.length === 0) {
      message.warning('No draw time slots found for the selected dates');
      return;
    }
    setDownloading(`all-${kind}`);
    try {
      for (const slot of slots) {
        await downloadFile(
          buildDownloadPath(kind, activeDraw.gameId, slot.value, digitLength),
          `${kind}_${slot.value}.pdf`,
        );
      }
      message.success('Report download started');
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Download failed'));
    } finally {
      setDownloading('');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'SL',
        key: 'sl',
        width: 64,
        render: (_: unknown, __: ManualLotteryDraw, index: number) => index + 1,
      },
      {
        title: 'Image',
        key: 'image',
        width: 80,
        render: (_: unknown, row: ManualLotteryDraw) => (
          <Avatar
            shape="square"
            size={44}
            src={resolveAssetUrl(row.iconUrl)}
            icon={<CrownOutlined />}
            style={{ background: '#f1f5f9' }}
          />
        ),
      },
      {
        title: 'Lottery',
        key: 'lottery',
        render: (_: unknown, row: ManualLotteryDraw) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.gameName}</div>
            <Tag color="cyan" style={{ marginTop: 4 }}>
              {row.drawCount} {row.drawCount === 1 ? 'Draw' : 'Draws'}
            </Tag>
          </div>
        ),
      },
      {
        title: 'Start Date',
        key: 'startDate',
        width: 180,
        render: (_: unknown, row: ManualLotteryDraw) =>
          formatDateTimeShort(row.startDate),
      },
      {
        title: 'Draw Date',
        key: 'drawDay',
        width: 200,
        render: (_: unknown, row: ManualLotteryDraw) =>
          formatDrawDayRange(row.firstDrawDay, row.lastDrawDay),
      },
      {
        title: 'Time Slots',
        key: 'slots',
        render: (_: unknown, row: ManualLotteryDraw) => (
          <Space size={[4, 4]} wrap>
            {row.slotLabels.map((label) => (
              <Tag key={label} color="blue">
                {label}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'Report Pdf',
        key: 'action',
        width: 150,
        render: (_: unknown, row: ManualLotteryDraw) => (
          <Button
            type="primary"
            danger
            icon={<FilePdfOutlined />}
            onClick={() => openModal(row)}
          >
            Report Pdf
          </Button>
        ),
      },
    ],
    [openModal],
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Manual Lottery Reports"
        subtitle="Quickly download report PDFs for manual lottery draws"
        icon={<TrophyOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RangePicker
              allowEmpty={[true, true]}
              value={
                [startDate, endDate] as [
                  dayjs.Dayjs | null,
                  dayjs.Dayjs | null,
                ]
              }
              onChange={(d) => {
                setStartDate(d && d[0] ? d[0] : null);
                setEndDate(d && d[1] ? d[1] : null);
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDraws}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <Table<ManualLotteryDraw>
        rowKey="gameId"
        columns={columns}
        dataSource={draws}
        loading={loading}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        className="modern-table"
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={activeDraw !== null}
        onCancel={closeModal}
        footer={null}
        title={
          activeDraw
            ? `${activeDraw.gameName} (${formatDrawDayRange(activeDraw.firstDrawDay, activeDraw.lastDrawDay)})`
            : 'Download Report'
        }
        width={560}
      >
        {activeDraw && (
          <div>
            {digitLengths.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Digit Length
                </div>
                <Select
                  style={{ width: '100%' }}
                  value={digitLength}
                  onChange={setDigitLength}
                  options={[
                    { value: ALL_DIGITS, label: 'All Digits' },
                    ...digitLengths.map((d) => ({
                      value: d.value,
                      label: d.label,
                    })),
                  ]}
                />
              </div>
            )}

            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Download every time slot (one PDF per round)
            </div>
            <Space wrap style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                danger
                icon={<FilePdfOutlined />}
                disabled={slotsLoading || slots.length === 0}
                loading={downloading === 'all-profit-loss'}
                onClick={() => downloadAllSlots('profit-loss')}
              >
                All Slots · Profit &amp; Loss
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                disabled={slotsLoading || slots.length === 0}
                loading={downloading === 'all-number-wise'}
                onClick={() => downloadAllSlots('number-wise')}
              >
                All Slots · Number Wise
              </Button>
            </Space>

            {(slotsLoading || slots.length > 0) && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Download a single time slot
                </div>
                <Table<DrawSlot>
                  rowKey="value"
                  size="small"
                  pagination={false}
                  loading={slotsLoading}
                  dataSource={slots}
                  columns={[
                    {
                      title: 'Time Slot',
                      dataIndex: 'label',
                      key: 'label',
                    },
                    {
                      title: 'Report',
                      key: 'slotAction',
                      width: 230,
                      render: (_: unknown, slot: DrawSlot) => (
                        <Space>
                          <Button
                            size="small"
                            danger
                            icon={<FilePdfOutlined />}
                            loading={
                              downloading === `pl-${slot.value}`
                            }
                            onClick={() =>
                              downloadOne(
                                'profit-loss',
                                slot.value,
                                `pl-${slot.value}`,
                              )
                            }
                          >
                            P&amp;L
                          </Button>
                          <Button
                            size="small"
                            icon={<FileExcelOutlined />}
                            loading={
                              downloading === `nw-${slot.value}`
                            }
                            onClick={() =>
                              downloadOne(
                                'number-wise',
                                slot.value,
                                `nw-${slot.value}`,
                              )
                            }
                          >
                            No. Wise
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManualLotteryReportsPage;

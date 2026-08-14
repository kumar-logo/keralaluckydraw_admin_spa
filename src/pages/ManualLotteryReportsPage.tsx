import { useEffect, useMemo, useState } from 'react';
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
  roundNo: string;
  phase: number;
  startDate: string | null;
  drawDate: string | null;
  status: number;
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

const ALL_SLOTS = 'all';
const ALL_DIGITS = 'all';

type ReportKind = 'profit-loss' | 'number-wise';

const buildDownloadPath = (
  kind: ReportKind,
  gameId: number,
  roundNo: string,
  slotTime: string,
  digitLength: string,
): string => {
  const params = new URLSearchParams();
  params.set('gameId', String(gameId));
  params.set('roundNo', roundNo);
  if (slotTime && slotTime !== ALL_SLOTS) params.set('slotTime', slotTime);
  if (digitLength && digitLength !== ALL_DIGITS)
    params.set('digitLength', digitLength);
  return `/lottery/report/${kind}/download?${params.toString()}`;
};

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

  const loadDraws = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate.format(DATE_FORMAT));
      if (endDate) params.set('endDate', endDate.format(DATE_FORMAT));
      const qs = params.toString();
      const res = (await api.get(
        qs ? `lottery/report/manual-draws?${qs}` : 'lottery/report/manual-draws',
      )) as unknown as ManualLotteryDraw[];
      setDraws(Array.isArray(res) ? res : []);
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

  const openModal = async (draw: ManualLotteryDraw) => {
    setActiveDraw(draw);
    setDigitLength(ALL_DIGITS);
    setSlots([]);
    setDigitLengths([]);
    setSlotsLoading(true);
    try {
      const res = (await api.get(
        `lottery/report/slots/${draw.gameId}`,
      )) as unknown as ReportSlotList;
      setSlots(res.drawSlots);
      setDigitLengths(res.digitLengths);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load draw slots'));
    } finally {
      setSlotsLoading(false);
    }
  };

  const closeModal = () => {
    setActiveDraw(null);
    setSlots([]);
    setDigitLengths([]);
    setDownloading('');
  };

  const downloadOne = async (
    kind: ReportKind,
    slotTime: string,
    busyKey: string,
  ) => {
    if (!activeDraw) return;
    setDownloading(busyKey);
    try {
      await downloadFile(
        buildDownloadPath(
          kind,
          activeDraw.gameId,
          activeDraw.roundNo,
          slotTime,
          digitLength,
        ),
        `${kind}.pdf`,
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Download failed'));
    } finally {
      setDownloading('');
    }
  };

  const downloadAllSlots = async (kind: ReportKind) => {
    if (!activeDraw) return;
    setDownloading(`all-${kind}`);
    try {
      if (slots.length === 0) {
        await downloadFile(
          buildDownloadPath(
            kind,
            activeDraw.gameId,
            activeDraw.roundNo,
            ALL_SLOTS,
            digitLength,
          ),
          `${kind}.pdf`,
        );
      } else {
        for (const slot of slots) {
          await downloadFile(
            buildDownloadPath(
              kind,
              activeDraw.gameId,
              activeDraw.roundNo,
              slot.value,
              digitLength,
            ),
            `${kind}_${slot.value}.pdf`,
          );
        }
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
              Phase# {row.phase}
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
        key: 'drawDate',
        width: 180,
        render: (_: unknown, row: ManualLotteryDraw) =>
          formatDateTimeShort(row.drawDate),
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
    [],
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
        rowKey={(row) => `${row.gameId}:${row.roundNo}`}
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
            ? `${activeDraw.gameName} — Phase# ${activeDraw.phase}`
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
              Download all time slots at once
            </div>
            <Space wrap style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                danger
                icon={<FilePdfOutlined />}
                loading={downloading === 'all-profit-loss'}
                onClick={() => downloadAllSlots('profit-loss')}
              >
                All Slots · Profit &amp; Loss
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                loading={downloading === 'all-number-wise'}
                onClick={() => downloadAllSlots('number-wise')}
              >
                All Slots · Number Wise
              </Button>
            </Space>

            {slots.length > 0 && (
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

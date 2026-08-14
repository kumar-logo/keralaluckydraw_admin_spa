import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Steps,
  Alert,
  Space,
  message,
  Divider,
  ColorPicker,
  DatePicker,
} from 'antd';
import {
  CrownOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import api from '../../../services/api';
import PageHeader from '../../../components/PageHeader';
import ImageUpload from '../../../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../../../utils/apiError';

const GAME_TYPE = 'kerala';
const WIN_FEE_TYPE = 'win_deduction';

const TIER_LEVEL: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  consolation: 6,
};

const defaultPrizeTiers = [
  { tier: 'first', name: '1st Prize', amount: 100000, count: 1 },
  { tier: 'second', name: '2nd Prize', amount: 10000, count: 1 },
  { tier: 'third', name: '3rd Prize', amount: 5000, count: 2 },
  { tier: 'fourth', name: '4th Prize', amount: 1000, count: 5 },
  { tier: 'fifth', name: '5th Prize', amount: 500, count: 10 },
  { tier: 'consolation', name: 'Consolation', amount: 100, count: 20 },
];

type HexValue = string | { toHexString: () => string } | undefined | null;

const hex = (value: HexValue): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toHexString();
};

interface PrizeTierInput {
  tier: string;
  name?: string;
  amount: number;
  count?: number;
}

interface CreateGameResponse {
  id: number;
}

interface CreateKeralaFormValues {
  name: string;
  status: boolean;
  isHidden: boolean;
  sortOrder: number;
  minBet: number;
  maxBet: number;
  sellingPrice: number;
  drawInterval: number;
  ticketLength: number;
  icon?: string;
  cover?: string;
  thumbnail?: string;
  description?: string;
  groupName?: string;
  autoGenerate: boolean;
  scheduledDrawTimes?: (Dayjs | null)[];
  startDate?: Dayjs | null;
  stopBetBefore: number;
  drawDelay: number;
  prizeTiers?: PrizeTierInput[];
  startChar?: string;
  canInsurance?: boolean;
  feeRate: number;
  themeColor?: HexValue;
  bgColor?: HexValue;
  textColor?: HexValue;
  borderColor?: HexValue;
}

const CreateKeralaLotteryPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateKeralaFormValues>();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const autoGenerate = Form.useWatch('autoGenerate', form);

  const validateStep = async (current: number): Promise<boolean> => {
    const drawModeFields =
      autoGenerate === false
        ? ['autoGenerate', 'scheduledDrawTimes', 'stopBetBefore']
        : ['autoGenerate', 'drawInterval', 'stopBetBefore', 'drawDelay'];
    const byStep: string[][] = [
      drawModeFields,
      ['name', 'sellingPrice', 'themeColor'],
      ['ticketLength'],
      [],
      [],
    ];
    try {
      await form.validateFields(byStep[current]);
      return true;
    } catch {
      return false;
    }
  };

  const nextStep = async () => {
    if (await validateStep(step)) setStep(step + 1);
  };

  const loadDefaultTiers = () => {
    form.setFieldsValue({ prizeTiers: defaultPrizeTiers });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const isManual = values.autoGenerate === false;
      const scheduledDrawTimes =
        isManual && Array.isArray(values.scheduledDrawTimes)
          ? values.scheduledDrawTimes
              .filter((d): d is Dayjs => Boolean(d))
              .map((d) => d.toISOString())
          : undefined;
      const startDate =
        isManual && values.startDate ? values.startDate.toISOString() : null;

      const ticketLength = values.ticketLength;
      const rawTiers: PrizeTierInput[] = Array.isArray(values.prizeTiers)
        ? values.prizeTiers
        : [];
      const tiers: PrizeTierInput[] = rawTiers.filter(
        (t) => t?.tier && t?.amount,
      );
      const countByTier = (name: string): number => {
        const count = tiers.find((t) => t.tier === name)?.count;
        return Number.isFinite(Number(count)) ? Number(count) : 0;
      };

      const basic = {
        name: values.name,
        gameType: GAME_TYPE,
        status: values.status ? 1 : 0,
        isHidden: values.isHidden ? 1 : 0,
        sortOrder: values.sortOrder,
        minBet: values.minBet,
        maxBet: values.maxBet,
        sellingPrice: values.sellingPrice,
        drawInterval: isManual ? 0 : values.drawInterval,
        digitCount: ticketLength,
        icon: values.icon,
        cover: values.cover,
        thumbnail: values.thumbnail,
        description: values.description,
        isLottery: 1,
        categoryId: 1,
        groupName: values.groupName,
        autoGenerate: values.autoGenerate,
        scheduledDrawTimes,
        startDate,
        stopBetBefore: values.stopBetBefore,
        stopBetBeforeSec: values.stopBetBefore,
        drawDelay: values.drawDelay,
        drawDelaySec: values.drawDelay,
        themeColor: hex(values.themeColor),
        bgColor: hex(values.bgColor),
        textColor: hex(values.textColor),
        borderColor: hex(values.borderColor),
      };

      const created = await api.post<unknown, CreateGameResponse>(
        'games/create',
        basic,
      );
      const gameId = created.id;

      if (gameId) {
        await api.put(`games/${gameId}/config`, {
          prizeTiers: tiers.map((t, i) => ({
            level: TIER_LEVEL[t.tier] ?? i + 1,
            prizeLabel: t.name,
            prizeValue: t.amount,
          })),
          kerala: {
            ticketLength,
            prefix1st: (values.startChar ? values.startChar : '')
              .trim()
              .toUpperCase()
              .slice(0, 1),
            canInsurance: values.canInsurance ? 1 : 0,
            secondCount: countByTier('second'),
            thirdCount: countByTier('third'),
            fourthCount: countByTier('fourth'),
            fifthCount: countByTier('fifth'),
            consolationCount: countByTier('consolation'),
          },
        });
        const feeRate = Number(values.feeRate);
        await api.post(`fee-config/${gameId}`, {
          feeType: WIN_FEE_TYPE,
          feeRate: feeRate / 100,
          fixedFee: 0,
        });
      }

      message.success('Kerala lottery created successfully');
      navigate('/lottery/list');
    } catch (err) {
      if (isFormValidationError(err)) return;
      message.error(getApiErrorMessage(err, 'Failed to create kerala lottery'));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Draw Mode', description: 'Manual / Auto' },
    { title: 'Basic', description: 'Name & price' },
    { title: 'Prizes', description: 'Tiers & rules' },
    { title: 'Limits & Fee', description: 'Bet limits & fee' },
    { title: 'Appearance', description: 'Colours & media' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Create Kerala Lottery"
        subtitle="Series-based draw with multiple prize tiers and optional insurance"
        icon={<CrownOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/lottery/list')}>
            Back
          </Button>
        }
      />

      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 32 } }}>
        <Steps current={step} items={steps} style={{ marginBottom: 32 }} />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            drawInterval: 600,
            autoGenerate: true,
            status: true,
            isHidden: false,
            ticketLength: 6,
            stopBetBefore: 10,
            drawDelay: 5,
            sortOrder: 0,
            canInsurance: false,
            feeRate: 0,
            minBet: 0,
            maxBet: 0,
            sellingPrice: 10,
            prizeTiers: defaultPrizeTiers,
          }}
        >
          <div style={{ display: step === 0 ? 'block' : 'none' }}>
            <Form.Item name="autoGenerate" label="Draw Mode" valuePropName="checked">
              <Switch checkedChildren="Auto Draw" unCheckedChildren="Manual Draw" style={{ height: 28 }} />
            </Form.Item>
            {autoGenerate === false ? (
              <>
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Manual lottery — one or more draw times"
                  description="Add one or more draw times. Each is a one-time round shown to players as its own tab, drawn once when its time arrives via the Result & Draw tab. To run more later, edit the lottery and add more times."
                />
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  extra="Lottery goes live only after this date & time. Leave empty to be live immediately."
                >
                  <DatePicker
                    showTime={{ format: 'hh:mm A', use12Hours: true }}
                    format="YYYY-MM-DD hh:mm A"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Draw Date & Times" required style={{ marginBottom: 12 }}>
                  <Form.List
                    name="scheduledDrawTimes"
                    rules={[
                      {
                        validator: async (_, times) => {
                          if (!times || times.filter(Boolean).length < 1) {
                            return Promise.reject(
                              new Error('Add at least one draw time'),
                            );
                          }
                        },
                      },
                    ]}
                  >
                    {(fields, { add, remove }, { errors }) => (
                      <>
                        {fields.map(({ key, ...field }) => (
                          <Row
                            gutter={8}
                            key={key}
                            align="middle"
                            style={{ marginBottom: 8 }}
                          >
                            <Col flex="auto">
                              <Form.Item
                                {...field}
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                    message: 'Pick a draw date and time',
                                  },
                                  {
                                    validator: (_, value) =>
                                      !value || value.valueOf() > Date.now()
                                        ? Promise.resolve()
                                        : Promise.reject(
                                            new Error(
                                              'Draw time must be in the future',
                                            ),
                                          ),
                                  },
                                ]}
                              >
                                <DatePicker
                                  showTime={{ format: 'hh:mm A', use12Hours: true }}
                                  format="YYYY-MM-DD hh:mm A"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col flex="32px" style={{ textAlign: 'center' }}>
                              <MinusCircleOutlined
                                onClick={() => remove(field.name)}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add draw time
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </>
                    )}
                  </Form.List>
                </Form.Item>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="stopBetBefore"
                      label="Stop Bet Before (sec)"
                      extra="Ticket sales close this many seconds before each draw time"
                    >
                      <InputNumber min={0} max={86400} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Auto recurring lottery"
                  description="Rounds open and draw automatically every Round Duration, on repeat, with no manual action."
                />
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="drawInterval" label="Round Duration (sec)" rules={[{ required: true }]} extra="Time from round open to draw">
                      <InputNumber min={30} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="stopBetBefore" label="Stop Bet Before (sec)">
                      <InputNumber min={1} max={3600} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="drawDelay" label="Draw Delay (sec)">
                      <InputNumber min={0} max={300} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>

          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <Form.Item name="name" label="Lottery Name" rules={[{ required: true, message: 'Enter lottery name' }]}>
              <Input placeholder="e.g., Kerala Bumper 2026" size="large" maxLength={100} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="groupName" label="Group / Category" extra="e.g., KARUNYA, SAMRUDHI">
                  <Input placeholder="Lottery group name" size="large" maxLength={100} showCount />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="sellingPrice" label="Ticket Price" rules={[{ required: true, message: 'Set ticket price' }]}>
                  <InputNumber min={1} style={{ width: '100%' }} size="large" addonBefore="₹" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="themeColor" label="Theme Colour (unique to this lottery)" rules={[{ required: true, message: 'Pick a theme colour' }]} extra="Shown on the lottery card and in the user app">
              <ColorPicker format="hex" showText size="large" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Lottery rules or description" />
            </Form.Item>
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="startChar"
                  label="Round Number Letter"
                  rules={[{ required: true, message: 'Enter a series letter' }]}
                  extra="Series letter for round numbers (e.g. O → O-001)."
                >
                  <Input maxLength={1} placeholder="e.g. O" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="ticketLength" label="Digits per Ticket" rules={[{ required: true }]} extra="Number length for this Kerala lottery (typically 6)">
                  <InputNumber min={3} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="canInsurance" label="Allow Insurance" valuePropName="checked" extra="Players can buy insured tickets">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Prize Tiers & Win Prizes
            </Divider>
            <div style={{ textAlign: 'right', marginBottom: 8 }}>
              <Button size="small" onClick={loadDefaultTiers}>
                Load Kerala Default
              </Button>
            </div>
            <Form.List name="prizeTiers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'tier']} rules={[{ required: true, message: 'Tier' }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="tier (first…)" />
                        </Form.Item>
                      </Col>
                      <Col span={7}>
                        <Form.Item {...restField} name={[name, 'name']} style={{ marginBottom: 0 }}>
                          <Input placeholder="Label (1st Prize)" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true, message: 'Amount' }]} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="Win amount" min={0} style={{ width: '100%' }} addonBefore="₹" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} name={[name, 'count']} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="Winners" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ textAlign: 'right' }}>
                        <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ tier: '', name: '', amount: 0, count: 1 })}>
                    Add Prize Tier
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="minBet" label="Min Bet">
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="₹" placeholder="10" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="maxBet" label="Max Bet">
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="₹" placeholder="10000" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="feeRate" label="Win Fee (%)" extra="Deducted from each winning payout">
                  <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} addonAfter="%" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{ display: step === 4 ? 'block' : 'none' }}>
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="icon" label="Lottery Icon">
                  <ImageUpload folder="lottery" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="cover" label="Lottery Banner">
                  <ImageUpload folder="lottery" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="thumbnail" label="Thumbnail">
                  <ImageUpload folder="lottery" />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Theme Colours (this lottery only)
            </Divider>
            <Row gutter={16}>
              <Col xs={12} sm={8} md={6}>
                <Form.Item name="bgColor" label="Background">
                  <ColorPicker format="hex" showText />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Form.Item name="textColor" label="Text Color">
                  <ColorPicker format="hex" showText />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Form.Item name="borderColor" label="Border Color">
                  <ColorPicker format="hex" showText />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="sortOrder" label="Sort Order">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="status" label="Status" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="isHidden"
                  label="Hide from Players"
                  valuePropName="checked"
                  extra="Hidden games disappear from the app and stop accepting bets"
                >
                  <Switch checkedChildren="Hidden" unCheckedChildren="Visible" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>

        <Divider style={{ margin: '24px 0 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
            Previous
          </Button>
          <Space>
            <Button onClick={() => navigate('/lottery/list')}>Cancel</Button>
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSubmit} loading={saving}>
                Create Kerala Lottery
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateKeralaLotteryPage;

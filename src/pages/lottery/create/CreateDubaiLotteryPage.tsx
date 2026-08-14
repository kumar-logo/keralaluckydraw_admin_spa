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

const GAME_TYPE = 'dubai';
const RESULT_MODE_MAX_PROFIT = 'max_profit';
const WIN_FEE_TYPE = 'win_deduction';

type HexValue = string | { toHexString: () => string } | undefined | null;

const hex = (value: HexValue): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toHexString();
};

interface CreateGameResponse {
  id: number;
}

interface CreateDubaiFormValues {
  name: string;
  status: boolean;
  isHidden: boolean;
  sortOrder: number;
  minBet: number;
  maxBet: number;
  sellingPrice: number;
  drawInterval: number;
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
  maxPrize: string;
  payRate?: number;
  feeRate: number;
  themeColor?: HexValue;
  bgColor?: HexValue;
  textColor?: HexValue;
  borderColor?: HexValue;
}

const CreateDubaiLotteryPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateDubaiFormValues>();
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
      ['maxPrize'],
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
      const roundDuration = isManual ? 0 : values.drawInterval;

      const basic = {
        name: values.name,
        gameType: GAME_TYPE,
        status: values.status ? 1 : 0,
        isHidden: values.isHidden ? 1 : 0,
        sortOrder: values.sortOrder,
        minBet: values.minBet,
        maxBet: values.maxBet,
        sellingPrice: values.sellingPrice,
        drawInterval: roundDuration,
        icon: values.icon,
        cover: values.cover,
        thumbnail: values.thumbnail,
        description: values.description,
        groupName: values.groupName,
        categoryId: 1,
        source: 'TK',
        provider: 'TK',
        isLottery: 1,
        isThirdParty: 0,
        autoGenerate: values.autoGenerate,
        scheduledDrawTimes,
        startDate,
        stopBetBefore: values.stopBetBefore,
        drawDelay: values.drawDelay,
        maxPrize: values.maxPrize,
        resultMode: RESULT_MODE_MAX_PROFIT,
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
          maxPrize: values.maxPrize,
          payRate: values.payRate,
        });
        await api.post(`schedule/${gameId}`, {
          roundDuration,
          drawInterval: roundDuration,
          stopBetBefore: values.stopBetBefore,
          drawDelay: values.drawDelay,
          autoGenerate: values.autoGenerate,
          startDate,
          maxPrize: values.maxPrize,
        });
        const feeRate = Number(values.feeRate);
        if (feeRate > 0) {
          await api.post(`fee-config/${gameId}`, {
            feeType: WIN_FEE_TYPE,
            feeRate: feeRate / 100,
            fixedFee: 0,
          });
        }
      }

      message.success('Dubai lottery created successfully');
      navigate('/lottery/list');
    } catch (err) {
      if (isFormValidationError(err)) return;
      message.error(getApiErrorMessage(err, 'Failed to create dubai lottery'));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Draw Mode', description: 'Manual / Auto' },
    { title: 'Basic', description: 'Name & price' },
    { title: 'Config', description: 'Prize & odds' },
    { title: 'Limits & Fee', description: 'Bet limits & fee' },
    { title: 'Appearance', description: 'Colours & media' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Create Dubai Lottery"
        subtitle="Single-digit Emirates draw — players pick one number to win"
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
            drawInterval: 60,
            autoGenerate: true,
            status: true,
            isHidden: false,
            stopBetBefore: 10,
            drawDelay: 3,
            sortOrder: 0,
            minBet: 1,
            maxBet: 100000,
            sellingPrice: 10,
            maxPrize: '₹10',
            feeRate: 0,
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
              <Input placeholder="e.g., Dubai Lucky" size="large" maxLength={100} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="sellingPrice" label="Selling Price" rules={[{ required: true, message: 'Set selling price' }]} extra="Default chip / ticket price shown in the lobby">
                  <InputNumber min={0} style={{ width: '100%' }} size="large" addonBefore="₹" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="themeColor" label="Theme Colour (unique to this lottery)" rules={[{ required: true, message: 'Pick a theme colour' }]} extra="Shown on the lottery card in the player app">
                  <ColorPicker format="hex" showText size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="groupName"
              label="Group / Category Name"
              extra="Optional. Lotteries sharing this label are shown together under one heading on the home page. Leave blank to show this lottery on its own."
            >
              <Input placeholder="e.g., Dubai Lottery" size="large" maxLength={100} allowClear showCount />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Lottery rules or description" />
            </Form.Item>
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="maxPrize" label="Max Prize (display)" rules={[{ required: true, message: 'Set the displayed prize' }]} extra="Win-prize label shown on the card, e.g. ₹10 or 1000x">
                  <Input placeholder="e.g. ₹10" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="payRate" label="Pay Rate" extra="Payout multiplier for a winning single-digit pick">
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="e.g. 9" />
                </Form.Item>
              </Col>
            </Row>
            <Alert type="info" showIcon message="Additional bet types and odds for this lottery are configured on its detail page after creation." />
          </div>

          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="minBet" label="Min Bet">
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="₹" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="maxBet" label="Max Bet">
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="₹" />
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
                Create Dubai Lottery
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateDubaiLotteryPage;

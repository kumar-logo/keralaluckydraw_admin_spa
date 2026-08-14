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
} from 'antd';
import {
  BoxPlotOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '../../../services/api';
import PageHeader from '../../../components/PageHeader';
import ImageUpload from '../../../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../../../utils/apiError';

const GAME_TYPE = 'dice';
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

interface CreateDiceFormValues {
  name: string;
  status: boolean;
  isHidden: boolean;
  sortOrder: number;
  minBet: number;
  maxBet: number;
  sellingPrice: number;
  drawInterval: number;
  digitCount: number;
  icon?: string;
  cover?: string;
  thumbnail?: string;
  description?: string;
  autoGenerate: boolean;
  stopBetBefore: number;
  drawDelay: number;
  maxPrize: string;
  payRate?: number;
  isQuick: boolean;
  quickCycleSec: number;
  feeRate: number;
  themeColor?: HexValue;
  bgColor?: HexValue;
  textColor?: HexValue;
  borderColor?: HexValue;
}

const CreateDicePage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateDiceFormValues>();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const autoGenerate = Form.useWatch('autoGenerate', form);
  const isQuick = Form.useWatch('isQuick', form);

  const validateStep = async (current: number): Promise<boolean> => {
    const byStep: string[][] = [
      ['autoGenerate', 'drawInterval', 'stopBetBefore', 'drawDelay'],
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

      const roundDuration = values.drawInterval;
      const quick = values.isQuick ? 1 : 0;
      const quickCycleSec = values.isQuick ? values.quickCycleSec : 0;

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
        digitCount: values.digitCount,
        icon: values.icon,
        cover: values.cover,
        thumbnail: values.thumbnail,
        description: values.description,
        categoryId: 1,
        source: 'TK',
        provider: 'TK',
        isLottery: 0,
        isThirdParty: 0,
        autoGenerate: values.autoGenerate,
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
          digitCount: values.digitCount,
          isQuick: quick,
          quickCycleSec,
        });
        await api.post(`schedule/${gameId}`, {
          roundDuration,
          drawInterval: roundDuration,
          stopBetBefore: values.stopBetBefore,
          drawDelay: values.drawDelay,
          autoGenerate: values.autoGenerate,
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

      message.success('Dice game created successfully');
      navigate('/games');
    } catch (err) {
      if (isFormValidationError(err)) return;
      message.error(getApiErrorMessage(err, 'Failed to create dice game'));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Draw Mode', description: 'Manual / Auto' },
    { title: 'Basic', description: 'Name & price' },
    { title: 'Config', description: 'Prize & dice' },
    { title: 'Limits & Fee', description: 'Bet limits & fee' },
    { title: 'Appearance', description: 'Colours & media' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Create Dice Game"
        subtitle="Dice — players bet on the three-dice total, Big / Small, Odd / Even, or combinations"
        icon={<BoxPlotOutlined />}
        iconBg="var(--gradient-orange)"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/games')}>
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
            digitCount: 3,
            isQuick: false,
            quickCycleSec: 5,
            feeRate: 0,
          }}
        >
          <div style={{ display: step === 0 ? 'block' : 'none' }}>
            <Form.Item name="autoGenerate" label="Draw Mode" valuePropName="checked">
              <Switch checkedChildren="Auto Draw" unCheckedChildren="Manual Draw" style={{ height: 28 }} />
            </Form.Item>
            {autoGenerate === false && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Manual Mode"
                description="Rounds open automatically but wait for you to trigger the draw from the game's Result & Draw tab."
              />
            )}
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
          </div>

          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <Form.Item name="name" label="Game Name" rules={[{ required: true, message: 'Enter game name' }]}>
              <Input placeholder="e.g., Dice 1Min" size="large" maxLength={100} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="sellingPrice" label="Selling Price" rules={[{ required: true, message: 'Set selling price' }]} extra="Default chip / ticket price shown in the lobby">
                  <InputNumber min={0} style={{ width: '100%' }} size="large" addonBefore="₹" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="themeColor" label="Theme Colour (unique to this game)" rules={[{ required: true, message: 'Pick a theme colour' }]} extra="Shown on the game card in the player app">
                  <ColorPicker format="hex" showText size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Game rules or description" />
            </Form.Item>
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="maxPrize" label="Max Prize (display)" rules={[{ required: true, message: 'Set the displayed prize' }]} extra="Win-prize label shown on the card, e.g. ₹10 or 1000x">
                  <Input placeholder="e.g. ₹10" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="digitCount" label="Dice Count" extra="Number of dice in each draw (Dice uses 3)">
                  <InputNumber min={1} max={6} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="payRate" label="Pay Rate" extra="Optional global payout multiplier scalar">
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Leave blank for default" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="isQuick" label="Quick Mode" valuePropName="checked" extra="Run shortened quick-draw rounds">
                  <Switch checkedChildren="Quick" unCheckedChildren="Normal" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="quickCycleSec" label="Quick Cycle (sec)" extra="Cycle length when Quick mode is on">
                  <InputNumber min={0} style={{ width: '100%' }} addonAfter="s" disabled={!isQuick} />
                </Form.Item>
              </Col>
            </Row>
            <Alert type="info" showIcon message="Betting odds for each total / Big-Small / Odd-Even bet are configured on the game's Odds tab after creation." />
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
                <Form.Item name="icon" label="Game Icon">
                  <ImageUpload folder="games" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="cover" label="Game Banner">
                  <ImageUpload folder="games" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="thumbnail" label="Thumbnail">
                  <ImageUpload folder="games" />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Theme Colours (this game only)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
            Previous
          </Button>
          <Space wrap>
            <Button onClick={() => navigate('/games')}>Cancel</Button>
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSubmit} loading={saving}>
                Create Dice Game
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateDicePage;

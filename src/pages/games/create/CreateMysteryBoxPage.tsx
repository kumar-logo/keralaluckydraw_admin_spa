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
  GiftOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '../../../services/api';
import PageHeader from '../../../components/PageHeader';
import ImageUpload from '../../../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../../../utils/apiError';

const GAME_TYPE = 'mystery_box';
const RESULT_MODE_MAX_PROFIT = 'max_profit';
const WIN_FEE_TYPE = 'win_deduction';
const BOX_ROUND_DURATION = 60;

type HexValue = string | { toHexString: () => string } | undefined | null;

const hex = (value: HexValue): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toHexString();
};

interface CreateGameResponse {
  id: number;
}

interface CreateMysteryBoxFormValues {
  name: string;
  status: boolean;
  isHidden: boolean;
  sortOrder: number;
  minBet: number;
  maxBet: number;
  sellingPrice: number;
  icon?: string;
  cover?: string;
  thumbnail?: string;
  description?: string;
  maxPrize: string;
  coinType: number;
  freeCount: number;
  feeRate: number;
  themeColor?: HexValue;
  bgColor?: HexValue;
  textColor?: HexValue;
  borderColor?: HexValue;
}

const CreateMysteryBoxPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateMysteryBoxFormValues>();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const validateStep = async (current: number): Promise<boolean> => {
    const byStep: string[][] = [
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

      const basic = {
        name: values.name,
        gameType: GAME_TYPE,
        status: values.status ? 1 : 0,
        isHidden: values.isHidden ? 1 : 0,
        sortOrder: values.sortOrder,
        minBet: values.minBet,
        maxBet: values.maxBet,
        sellingPrice: values.sellingPrice,
        drawInterval: BOX_ROUND_DURATION,
        icon: values.icon,
        cover: values.cover,
        thumbnail: values.thumbnail,
        description: values.description,
        categoryId: 1,
        source: 'TK',
        provider: 'TK',
        isLottery: 0,
        isThirdParty: 0,
        autoGenerate: true,
        stopBetBefore: 10,
        drawDelay: 3,
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
          box: {
            coinType: values.coinType,
            freeCount: values.freeCount,
          },
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

      message.success('Mystery Box created successfully');
      navigate('/games');
    } catch (err) {
      if (isFormValidationError(err)) return;
      message.error(getApiErrorMessage(err, 'Failed to create mystery box'));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Basic', description: 'Name & price' },
    { title: 'Config', description: 'Box settings' },
    { title: 'Limits & Fee', description: 'Bet limits & fee' },
    { title: 'Appearance', description: 'Colours & media' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Create Mystery Box"
        subtitle="Players spend coins to open a box and win one of its prize items"
        icon={<GiftOutlined />}
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
            status: true,
            isHidden: false,
            sortOrder: 0,
            minBet: 0,
            maxBet: 0,
            sellingPrice: 10,
            maxPrize: '₹10',
            coinType: 1,
            freeCount: 0,
            feeRate: 0,
          }}
        >
          <div style={{ display: step === 0 ? 'block' : 'none' }}>
            <Form.Item name="name" label="Box Name" rules={[{ required: true, message: 'Enter box name' }]}>
              <Input placeholder="e.g., Lipstick Box" size="large" maxLength={100} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="sellingPrice" label="Open Price (coins)" rules={[{ required: true, message: 'Set the open price' }]} extra="Coins charged to open the box once">
                  <InputNumber min={0} style={{ width: '100%' }} size="large" addonBefore="₹" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="themeColor" label="Theme Colour (unique to this box)" rules={[{ required: true, message: 'Pick a theme colour' }]} extra="Shown on the box card in the player app">
                  <ColorPicker format="hex" showText size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Box rules or description" />
            </Form.Item>
          </div>

          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="maxPrize" label="Max Prize (display)" rules={[{ required: true, message: 'Set the displayed prize' }]} extra="Top-prize label shown on the card">
                  <Input placeholder="e.g. ₹10" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="coinType" label="Coin Type" extra="Wallet used to pay for an open">
                  <InputNumber min={1} max={9} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="freeCount" label="Free Opens" extra="Free opens granted per player">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Alert type="info" showIcon message="Prize items (name, icon, prize value and drop rate) are configured on the Mystery Box detail page after creation." />
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
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

          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="icon" label="Box Icon">
                  <ImageUpload folder="games" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="cover" label="Box Banner">
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
              Theme Colours (this box only)
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
                Create Mystery Box
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateMysteryBoxPage;

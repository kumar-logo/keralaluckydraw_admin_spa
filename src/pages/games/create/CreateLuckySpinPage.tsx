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
  RedoOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import api from '../../../services/api';
import PageHeader from '../../../components/PageHeader';
import ImageUpload from '../../../components/ImageUpload';
import { getApiErrorMessage, isFormValidationError } from '../../../utils/apiError';

const GAME_TYPE = 'lucky_spin';
const RESULT_MODE_MAX_PROFIT = 'max_profit';

type HexValue = string | { toHexString: () => string } | undefined | null;

const hex = (value: HexValue): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.toHexString();
};

interface CreateGameResponse {
  id: number;
}

interface CreateLuckySpinFormValues {
  name: string;
  status: boolean;
  isHidden: boolean;
  sortOrder: number;
  sellingPrice: number;
  icon?: string;
  cover?: string;
  thumbnail?: string;
  description?: string;
  maxPrize: string;
  themeColor?: HexValue;
  bgColor?: HexValue;
  textColor?: HexValue;
  borderColor?: HexValue;
}

const CreateLuckySpinPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateLuckySpinFormValues>();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const validateStep = async (current: number): Promise<boolean> => {
    const byStep: string[][] = [['name', 'sellingPrice', 'themeColor'], ['maxPrize'], []];
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
        sellingPrice: values.sellingPrice,
        drawInterval: 0,
        icon: values.icon,
        cover: values.cover,
        thumbnail: values.thumbnail,
        description: values.description,
        categoryId: 1,
        source: 'TK',
        provider: 'TK',
        isLottery: 0,
        isThirdParty: 0,
        autoGenerate: false,
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
        await api.put(`games/${gameId}/config`, { maxPrize: values.maxPrize });
      }

      message.success('Lucky Spin created successfully');
      navigate('/games');
    } catch (err) {
      if (isFormValidationError(err)) return;
      message.error(getApiErrorMessage(err, 'Failed to create lucky spin'));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Basic', description: 'Name & price' },
    { title: 'Config', description: 'Prize' },
    { title: 'Appearance', description: 'Colours & media' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Create Lucky Spin"
        subtitle="Players spend a spin to win one of the wheel's prize segments"
        icon={<RedoOutlined />}
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
            sellingPrice: 10,
            maxPrize: '₹10',
          }}
        >
          <div style={{ display: step === 0 ? 'block' : 'none' }}>
            <Form.Item name="name" label="Spin Name" rules={[{ required: true, message: 'Enter spin name' }]}>
              <Input placeholder="e.g., Lucky Spin" size="large" maxLength={100} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="sellingPrice" label="Spin Price (coins)" rules={[{ required: true, message: 'Set the spin price' }]} extra="Coins charged for a single spin">
                  <InputNumber min={0} style={{ width: '100%' }} size="large" addonBefore="₹" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="themeColor" label="Theme Colour (unique to this spin)" rules={[{ required: true, message: 'Pick a theme colour' }]} extra="Shown on the spin card in the player app">
                  <ColorPicker format="hex" showText size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Spin rules or description" />
            </Form.Item>
          </div>

          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="maxPrize" label="Max Prize (display)" rules={[{ required: true, message: 'Set the displayed prize' }]} extra="Top-prize label shown on the card">
                  <Input placeholder="e.g. ₹10" />
                </Form.Item>
              </Col>
            </Row>
            <Alert type="info" showIcon message="Wheel segments, weights and free spins are configured on the Lucky Spin detail page after creation." />
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="icon" label="Spin Icon">
                  <ImageUpload folder="games" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="cover" label="Spin Banner">
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
              Theme Colours (this spin only)
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
                Create Lucky Spin
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateLuckySpinPage;

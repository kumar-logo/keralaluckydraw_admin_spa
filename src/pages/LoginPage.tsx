import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import {
  LockOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { useAdminStore, type AdminInfo } from '../store';
import { getApiErrorMessage } from '../utils/apiError';

interface LoginResponse {
  admin: AdminInfo;
  token: string;
}

const BALL_COLORS = [
  '#e63946', '#1d6fb8', '#2a9d4a', '#e8a200', '#7b3fbf', '#ee7b1a',
  '#d6336c', '#0d9488', '#c1121f', '#3f51b5', '#0ea5e9',
];
const BALL_NUMBERS = ['7', '21', '3', '45', '9', '12', '33', '5', '18', '27', '8', '1'];

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAdminStore((s) => s.setAuth);

  const balls = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const duration = 9 + Math.random() * 7;
        return {
          color: BALL_COLORS[i % BALL_COLORS.length],
          num: BALL_NUMBERS[i % BALL_NUMBERS.length],
          left: 2 + i * 8.2,
          duration,
          delay: -Math.random() * duration,
        };
      }),
    [],
  );

  const coins = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, j) => {
        const duration = 8 + Math.random() * 6;
        return { left: 8 + j * 13, duration, delay: -Math.random() * duration };
      }),
    [],
  );

  const sparks = useMemo(
    () =>
      Array.from({ length: 24 }).map(() => {
        const duration = 2 + Math.random() * 4;
        return {
          left: Math.random() * 100,
          top: Math.random() * 100,
          duration,
          delay: -Math.random() * duration,
        };
      }),
    [],
  );

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await api.post<unknown, LoginResponse>('auth/login', values);
      setAuth(data.admin, data.token);
      message.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-overlay" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />
      <div className="login-orb login-orb-4" />
      <div className="login-lottery">
        {balls.map((b, i) => (
          <div
            key={`ball-${i}`}
            className="login-ball"
            style={{
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.6), ${b.color} 60%)`,
            }}
          >
            <span>{b.num}</span>
          </div>
        ))}
        {coins.map((c, i) => (
          <div
            key={`coin-${i}`}
            className="login-coin"
            style={{
              left: `${c.left}%`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            ₹
          </div>
        ))}
      </div>
      <div className="login-particles">
        {sparks.map((s, i) => (
          <div
            key={`spark-${i}`}
            className="login-particle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="login-card">
        <div className="login-card-inner">
          <div className="login-header">
            <div className="login-logo">
              <img src="/images/logos/logo.png" alt="Kerala Lucky Draw" />
            </div>
            <h1 className="login-title">Kerala Lucky Draw</h1>
            <p className="login-subtitle">Admin Control Panel</p>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="Enter your username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="Enter your password"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-btn"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <ThunderboltOutlined style={{ marginRight: 8 }} />
                    Sign In
                  </>
                )}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <div className="login-footer-line" />
            <span className="login-footer-text">Secure Admin Access</span>
            <div className="login-footer-line" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

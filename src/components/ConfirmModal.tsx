import { Modal, Button } from 'antd';
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  open,
  title,
  description,
  okText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  danger = true,
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const accent = danger ? '#ef4444' : 'var(--primary, #0891b2)';
  const accentBg = danger ? 'rgba(239,68,68,0.12)' : 'rgba(8,145,178,0.12)';
  return (
    <Modal
      open={open}
      centered
      footer={null}
      closable={false}
      maskClosable={!loading}
      onCancel={onCancel}
      width={416}
      styles={{
        body: { padding: '32px 28px 24px' },
        content: { borderRadius: 18 },
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: accentBg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 28, color: accent, lineHeight: 1 }}>
            {icon || (danger ? <DeleteOutlined /> : <ExclamationCircleFilled />)}
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            marginBottom: 26,
          }}
        >
          {description}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button block size="large" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            block
            size="large"
            type="primary"
            danger={danger}
            loading={loading}
            onClick={onConfirm}
          >
            {okText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

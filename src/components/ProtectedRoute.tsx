import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store';
import { adminHasPermission, type Permission } from '../constants/permissions';

interface ProtectedRouteProps {
  requiredPermission: Permission;
  children: React.ReactNode;
}

const ProtectedRoute = ({
  requiredPermission,
  children,
}: ProtectedRouteProps) => {
  const admin = useAdminStore((s) => s.admin);
  const navigate = useNavigate();

  if (!admin) return null;

  if (adminHasPermission(admin, requiredPermission)) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <Result
        icon={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
        title="Access Denied"
        subTitle={`This page requires the "${requiredPermission}" permission. Your role (${admin.role}) does not grant it.`}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        }
      />
    </div>
  );
};

export default ProtectedRoute;

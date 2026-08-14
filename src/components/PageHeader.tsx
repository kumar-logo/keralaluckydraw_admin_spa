import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  extra?: ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  iconBg = 'var(--gradient-green)',
  extra,
}: PageHeaderProps) => (
  <div className="page-header animate-fade-in">
    <div className="page-header-left">
      {icon && (
        <div className="page-header-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <div>
        <h2 className="page-header-title">{title}</h2>
        {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
      </div>
    </div>
    {extra && <div>{extra}</div>}
  </div>
);

export default PageHeader;

import { useMemo } from 'react';
import { Checkbox, Empty } from 'antd';

export interface PermissionOption {
  code: string;
  name: string;
  groupName: string;
}

interface PermissionGroup {
  groupName: string;
  options: PermissionOption[];
}

interface PermissionSelectorProps {
  permissions: PermissionOption[];
  value: string[];
  onChange: (codes: string[]) => void;
}

const UNGROUPED_LABEL = 'General';

const buildGroups = (permissions: PermissionOption[]): PermissionGroup[] => {
  const byGroup = new Map<string, PermissionOption[]>();
  for (const permission of permissions) {
    const groupName = permission.groupName || UNGROUPED_LABEL;
    const list = byGroup.get(groupName) ?? [];
    list.push(permission);
    byGroup.set(groupName, list);
  }
  return Array.from(byGroup.entries()).map(([groupName, options]) => ({
    groupName,
    options,
  }));
};

const PermissionSelector = ({
  permissions,
  value,
  onChange,
}: PermissionSelectorProps) => {
  const groups = useMemo(() => buildGroups(permissions), [permissions]);
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (code: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...value, code])));
      return;
    }
    onChange(value.filter((c) => c !== code));
  };

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    const groupCodes = group.options.map((o) => o.code);
    if (checked) {
      onChange(Array.from(new Set([...value, ...groupCodes])));
      return;
    }
    const groupSet = new Set(groupCodes);
    onChange(value.filter((c) => !groupSet.has(c)));
  };

  if (groups.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No permissions available"
      />
    );
  }

  return (
    <div
      style={{
        maxHeight: 360,
        overflowY: 'auto',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      {groups.map((group) => {
        const groupCodes = group.options.map((o) => o.code);
        const checkedCount = groupCodes.filter((c) => selected.has(c)).length;
        const allChecked = checkedCount === groupCodes.length;
        const indeterminate = checkedCount > 0 && !allChecked;
        return (
          <div key={group.groupName} style={{ marginBottom: 14 }}>
            <Checkbox
              checked={allChecked}
              indeterminate={indeterminate}
              onChange={(e) => toggleGroup(group, e.target.checked)}
              style={{
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: 'var(--text-secondary)',
              }}
            >
              {group.groupName}
            </Checkbox>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 6,
                padding: '8px 0 0 24px',
              }}
            >
              {group.options.map((option) => (
                <Checkbox
                  key={option.code}
                  checked={selected.has(option.code)}
                  onChange={(e) => toggle(option.code, e.target.checked)}
                >
                  {option.name}
                </Checkbox>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionSelector;

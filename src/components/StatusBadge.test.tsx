import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import { useConfigStore } from '../store/configStore';

const seedStatusMaps = () => {
  useConfigStore.setState({
    statusMaps: {
      recharge: {
        0: { text: 'Pending', color: 'orange' },
        1: { text: 'Success', color: 'green' },
        2: { text: 'Failed', color: 'red' },
      },
      withdraw: {
        0: { text: 'Pending', color: 'gold' },
        1: { text: 'Approved', color: 'green' },
      },
    },
  });
};

describe('StatusBadge', () => {
  beforeEach(() => {
    seedStatusMaps();
  });

  it('renders the configured text for a recharge status', () => {
    render(<StatusBadge kind="recharge" status={1} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('maps the backend colour to the right design-system class', () => {
    render(<StatusBadge kind="recharge" status={0} />);
    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('status-badge');
    // orange -> pending in COLOR_TO_CLASS
    expect(badge).toHaveClass('pending');
  });

  it('maps a green success status to the active class', () => {
    render(<StatusBadge kind="recharge" status={1} />);
    expect(screen.getByText('Success')).toHaveClass('active');
  });

  it('maps a red failed status to the inactive class', () => {
    render(<StatusBadge kind="recharge" status={2} />);
    expect(screen.getByText('Failed')).toHaveClass('inactive');
  });

  it('renders the default Unknown/cancelled badge for an out-of-map numeric status', () => {
    render(<StatusBadge kind="recharge" status={99} />);
    const badge = screen.getByText('Unknown');
    // default colour maps to the cancelled class.
    expect(badge).toHaveClass('cancelled');
  });

  it('uses the fallbackText when status is non-numeric (no entry lookup possible)', () => {
    render(
      <StatusBadge kind="recharge" status={'n/a'} fallbackText="Custom" />,
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders the config kind active/inactive purely from the numeric value', () => {
    const { rerender } = render(
      <StatusBadge kind="config" status={1} activeText="On" inactiveText="Off" />,
    );
    const active = screen.getByText('On');
    expect(active).toHaveClass('active');

    rerender(
      <StatusBadge kind="config" status={0} activeText="On" inactiveText="Off" />,
    );
    expect(screen.getByText('Off')).toHaveClass('inactive');
  });
});

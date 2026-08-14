import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MoneyText from './MoneyText';

describe('MoneyText', () => {
  it('renders a formatted rupee amount', () => {
    render(<MoneyText value={1500} />);
    expect(screen.getByText('₹1,500.00')).toBeInTheDocument();
  });

  it('auto variant colours positive amounts green', () => {
    render(<MoneyText value={100} variant="auto" />);
    const el = screen.getByText('₹100.00');
    expect(el).toHaveClass('amount-positive');
  });

  it('auto variant colours negative amounts red', () => {
    render(<MoneyText value={-100} variant="auto" />);
    const el = screen.getByText('₹-100.00');
    expect(el).toHaveClass('amount-negative');
  });

  it('auto variant treats zero (and non-finite) as neutral', () => {
    render(<MoneyText value={0} variant="auto" />);
    expect(screen.getByText('₹0.00')).toHaveClass('amount-neutral');
  });

  it('applies the explicit approve variant used by recharge queues', () => {
    render(<MoneyText value={250} variant="approve" />);
    expect(screen.getByText('₹250.00')).toHaveClass('amount-approve');
  });

  it('adds the large modifier class when large is set', () => {
    render(<MoneyText value={10} variant="neutral" large />);
    const el = screen.getByText('₹10.00');
    expect(el).toHaveClass('amount-neutral');
    expect(el).toHaveClass('amount-large');
  });

  it('renders the zeroAs placeholder instead of ₹0.00 when value is zero', () => {
    render(<MoneyText value={0} zeroAs="Free" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText('₹0.00')).not.toBeInTheDocument();
  });

  it('shows a plus sign on positive amounts when showSign is set', () => {
    render(<MoneyText value={75} showSign />);
    expect(screen.getByText('+₹75.00')).toBeInTheDocument();
  });
});

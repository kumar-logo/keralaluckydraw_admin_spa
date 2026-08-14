import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import DrawDigitInput from './DrawDigitInput';

const Harness = ({
  length,
  labels,
}: {
  length: number;
  labels?: string[];
}) => {
  const [value, setValue] = useState('');
  return (
    <>
      <DrawDigitInput length={length} value={value} onChange={setValue} labels={labels} />
      <div data-testid="value">{value}</div>
    </>
  );
};

describe('DrawDigitInput (result-entry boxes)', () => {
  it('renders exactly one box per result digit', () => {
    render(<DrawDigitInput length={3} value="" />);
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
  });

  it('renders the positional labels above the boxes', () => {
    render(<DrawDigitInput length={3} value="" labels={['A', 'B', 'C']} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('accepts digit input and builds the combined result string', async () => {
    const user = userEvent.setup();
    render(<Harness length={3} />);
    const boxes = screen.getAllByRole('textbox');

    await user.type(boxes[0], '4');
    await user.type(boxes[1], '5');
    await user.type(boxes[2], '6');

    expect(screen.getByTestId('value')).toHaveTextContent('456');
  });

  it('rejects non-numeric characters (digits only in the result)', async () => {
    const user = userEvent.setup();
    render(<Harness length={3} />);
    const boxes = screen.getAllByRole('textbox');

    await user.type(boxes[0], 'a');
    expect(screen.getByTestId('value')).toHaveTextContent('');

    await user.type(boxes[0], '7');
    expect(screen.getByTestId('value')).toHaveTextContent('7');
  });

  it('reflects an existing value into the per-digit boxes', () => {
    render(<DrawDigitInput length={3} value="789" onChange={vi.fn()} />);
    const boxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(boxes[0].value).toBe('7');
    expect(boxes[1].value).toBe('8');
    expect(boxes[2].value).toBe('9');
  });

  it('renders a series-prefix box when onPrefixChange is provided', () => {
    render(
      <DrawDigitInput
        length={2}
        value=""
        onPrefixChange={vi.fn()}
        prefixLabel="Series"
      />,
    );
    expect(screen.getByText('Series')).toBeInTheDocument();
    // prefix box + 2 digit boxes
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
  });
});

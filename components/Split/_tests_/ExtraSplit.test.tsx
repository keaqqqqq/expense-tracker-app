import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExtraSplit from '../ExtraSplit';
import { useExpense } from '@/context/ExpenseContext';

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('ExtraSplit Component', () => {
  const mockExpense = {
    amount: 100,
    spliter: [
      { id: '1', name: 'John Doe', email: 'john@example.com', amount: 0 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', amount: 0 }
    ]
  };

  const mockRemoveFriendFromSplit = jest.fn();
  const mockUpdateFriendAmount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExpense as jest.Mock).mockReturnValue({
      expense: mockExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount
    });
  });

  it('renders all friends in the split', () => {
    render(<ExtraSplit />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows initial equal split amount for each person', () => {
    render(<ExtraSplit />);
    const amounts = screen.getAllByText('50.00 RM');
    expect(amounts).toHaveLength(2);
  });

  it('shows correct summary information', () => {
    render(<ExtraSplit />);
    
    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    
    expect(summaryDiv).toHaveTextContent('Total adjustments');
    expect(summaryDiv).toHaveTextContent('RM');
    expect(summaryDiv).toHaveTextContent('0.00');
    expect(summaryDiv).toHaveTextContent('Remaining amount to split');
    expect(summaryDiv).toHaveTextContent('100.00');
  });

  it('removes a friend when clicking the remove button', () => {
    render(<ExtraSplit />);
    const removeButtons = screen.getAllByText('x');
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
  });

  it('updates adjustments when input value changes', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '20' } });

    const amounts = screen.getAllByText(/60.00 RM/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('handles multiple adjustment changes correctly', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '20' } });
    fireEvent.change(inputs[1], { target: { value: '30' } });

    const summaryDiv = screen.getByText(/Enter adjustments/).parentElement;
    expect(summaryDiv).toHaveTextContent(/Total adjustments.*50.00/);
    expect(summaryDiv).toHaveTextContent(/Remaining amount to split.*50.00/);
    expect(summaryDiv).toHaveTextContent(/Amount per user.*25.00/);
  });

  it('initializes with zero adjustments', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach(input => {
      expect(input).toHaveValue(0);
    });
  });

  it('handles edge case when total adjustments equal total amount', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '100' } });

    const summaryDiv = screen.getByText(/Enter adjustments/).parentElement;
    expect(summaryDiv).toHaveTextContent(/Remaining amount to split.*0.00/);
    expect(summaryDiv).toHaveTextContent(/Amount per user.*0.00/);
  });
});
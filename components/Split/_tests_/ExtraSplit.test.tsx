import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExtraSplit from '../ExtraSplit';
import { useExpense } from '@/context/ExpenseContext';

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface Expense {
  amount: number;
  splitter: Array<{ id: string; amount: number }>;
  split_data?: Array<{ id: string; value: number }>;
  split_preference?: string;
  group_id?: string;
}

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('ExtraSplit Component', () => {
  const mockFriendList: Friend[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  const mockExpense: Expense = {
    amount: 100,
    splitter: [
      { id: '1', amount: 0 },
      { id: '2', amount: 0 }
    ],
    split_data: []
  };

  const mockRemoveFriendFromSplit = jest.fn();
  const mockUpdateFriendAmount = jest.fn();
  const mockSetSplitData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExpense as jest.Mock).mockReturnValue({
      expense: mockExpense,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
  });

  it('renders all friends in the split', () => {
    render(<ExtraSplit />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows initial equal split amount for each person', () => {
    render(<ExtraSplit />);
    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    expect(summaryDiv).toHaveTextContent('Amount per friend: RM 50.00');
  });

  it('shows correct summary information', () => {
    render(<ExtraSplit />);
    
    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total adjustments: RM 0.00');
    expect(summaryDiv).toHaveTextContent('Remaining amount to split: RM 100.00');
    expect(summaryDiv).toHaveTextContent('Amount per friend: RM 50.00');
  });

  it('removes a friend when clicking the remove button', () => {
    render(<ExtraSplit />);
    const removeButtons = screen.getAllByText('x');
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
    expect(mockSetSplitData).toHaveBeenCalled();
  });

  it('updates adjustments when input value changes', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '20' } });

    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total adjustments: RM 20.00');
    expect(summaryDiv).toHaveTextContent('Remaining amount to split: RM 80.00');
    expect(summaryDiv).toHaveTextContent('Amount per friend: RM 40.00');
  });

  it('handles multiple adjustment changes correctly', () => {
    render(<ExtraSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '20' } });
    fireEvent.change(inputs[1], { target: { value: '30' } });

    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total adjustments: RM 50.00');
    expect(summaryDiv).toHaveTextContent('Remaining amount to split: RM 50.00');
    expect(summaryDiv).toHaveTextContent('Amount per friend: RM 25.00');
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

    const summaryDiv = screen.getByText('Enter adjustments to reflect who owes extra. The remainder will be split equally.').parentElement;
    expect(summaryDiv).toHaveTextContent('Remaining amount to split: RM 0.00');
    expect(summaryDiv).toHaveTextContent('Amount per friend: RM 0.00');
  });
});
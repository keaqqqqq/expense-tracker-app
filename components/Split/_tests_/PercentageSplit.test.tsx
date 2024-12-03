import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PercentageSplit from '../PercentageSplit';
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
  id?: string;
}

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('PercentageSplit Component', () => {
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

  it('renders initial state correctly', () => {
    render(<PercentageSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    const summaryDiv = screen.getByText('Specify the percentages that are fair for your situation.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total percentage: 0%');
    expect(summaryDiv).toHaveTextContent('Under by: 100%');
  });

  it('updates percentage and amount when input changes', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    
    const summaryDiv = screen.getByText('Specify the percentages that are fair for your situation.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total percentage: 60%');
    expect(summaryDiv).toHaveTextContent('Under by: 40%');
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 60);
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 60 }]);
  });

  it('handles percentage exceeding 100%', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    fireEvent.change(inputs[1], { target: { value: '50' } });
    
    const summaryDiv = screen.getByText('Specify the percentages that are fair for your situation.').parentElement;
    expect(summaryDiv).toHaveTextContent('Exceeded by: 10%');
  });

  it('removes friend when clicking remove button', () => {
    render(<PercentageSplit />);
    
    const removeButtons = screen.getAllByRole('button', { name: 'x' });
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
    expect(mockSetSplitData).toHaveBeenCalled();
  });

  it('limits percentage input between 0 and 100', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '120' } });
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 100 }]);
    
    fireEvent.change(inputs[0], { target: { value: '-20' } });
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 0 }]);
  });

  it('calculates amounts correctly for given percentages', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '75' } });
    fireEvent.change(inputs[1], { target: { value: '25' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 75);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 25);
  });

  it('updates friend amounts in context when percentages change', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 60);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 0);
  });

  it('maintains percentages when expense amount changes', () => {
    const { rerender } = render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    
    const updatedMockExpense = {
      ...mockExpense,
      amount: 200
    };
    
    (useExpense as jest.Mock).mockReturnValue({
      expense: updatedMockExpense,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
    
    rerender(<PercentageSplit />);
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 120);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 0);
  });

  it('loads existing split data correctly', () => {
    const expenseWithSplitData = {
      ...mockExpense,
      id: '1',
      split_data: [
        { id: '1', value: 60 },
        { id: '2', value: 40 }
      ]
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: expenseWithSplitData,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });

    render(<PercentageSplit />);
    
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(60);
    expect(inputs[1]).toHaveValue(40);
  });
});
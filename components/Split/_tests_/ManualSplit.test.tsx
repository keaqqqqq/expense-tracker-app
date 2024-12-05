/* eslint no-use-before-define: 0 */ // --> OFF
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManualSplit from '../ManualSplit';
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
}

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('ManualSplit Component', () => {
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
    render(<ManualSplit />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows initial summary information', () => {
    render(<ManualSplit />);
    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total: RM 100.00');
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 0.00');
  });

  it('removes a friend when clicking the remove button', () => {
    render(<ManualSplit />);
    const removeButtons = screen.getAllByRole('button', { name: 'x' });
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
    expect(mockSetSplitData).toHaveBeenCalled();
  });

  it('updates amount when input value changes', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });

    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 60.00');
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 60);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 40);
  });

  it('shows correct total entered amount after input', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });

    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 60.00');
  });

  it('handles multiple amount inputs correctly', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    fireEvent.change(inputs[1], { target: { value: '40' } });

    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 100.00');
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 60);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 40);
  });

  it('calculates remaining amount correctly for unspecified users', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '75' } });

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 75);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 25);
  });

  it('calls updateFriendAmount with correct values', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 60);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 40);
  });

  it('handles non-numeric input gracefully', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: 'abc' } });

    // Should update with default values when invalid input is provided
    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 0.00');
  });

  it('handles reset amount button correctly', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    // First set a value
    fireEvent.change(inputs[0], { target: { value: '60' } });
    
    // Then reset it
    const resetButtons = screen.getAllByRole('button', { name: 'x' });
    const resetButton = resetButtons[resetButtons.length - 1]; // Get the last x button (amount reset)
    fireEvent.click(resetButton);

    expect(mockSetSplitData).toHaveBeenCalledWith([]);
  });
});
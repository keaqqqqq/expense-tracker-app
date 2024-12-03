import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeightSplit from '../WeightSplit';
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

describe('WeightSplit Component', () => {
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
    render(<WeightSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    const summaryDiv = screen.getByText(/Specify how the expense should be split/).parentElement;
    expect(summaryDiv).toHaveTextContent('Total weight: 0');
    expect(summaryDiv).toHaveTextContent('Total expense: 100 RM');
  });

  it('updates amounts when weights change', async () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    // First update
    fireEvent.change(inputs[0], { target: { value: '2' } });
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 2 }]);
    
    // Update mock to include first change
    (useExpense as jest.Mock).mockReturnValue({
      expense: { ...mockExpense, split_data: [{ id: '1', value: 2 }] },
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
    
    // Second update
    fireEvent.change(inputs[1], { target: { value: '2' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 50);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 50);
  });

  it('maintains weights when expense amount changes', () => {
    const { rerender } = render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    
    const updatedMockExpense = {
      ...mockExpense,
      amount: 200,
      split_data: [
        { id: '1', value: 1 },
        { id: '2', value: 1 }
      ]
    };
    
    (useExpense as jest.Mock).mockReturnValue({
      expense: updatedMockExpense,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
    
    rerender(<WeightSplit />);
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 100);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 100);
  });

  it('updates context with correct amounts', async () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    // First update
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 1 }]);
    
    // Update mock to include first change
    (useExpense as jest.Mock).mockReturnValue({
      expense: { ...mockExpense, split_data: [{ id: '1', value: 1 }] },
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
    
    // Second update
    fireEvent.change(inputs[1], { target: { value: '1' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 50);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 50);
  });

  it('handles decimal weights correctly', async () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    // First update
    fireEvent.change(inputs[0], { target: { value: '1.5' } });
    expect(mockSetSplitData).toHaveBeenCalledWith([{ id: '1', value: 1.5 }]);
    
    // Update mock to include first change
    (useExpense as jest.Mock).mockReturnValue({
      expense: { ...mockExpense, split_data: [{ id: '1', value: 1.5 }] },
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });
    
    // Second update
    fireEvent.change(inputs[1], { target: { value: '0.5' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 75);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 25);
  });

  it('removes friend when clicking remove button', () => {
    render(<WeightSplit />);
    const removeButtons = screen.getAllByRole('button', { name: 'x' });
    
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 0);
    expect(mockSetSplitData).toHaveBeenCalledWith([]);
  });

  it('loads existing split data correctly', () => {
    const expenseWithSplitData = {
      ...mockExpense,
      split_data: [
        { id: '1', value: 2 },
        { id: '2', value: 1 }
      ]
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: expenseWithSplitData,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData
    });

    render(<WeightSplit />);
    
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(2);
    expect(inputs[1]).toHaveValue(1);
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 66.67);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 33.33);
  });
});
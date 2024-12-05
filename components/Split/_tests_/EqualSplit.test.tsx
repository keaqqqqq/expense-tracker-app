/* eslint no-use-before-define: 0 */ // --> OFF
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EqualSplit from '../EqualSplit';
import { useExpense } from '@/context/ExpenseContext';

// Define proper interfaces with required properties
interface Friend {
  id: string;
  name: string;
  email: string;
  amount?: number;
}

interface Expense {
  amount: number;
  splitter: Array<{ id: string; amount: number }>;
  split_preference: string;
  group_id: string;
}

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn(),
}));

describe('EqualSplit Component', () => {
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
    split_preference: 'equal',
    group_id: '1'
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
      setSplitData: mockSetSplitData,
    });
  });

  it('renders all users in the split', () => {
    render(<EqualSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows initial split information', () => {
    render(<EqualSplit />);
    expect(screen.getByText('Select which people owe an equal share')).toBeInTheDocument();
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 50);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 50);
  });

  it('calls removeFriendFromSplit when remove button is clicked', () => {
    render(<EqualSplit />);
    const removeButtons = screen.getAllByRole('button', { name: 'x' });
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
  });

  it('updates amounts when number of friends changes', () => {
    const updatedExpense = {
      ...mockExpense,
      splitter: [
        { id: '1', amount: 0 },
        { id: '2', amount: 0 },
        { id: '3', amount: 0 }
      ]
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: updatedExpense,
      friendList: [
        ...mockFriendList,
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com' }
      ],
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData,
    });

    render(<EqualSplit />);

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 33.33);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 33.33);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('3', 33.33);
  });

  it('handles zero amount case correctly', () => {
    const zeroExpense = {
      ...mockExpense,
      amount: 0
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: zeroExpense,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData,
    });

    render(<EqualSplit />);

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 0);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 0);
  });

  it('only updates amounts when split_preference is equal', () => {
    const unequalExpense = {
      ...mockExpense,
      split_preference: 'unequal'
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: unequalExpense,
      friendList: mockFriendList,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
      setSplitData: mockSetSplitData,
    });

    render(<EqualSplit />);

    expect(mockUpdateFriendAmount).not.toHaveBeenCalled();
    expect(mockSetSplitData).toHaveBeenCalledWith([]);
  });

  it('resets split data when group_id changes', () => {
    render(<EqualSplit />);
    expect(mockSetSplitData).toHaveBeenCalledWith([]);
  });
});
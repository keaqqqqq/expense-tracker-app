import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EqualSplit from '../EqualSplit';
import { useExpense } from 'context/ExpenseContext';

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn(),
}));

describe('EqualSplit Component', () => {
  const mockExpense = {
    amount: 100,
    spliter: [
      { id: '1', name: 'John Doe', email: 'john@example.com', amount: 0 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', amount: 0 },
    ],
  };

  const mockRemoveFriendFromSplit = jest.fn();
  const mockUpdateFriendAmount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useExpense as jest.Mock).mockReturnValue({
      expense: mockExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
    });
  });

  it('renders all users in the split', () => {
    render(<EqualSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays correct equal split amount for each user', () => {
    render(<EqualSplit />);
    
    const expectedAmount = '50.00';
    const amounts = screen.getAllByText(expectedAmount);
    expect(amounts).toHaveLength(2);
  });

  it('calls removeFriendFromSplit when remove button is clicked', () => {
    render(<EqualSplit />);
    
    const removeButtons = screen.getAllByText('x');
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
  });

  it('updates friend amounts when expense amount changes', () => {
    const newExpense = {
      ...mockExpense,
      amount: 150, 
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: newExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
    });

    render(<EqualSplit />);

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 75);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 75);
  });

  it('updates friend amounts when number of spliters changes', () => {
    const newExpense = {
      ...mockExpense,
      spliter: [
        { id: '1', name: 'John Doe', email: 'john@example.com', amount: 0 },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', amount: 0 },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', amount: 0 },
      ],
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: newExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
    });

    render(<EqualSplit />);

    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 33.33);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 33.33);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('3', 33.33);
  });

  it('handles zero amount case correctly', () => {
    const newExpense = {
      ...mockExpense,
      amount: 0,
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: newExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
    });

    render(<EqualSplit />);

    const amounts = screen.getAllByText('0.00');
    expect(amounts).toHaveLength(2);
  });

  it('handles empty spliter array correctly', () => {
    const newExpense = {
      ...mockExpense,
      spliter: [],
    };

    (useExpense as jest.Mock).mockReturnValue({
      expense: newExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount,
    });

    render(<EqualSplit />);

    expect(screen.getByText('Select which people owe an equal share')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeightSplit from '../WeightSplit';
import { useExpense } from '@/context/ExpenseContext';

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('WeightSplit Component', () => {
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

  it('renders initial state correctly', () => {
    render(<WeightSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    expect(screen.getByText('Total weight:')).toBeInTheDocument();
    const totalWeightDiv = screen.getByText('Total weight:').parentElement;
    expect(totalWeightDiv).toHaveTextContent('0');
    
    const amounts = screen.getAllByText(/0\.00 RM/);
    expect(amounts).toHaveLength(2);
  });

  it('updates amounts when weights change', () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '2' } });
    
    expect(screen.getByText(/100\.00 RM/)).toBeInTheDocument();
    
    const totalWeightDiv = screen.getByText('Total weight:').parentElement;
    expect(totalWeightDiv).toHaveTextContent('2');
    
    fireEvent.change(inputs[1], { target: { value: '2' } });
    
    const fiftyAmounts = screen.getAllByText(/50\.00 RM/);
    expect(fiftyAmounts).toHaveLength(2);
  });

  it('maintains weights when expense amount changes', () => {
    const { rerender } = render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    
    const updatedMockExpense = {
      ...mockExpense,
      amount: 200
    };
    
    (useExpense as jest.Mock).mockReturnValue({
      expense: updatedMockExpense,
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount
    });
    
    rerender(<WeightSplit />);
    
    expect(inputs[0]).toHaveValue(1);
    expect(inputs[1]).toHaveValue(1);
    
    const hundredAmounts = screen.getAllByText(/100\.00 RM/);
    expect(hundredAmounts).toHaveLength(2);
  });

  it('updates context with correct amounts', () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('1', 50);
    expect(mockUpdateFriendAmount).toHaveBeenCalledWith('2', 50);
  });

  it('handles decimal weights correctly', () => {
    render(<WeightSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '1.5' } });
    fireEvent.change(inputs[1], { target: { value: '0.5' } });

    expect(screen.getByText('75.00 RM')).toBeInTheDocument();
    expect(screen.getByText('25.00 RM')).toBeInTheDocument();
  });
});
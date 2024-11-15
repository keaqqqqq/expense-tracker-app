import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManualSplit from '../ManualSplit';
import { useExpense } from '@/context/ExpenseContext';

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('ManualSplit Component', () => {
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
    const removeButtons = screen.getAllByText('x');
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
  });

  it('updates amount when input value changes', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });

    expect(screen.getByText('60.00 RM')).toBeInTheDocument();
    expect(screen.getByText('40.00 RM')).toBeInTheDocument();
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

    expect(screen.getByText('60.00 RM')).toBeInTheDocument();
    expect(screen.getByText('40.00 RM')).toBeInTheDocument();

    const summaryDiv = screen.getByText('Specify exactly how much each person owes.').parentElement;
    expect(summaryDiv).toHaveTextContent('Total Entered: RM 100.00');
  });

  it('calculates remaining amount correctly for unspecified users', () => {
    render(<ManualSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '75' } });

    expect(screen.getByText('75.00 RM')).toBeInTheDocument();
    expect(screen.getByText('25.00 RM')).toBeInTheDocument();
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

    const amounts = screen.getAllByText('50.00 RM');
    expect(amounts).toHaveLength(2);
  });
});
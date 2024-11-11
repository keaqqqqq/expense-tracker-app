import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PercentageSplit from '../PercentageSplit';
import { useExpense } from '@/context/ExpenseContext';

jest.mock('@/context/ExpenseContext', () => ({
  useExpense: jest.fn()
}));

describe('PercentageSplit Component', () => {
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

  const getTextContent = (text: string) => {
    return screen.getByText((content) => content.trim() === text);
  };

  it('renders initial state correctly', () => {
    render(<PercentageSplit />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    expect(screen.getByText('Total percentage: 0%')).toBeInTheDocument();
    expect(screen.getByText('Under by: 100%')).toBeInTheDocument();
  });

  it('updates percentage and amount when input changes', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    
    expect(screen.getByText('60.00 RM')).toBeInTheDocument();
    expect(screen.getByText('Total percentage: 60%')).toBeInTheDocument();
    expect(screen.getByText('Under by: 40%')).toBeInTheDocument();
  });

  it('handles percentage exceeding 100%', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '60' } });
    fireEvent.change(inputs[1], { target: { value: '50' } });
    
    expect(screen.getByText('Exceeded by: 10%')).toBeInTheDocument();
  });

  it('removes friend when clicking remove button', () => {
    render(<PercentageSplit />);
    
    const removeButtons = screen.getAllByRole('button', { name: 'x' });
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFriendFromSplit).toHaveBeenCalledWith('1');
  });

  it('limits percentage input between 0 and 100', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '120' } });
    expect(inputs[0]).toHaveValue(100);
    
    fireEvent.change(inputs[0], { target: { value: '-20' } });
    expect(inputs[0]).toHaveValue(0);
  });

  it('calculates amounts correctly for given percentages', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '75' } });
    fireEvent.change(inputs[1], { target: { value: '25' } });
    
    expect(screen.getByText('75.00 RM')).toBeInTheDocument();
    expect(screen.getByText('25.00 RM')).toBeInTheDocument();
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
      removeFriendFromSplit: mockRemoveFriendFromSplit,
      updateFriendAmount: mockUpdateFriendAmount
    });
    
    rerender(<PercentageSplit />);
    
    expect(inputs[0]).toHaveValue(60);
    expect(screen.getByText('120.00 RM')).toBeInTheDocument(); 
  });

  it('handles fractional percentages correctly', () => {
    render(<PercentageSplit />);
    const inputs = screen.getAllByRole('spinbutton');
    
    fireEvent.change(inputs[0], { target: { value: '33.33' } });
    
    expect(screen.getByText('33.33 RM')).toBeInTheDocument();
  });
});
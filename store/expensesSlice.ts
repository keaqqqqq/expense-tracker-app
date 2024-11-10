// src/store/expensesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createExpenseAPI, editExpenseAPI, deleteExpenseAPI, fetchExpensesAPI } from '@/api/expenses';
import { Expense } from '@/types/Expense';


interface ExpensesState {
    expense: Omit<Expense, 'id'>;
    expenses: Expense[];
    loading: boolean;
    error: string | null;
}

const initialState: ExpensesState = {
    expense: {
        description: "",
        date: "",
        amount: 0,
        category: "",
        created_at: "",
        created_by: "sdf",
        group_id: '',
        split_preference: '',
        payer: [],
        spliter:[]

    },
    expenses: [],
    loading: true,
    error: null,
};

// Async thunk for fetching expenses
export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
    const response = await fetchExpensesAPI();
    console.log(response);
    return response.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});
createExpenseAPI
// Async thunk for creating an expense
export const addExpenseAsync = createAsyncThunk('expenses/addExpense', async (expense: Expense) => {
    const response = await createExpenseAPI(expense);
    return response; // Return the created expense
});

// Async thunk for editing an expense
export const editExpenseAsync = createAsyncThunk('expenses/editExpense', async (expense: Expense) => {
    const response = await editExpenseAPI(expense);
    return response; // Return the updated expense
});

// Async thunk for deleting an expense
export const deleteExpenseAsync = createAsyncThunk('expenses/deleteExpense', async (id: string) => {
    await deleteExpenseAPI(id); // Call the API to delete
    return id; // Return the ID of the deleted expense
});

const expensesSlice = createSlice({
    name: 'expenses',
    initialState,
    reducers: {
        setDescription(state, action: PayloadAction<string>) {
            state.expense.description = action.payload;
        },
        setAmount(state, action: PayloadAction<number>) {
            state.expense.amount = action.payload;
        },
        setDate(state, action: PayloadAction<string>) {
            state.expense.date = action.payload;
        },
        setCategory(state, action: PayloadAction<string>) {
            state.expense.category = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetch expenses
            .addCase(fetchExpenses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                state.loading = false;
                state.expenses = action.payload; // Update expenses with fetched data
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch expenses';
            })
            // Handle add expense
            .addCase(addExpenseAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(addExpenseAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.expenses.push(action.payload); // Add the new expense
            })
            .addCase(addExpenseAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create expense';
            })
            // Handle edit expense
            .addCase(editExpenseAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(editExpenseAsync.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
                if (index !== -1) {
                    state.expenses[index] = action.payload; // Update the edited expense
                }
            })
            .addCase(editExpenseAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to edit expense';
            })
            // Handle delete expense
            .addCase(deleteExpenseAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteExpenseAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.expenses = state.expenses.filter(exp => exp.id !== action.payload); // Remove deleted expense
            })
            .addCase(deleteExpenseAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete expense';
            });
    },
});

export default expensesSlice.reducer;
export const {
    setDescription,
    setAmount,
    setDate,
    setCategory,
} = expensesSlice.actions;


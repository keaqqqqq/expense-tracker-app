import { Transaction } from "@/types/Transaction";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Expense } from "@/types/Expense";
import { ChartDataCollection, DonutData } from "@/types/ChartData";
import { Group } from "@/types/Group";
import ExpenseCategories from "@/types/ExpenseCategories";
export const fetchTransactionsByExpenseId = async (payer_id: string): Promise<Transaction[]> => {
    try {
        // Create a query against the transactions collection
        const q = query(
            collection(db, 'Transactions'),
            where('payer_id', '==', payer_id),
        );


        // Execute the query
        const querySnapshot = await getDocs(q);

        // Map the documents to transactions
        const transactions: Transaction[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));

        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};


export const fetchTransactionsByUserId = async (userId: string): Promise<Transaction[]> => {
    try {
        // Create a query for payer_id
        const payerQuery = query(
            collection(db, 'Transactions'),
            where('payer_id', '==', userId)
        );

        // Create a query for receiver_id
        const receiverQuery = query(
            collection(db, 'Transactions'),
            where('receiver_id', '==', userId)
        );

        // Fetch transactions for both payer_id and receiver_id
        const [payerSnapshot, receiverSnapshot] = await Promise.all([
            getDocs(payerQuery),
            getDocs(receiverQuery),
        ]);

        // Map the documents to transactions
        const payerTransactions: Transaction[] = payerSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Transaction));

        const receiverTransactions: Transaction[] = receiverSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Transaction));

        // Combine the payer and receiver transactions
        const allTransactions = [...payerTransactions, ...receiverTransactions];

        return allTransactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

const fetchExpensesByUser = async (userId: string) => {
    const expensesRef = collection(db, "Expenses");
    const expensesSnapshot = await getDocs(expensesRef);

    const filteredExpenses: Expense[] = expensesSnapshot.docs
        .map(doc => doc.data() as Expense)
        .filter(expense =>
            expense.payer?.some(p => p.id === userId) ||
            expense.splitter?.some(s => s.id === userId)
        );

    return filteredExpenses;
};

export const tryFetch = () => { return 'try fetch' }
// Utility to generate categories for the last N months
const generateMonthlyCategories = (monthsCount: number): string[] => {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const categories = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const yearOffset = currentMonth - i < 0 ? -1 : 0;
        const year = currentYear + yearOffset;
        categories.push(`${months[monthIndex]} ${year}`);
    }
    return categories;
};

// Utility to calculate how many months ago a date occurred
const calculateMonthsAgo = (date: string): number => {
    const currentDate = new Date();
    const transactionDate = new Date(date);
    return (
        (currentDate.getFullYear() - transactionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - transactionDate.getMonth())
    );
};

// Main report function for monthly expense
const getMonthlyExpense = (expenses: Expense[], id: string) => {
    const categories = generateMonthlyCategories(7);
    const data = new Array(7).fill(0);

    expenses.forEach((expense) => {
        const monthsAgo = calculateMonthsAgo(expense.date);

        if (monthsAgo >= 0 && monthsAgo < 7) {
            const payer = expense.payer.find((p) => p.id === id);
            if (payer) {
                data[6 - monthsAgo] += payer.amount;
            }
        }
    });

    return {
        categories,
        series: [
            {
                name: 'Expense',
                data,
            },
        ],
        color: '#10B981',
    };
};

const getMonthlyTransfer = (transactions: Transaction[], id: string) => {
    // Generate the categories for the last 7 months
    const categories = generateMonthlyCategories(7);

    // Initialize data array with zeros for the last 7 months
    const data = new Array(7).fill(0);

    // Process each transaction to calculate the monthly transfer
    transactions.forEach((transaction) => {
        const monthsAgo = calculateMonthsAgo(transaction.created_at);

        if (
            monthsAgo >= 0 &&
            monthsAgo < 7 &&
            transaction.payer_id === id &&
            transaction.expense_id === 'direct-payment'
        ) {
            data[6 - monthsAgo] += transaction.amount;
        }
    });

    return {
        categories,
        series: [
            {
                name: 'Transfer',
                data,
            },
        ],
        color: '#F59E0B',
    };
};

const getMonthlyReceived = (transactions: Transaction[], id: string) => {
    // Generate the categories for the last 7 months
    const categories = generateMonthlyCategories(7);

    // Initialize data array with zeros for the last 7 months
    const data = new Array(7).fill(0);

    // Process each transaction to calculate the monthly transfer
    transactions.forEach((transaction) => {
        const monthsAgo = calculateMonthsAgo(transaction.created_at);

        if (
            monthsAgo >= 0 &&
            monthsAgo < 7 &&
            transaction.receiver_id === id &&
            transaction.expense_id === 'direct-payment'
        ) {
            data[6 - monthsAgo] += transaction.amount;
        }
    });

    return {
        categories,
        series: [
            {
                name: 'Received',
                data,
            },
        ],
        color: '#A855F7',
    };
};

const getMonthlySplit = (expenses: Expense[], id: string) => {
    const categories = generateMonthlyCategories(7);
    const data = new Array(7).fill(0);

    expenses.forEach((expense) => {
        const monthsAgo = calculateMonthsAgo(expense.date);

        if (monthsAgo >= 0 && monthsAgo < 7) {
            const splitter = expense.splitter.find((p) => p.id === id);
            if (splitter) {
                data[6 - monthsAgo] += splitter.amount;
            }
        }
    });

    return {
        categories,
        series: [
            {
                name: 'Split',
                data,
            },
        ],
        color: '#3B82F6',
    };
};

const getChartData = (transaction: Transaction[], id: string, expenses: Expense[]) => {
    return {
        monthlyReceived: getMonthlyReceived(transaction, id),
        monthlyExpense: getMonthlyExpense(expenses, id),
        monthlyTransfer: getMonthlyTransfer(transaction, id),
        monthlySplit: getMonthlySplit(expenses, id)
    };
}

const getExpenseByCategory = (expenses: Expense[], id: string) => {
    // Initialize an object to hold the total amount per category
    const categoryTotals: { [key: string]: number } = {};
  
    // Iterate over each expense to calculate the total amount by category
    expenses.forEach(expense => {
      // Filter the payers for the specific user id
      const userPayers = expense.payer.filter(payer => payer.id === id);
  
      // Sum the amounts for the user
      const userTotal = userPayers.reduce((sum, payer) => sum + payer.amount, 0);
  
      // If the user has an amount for this category, add it to the category total
      if (userTotal > 0) {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += userTotal;
      }
    });
  
    
  
    // Prepare the chart series data as percentage values
    const chartSeries = Object.values(categoryTotals).map(amount => Number(amount.toFixed(2)));
  
    // Prepare the chart labels (e.g., ["Food", "Transport", "Entertainment", "Bills", "Others"])
    const chartLabels = Object.keys(categoryTotals).map(category => {
        // Find the matching category in ExpenseCategories
        const matchedCategory = ExpenseCategories.find(cat => cat.value === category);
        
        // Return the label if found, otherwise return the original category
        return matchedCategory ? matchedCategory.label : category;
      });
  
    // Return the chart data
    return {
      chartSeries,
      chartLabels,
      title:'Amount Paid By Categories'
    };
  };

  const getExpenseByGroup = async (expenses: Expense[], id: string) => {
    // Initialize an object to hold the total amount per group_id
    const groupsRef = collection(db, 'Groups');
    
    // Fetch all groups from the database
    const groupsSnapshot = await getDocs(groupsRef);
    const groupsData = groupsSnapshot.docs
      .filter(doc => {
        const data = doc.data() as Group;
        return data.members?.some(m => m.id === id) || data.pending_members?.some(m => m.id === id);
      })
      .map(doc => ({
          ...(doc.data() as Group),
          id: doc.id
      }));
  
    const groupTotals: { [key: string]: number } = {};
  
    // Iterate over each expense to calculate the total amount by group_id
    expenses.forEach(expense => {
      // Filter the payers for the specific user id
      const userPayers = expense.payer.filter(payer => payer.id === id);
  
      // Sum the amounts for the user
      const userTotal = userPayers.reduce((sum, payer) => sum + payer.amount, 0);
  
      // If the user has an amount for this expense, add it to the group total
      if (userTotal > 0) {
        // Check for null or empty group_id, and group them as "Non-Group"
        const groupId = expense.group_id && expense.group_id!== ""? expense.group_id: 'Non-Group'; // Default to 'Non-Group' for null or empty group_id
        if (!groupTotals[groupId]) {
          groupTotals[groupId] = 0;
        }
        groupTotals[groupId] += userTotal;
      }
    });
      
    // Prepare the chart series data as percentage values
    const chartSeries = Object.values(groupTotals).map(amount => Number(amount.toFixed(2)) );
  
    // Prepare the chart labels (group names)
    const chartLabels = Object.keys(groupTotals).map(groupId => {
      if (groupId === 'Non-Group') {
        return 'Non-Group Expense'; // Label for non-group expenses
      }
      // Find the group name for each groupId
      const group = groupsData.find(group => group.id === groupId);
      return group ? group.name : 'Unknown Group'; // Return the group name or a fallback
    });
  
    // Return the chart data with the title
    return {
      chartSeries,
      chartLabels,
      title: 'Amount Paid By Groups'
    };
  };
  

export const getTotalPaid = async (id: string): Promise<{ totalSplit: number, totalTransfer: number, totalPaid: number, totalReceived: number, transactions: Transaction[], chartData: ChartDataCollection, expenses: Expense[], categoryDonut:DonutData, groupDonut:DonutData }> => {
    const transactions = await fetchTransactionsByUserId(id);
    const expenses = await fetchExpensesByUser(id);
    let totalPaid = 0;
    let totalReceived = 0;
    let totalSplit = 0;
    let totalTransfer = 0;
    transactions.forEach(t => {    
        if (t.payer_id == id && t.type == '')
            totalTransfer = Number((totalTransfer + t.amount).toFixed(2)); // Properly update totalPaid
        if (t.receiver_id == id && t.type == '')
            totalReceived = Number((totalReceived + t.amount).toFixed(2));

    });

    expenses.forEach(e =>{
        const payer = e.payer.find(p => p.id ==id)
        const splitter = e.splitter.find(p => p.id ==id)
        
        if(payer){
            totalPaid += payer.amount;
        }
        if(splitter){
            totalSplit += splitter.amount;
        }
    })

    const chartData = getChartData(transactions, id, expenses);
    const categoryDonut = getExpenseByCategory(expenses, id);
    const groupDonut = await getExpenseByGroup(expenses, id);
    return { totalPaid, totalReceived, transactions, totalSplit, totalTransfer, chartData, expenses, categoryDonut, groupDonut };
};
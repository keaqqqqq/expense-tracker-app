import { db } from "@/firebase/config";
import { Expense } from "@/types/Expense";
import { GroupedTransactions } from "@/types/ExpenseList";
import { collection, query, where, orderBy, getDocs} from "firebase/firestore";
import { fetchExpenseData } from "./expenses";
import { Transaction } from "@/types/Transaction";

export const fetchAllTransactions = async (
    currentUserId: string,
    friendIds?: string[],
    groupIds?: string[]
  ): Promise<GroupedTransactions[]> => {
    try {
      const transactionsRef = collection(db, 'Transactions');
      const queries = [];
      
      if (friendIds?.length) {
        for (const friendId of friendIds) {
          queries.push(query(
            transactionsRef,
            where('payer_id', '==', currentUserId),
            where('receiver_id', '==', friendId),
            where('group_id', '==', ''),
            orderBy('created_at', 'desc')
          ));
          
          queries.push(query(
            transactionsRef,
            where('payer_id', '==', friendId),
            where('receiver_id', '==', currentUserId),
            where('group_id', '==', ''),
            orderBy('created_at', 'desc')
          ));
        }
      }
  
      queries.push(query(
        transactionsRef,
        where('payer_id', '==', currentUserId),
        where('receiver_id', '==', currentUserId),
        where('group_id', '==', ''),
        orderBy('created_at', 'desc')
      ));
  
      if (groupIds?.length) {
        for (const groupId of groupIds) {
          queries.push(query(
            transactionsRef,
            where('group_id', '==', groupId),
            orderBy('created_at', 'desc')
          ));
        }
      }
  
      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      
      const allTransactions = snapshots
        .flatMap(snapshot => 
          snapshot.docs.map(doc => ({
            ...(doc.data() as Transaction),
            id: doc.id
          }))
        )

        console.log(allTransactions)
  
      const groupedTransactions: { [key: string]: Transaction[] } = {};
      
      for (const transaction of allTransactions) {
        const key = !transaction.expense_id || transaction.expense_id === 'direct-payment'
          ? `direct-payment-${transaction.id}`
          : transaction.expense_id;
        
        if (!groupedTransactions[key]) {
          groupedTransactions[key] = [];
        }
        groupedTransactions[key].push(transaction);
      }
  
      const result: GroupedTransactions[] = await Promise.all(
        Object.entries(groupedTransactions).map(async ([key, transactions]) => {
          let expense: Expense | undefined;
          if (!key.startsWith('direct-payment')) {
            try {
              expense = await fetchExpenseData(key);               
            } catch (error) {
              console.error(`Error fetching expense ${key}:`, error);
            }
          }
  
          return {
            expense,
            transactions: transactions.sort((a, b) => {
              if (a.type === 'settle' && b.type !== 'settle') return -1;
              if (a.type !== 'settle' && b.type === 'settle') return 1;
              return 0;
            })
          };
        })
      );

      return result.sort((a, b) => {
        const aDate = new Date(a.transactions[0].created_at).getTime();
        const bDate = new Date(b.transactions[0].created_at).getTime();
        return bDate - aDate;
      });
  
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  };

// export const fetchAllTransactions = async (currentUserId:string, friendIds: string[], groupIds: string[]):Promise<GroupedTransactions[]> =>{
//   const transactionRef = collection(db, 'Transactions');
//   const queries = [];

//   for(const friendId of friendIds){
//     queries.push(query(
//       transactionRef,
//       where('payer_id', '==', currentUserId),
//       where('receiver_id', '==', friendId),
//       where('group_id', '==', ''),
//       orderBy('created_at', 'desc')
//     ))

//     queries.push(query(
//       transactionRef,
//       where('payer_id', '==', friendId),
//       where('receiver_id', '==', currentUserId),
//       where('group_id', '==', ''),
//       orderBy('created_at', 'desc')
//     ))
//   }
  
//   queries.push(query(
//     transactionRef,
//     where('payer_id', '==', currentUserId),
//     where('receiver_id', '==', currentUserId),
//     where('group_id', '==', ''),
//     orderBy('created_at', 'desc')
//   ))

//   for(const groupId of groupIds){
//     queries.push(query(
//       transactionRef,
//       where('group_id', '==', groupId),
//       orderBy('created_at', 'desc')
//     ))
//   }

//   const snapShots = await Promise.all(queries.map(q => getDocs(q)));

//   const allTransactions = snapShots
//   .flatMap(snapShot => snapShot.docs.map(doc => ({
//     ...(doc.data() as Transaction),
//     id: doc.id
//   })))
  
//   const groupedTransactions: {[key: string]: Transaction[]} = {};

//   for(const transaction of allTransactions){
//     const key = !transaction.expense_id || transaction.expense_id=='direct-payment'
//     ? `direct--payment${transaction.expense_id}`
//     : transaction.expense_id

//     if(!groupedTransactions[key]){
//       groupedTransactions[key] = []
//     }
//       groupedTransactions[key].push(transaction)
//   }
  
//   const result: GroupedTransactions[] = await Promise.all(
//     Object.entries(groupedTransactions).map(async ([key, transactions])=>{
//       let expense: Expense | undefined;
//       if(!key.startsWith('direct-payment')){
//         try{
//           expense = await fetchExpenseData(key);
//         }catch(error){
//           console.log(error)
//         }
//       }
//       return{
//         expense,
//         transactions: transactions.sort((a,b) => {
//           if(a.type === 'settle' && b.type !== 'settle') return -1;
//           if(a.type !== 'settle' && b.type === 'settle') return 1;
//           return 0;
//         })
//       }
//     })
//   )
  
//   return result.sort((a,b) => {
//     const aDate = new Date(a.transactions[0].created_at).getTime();
//     const bDate = new Date(b.transactions[0].created_at).getTime();
//     return aDate - bDate;
//   })
// }

// export const fetchAllTransactions = async(currentUserId: string, friendIds: string[], groupIds: string[]): Promise<GroupedTransactions[]> =>{

//   const transRef = collection(db, 'Transactions');
//   const queries = [];

//   for(const friendId of friendIds){
//     queries.push(query(
//       transRef,
//       where('payer_id', '==', currentUserId),
//       where('receiver_id', '==', friendId),
//       where('group_id', '==', ''),
//       orderBy('created_at', 'desc')
//     ))

//     queries.push(query(
//       transRef,
//       where('payer_id', '==', friendId),
//       where('receiver_id', '==', currentUserId),
//       where('group_id', '==', ''),
//       orderBy('created_at', 'desc')
//     ))
//   }

//   queries.push(query(
//     transRef,
//     where('payer_id', '==', currentUserId),
//     where('receiver_id', '==', currentUserId),
//     where('group_id', '==', ''),
//     orderBy('created_at', 'desc')
//   ))

//   for(const groupId of groupIds){
//     queries.push(query(
//       transRef,
//       where('group_id', '==', groupId),
//       orderBy('created_at', 'desc')
//     ))
//   }

//   const snapShots = await Promise.all(queries.map(q => getDocs(q)));

//   const allTransactions = snapShots
//   .flatMap(snapShot => snapShot.docs.map(doc => ({
//     ...(doc.data() as Transaction),
//     id: doc.id
//   })))


//   console.log('All transactions: ' + JSON.stringify(allTransactions))

//   const groupedTransactions: {[key:string]: Transaction[]} = {};

//   for(const transactions of allTransactions){
//     const key = !transactions.expense_id || transactions.expense_id == 'direct-payment'
//     ? `direct-payment${transactions.expense_id}`
//     : transactions.expense_id

//     if(!groupedTransactions[key]){
//       groupedTransactions[key] = [];
//     }
//     groupedTransactions[key].push(transactions);
//   }

//   console.log('Grouped transactions: ' + JSON.stringify(groupedTransactions))
//   const result: GroupedTransactions[] = await Promise.all(
//     Object.entries(groupedTransactions).map(async ([key, transactions])=>{
//       let expense: Expense|undefined;
//       if(!key.startsWith('direct-payment')){
//         try{
//           expense = await fetchExpenseData(key);
//         }catch(error){
//           console.log(error);
//         }
//       }
//       return{
//         expense,
//         transactions: transactions.sort((a,b)=>{
//           if(a.type === 'settle' &&  b.type !== 'settle') return -1;
//           if(a.type !== 'settle' &&  b.type === 'settle') return 1;
//           return 0;
//         })
//       }
//     })
//   )
  
//   return result.sort((a,b) => {
//     const aDate = new Date(a.transactions[0].created_at).getTime();
//     const bDate = new Date(b.transactions[0].created_at).getTime();
//     return bDate - aDate;
//   })
// }
  
  export const fetchGroupTransactions = async (groupId: string): Promise<GroupedTransactions[]> => {
    try {
      const transactionsRef = collection(db, 'Transactions');
      
      const groupTransactionsQ = query(
        transactionsRef,
        where('group_id', '==', groupId),
        orderBy('created_at', 'desc')
      );
  
      const groupTransactionsSnapshot = await getDocs(groupTransactionsQ);
      const transactions = groupTransactionsSnapshot.docs
      .map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Transaction[];
  
      const groupedTransactions: { [key: string]: Transaction[] } = {};
      
      for (const transaction of transactions) {
        // Use the same key generation logic as fetchAllTransactions
        const key = !transaction.expense_id || transaction.expense_id === 'direct-payment'
          ? `direct-payment-${transaction.id}`  // Each direct payment gets its own unique key
          : transaction.expense_id;
        
        if (!groupedTransactions[key]) {
          groupedTransactions[key] = [];
        }
        groupedTransactions[key].push(transaction);
      }
  
      const result: GroupedTransactions[] = await Promise.all(
        Object.entries(groupedTransactions).map(async ([key, transactions]) => {
          let expense: Expense | undefined;
          if (!key.startsWith('direct-payment')) {
            expense = await fetchExpenseData(key);
          }
          return {
            expense,
            transactions: transactions.sort((a, b) => {
              if (a.type === 'settle' && b.type !== 'settle') return -1;
              if (a.type !== 'settle' && b.type === 'settle') return 1;
              return 0;
            })
          };
        })
      );
  
      // Sort by date descending
      return result.sort((a, b) => {
        const dateA = new Date(a.transactions[0].created_at).getTime();
        const dateB = new Date(b.transactions[0].created_at).getTime();
        return dateB - dateA;
      });
  
    } catch (error) {
      console.error('Error fetching group transactions:', error);
      return [];
    }
  };
  

  export const fetchTransactions = async (currentUserId: string, friendId: string): Promise<GroupedTransactions[]> => {
    try {
      const transactionsRef = collection(db, 'Transactions');
      
      const currentUserPayerQ = query(
        transactionsRef,
        where('payer_id', '==', currentUserId),
        where('receiver_id', '==', friendId),
        where('group_id', '==', ''),
        orderBy('created_at', 'desc')
      );
      
      const friendPayerQ = query(
        transactionsRef,
        where('payer_id', '==', friendId),
        where('receiver_id', '==', currentUserId),
        where('group_id', '==', ''),
        orderBy('created_at', 'desc')
      );
  
      const [currentUserPayerSnapshot, friendPayerSnapshot] = await Promise.all([
        getDocs(currentUserPayerQ),
        getDocs(friendPayerQ),
      ]);
  
      const allTransactions = [
        ...currentUserPayerSnapshot.docs,
        ...friendPayerSnapshot.docs,
      ]
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Transaction[];
  
      const validTransactions = await Promise.all(
        allTransactions.map(async (transaction) => {
          if (transaction.expense_id === 'direct-payment' || !transaction.expense_id) {
            return (
              (transaction.payer_id === currentUserId && transaction.receiver_id === friendId) ||
              (transaction.payer_id === friendId && transaction.receiver_id === currentUserId)
            ) ? transaction : null;
          }
  
          try {
            const expense = await fetchExpenseData(transaction.expense_id);
            
            if (!expense) return null;
  
            const involvedUserIds = [
              ...(expense.payer?.map(p => p.id) || []),
              ...(expense.splitter?.map(s => s.id) || [])
            ];
  
            const bothUsersInvolved = 
              involvedUserIds.includes(currentUserId) && 
              involvedUserIds.includes(friendId);
  
            return bothUsersInvolved ? transaction : null; //transaction is valid for current user and user's friend
  
          } catch (error) {
            console.error(`Error fetching expense ${transaction.expense_id}:`, error);
            return null;
          }
        })
      );
  
      const transactions = validTransactions
        .filter((t): t is Transaction => t !== null)
        .filter((transaction, index, self) =>
          index === self.findIndex(t => t.id === transaction.id)  //ensure valid transaction has same id as 
        );
  
      const groupedTransactions: { [key: string]: Transaction[] } = {};
      
      for (const transaction of transactions) {
        const key = transaction.expense_id === 'direct-payment' || !transaction.expense_id
          ? `direct-payment-${transaction.id}` 
          : transaction.expense_id;
        
        if (!groupedTransactions[key]) {
          groupedTransactions[key] = [];
        }
        groupedTransactions[key].push(transaction);
      }
  
      const result: GroupedTransactions[] = await Promise.all(
        Object.entries(groupedTransactions).map(async ([key, transactions]) => {
          let expense: Expense | undefined;
  
          if (!key.startsWith('direct-payment')) {
            expense = await fetchExpenseData(key);
          }
  
          return {
            expense,
            transactions: transactions.sort((a, b) => {
              if (a.type === 'settle' && b.type !== 'settle') return -1;
              if (a.type !== 'settle' && b.type === 'settle') return 1;
              return 0;
            })
          };
        })
      );
  
      return result.sort((a, b) => {
        const aDate = new Date(a.transactions[0].created_at).getTime();
        const bDate = new Date(b.transactions[0].created_at).getTime();
        return bDate - aDate;
      });
  
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
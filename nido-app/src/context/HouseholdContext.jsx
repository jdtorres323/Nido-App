import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext();

export function HouseholdProvider({ children }) {
  const { userProfile } = useAuth();
  const [activeHousehold, setActiveHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync active household info
  useEffect(() => {
    if (!userProfile?.currentHouseholdId) {
      setActiveHousehold(null);
      setMembers([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    const householdId = userProfile.currentHouseholdId;

    // Listen to Household basic info
    const unsubscribeHousehold = onSnapshot(doc(db, 'households', householdId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveHousehold({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => {
      console.error("Error fetching household:", error);
      setLoading(false);
    });

    // Listen to Members (Users who belong to this household)
    const membersQuery = query(collection(db, 'users'), where('householdIds', 'array-contains', householdId));
    const unsubscribeMembers = onSnapshot(membersQuery, (querySnap) => {
      const membersData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersData);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    // Listen to Expenses
    const expensesQuery = query(
      collection(db, 'expenses'), 
      where('householdId', '==', householdId)
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnap) => {
      let expensesData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid needing a Firestore composite index
      expensesData.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA; // Descending
      });
      setExpenses(expensesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
      unsubscribeExpenses();
    };
  }, [userProfile?.currentHouseholdId]);

  // Derived State: Balances (Who owes whom)
  const balances = useMemo(() => {
    if (!members.length || !expenses.length) return {};

    const netBalances = {}; // userId -> amount (positive means they are owed, negative means they owe)
    members.forEach(m => netBalances[m.id] = 0);

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      const paidBy = exp.paidBy;
      
      // Amount paid by the user
      netBalances[paidBy] += amount;

      // Subtract split shares
      // For now, assuming simple equal split among all household members unless specified
      const participants = exp.participants || members.map(m => m.id);
      const share = amount / participants.length;

      participants.forEach(pId => {
        if (netBalances[pId] !== undefined) {
          netBalances[pId] -= share;
        }
      });
    });

    return netBalances;
  }, [members, expenses]);

  const value = {
    activeHousehold,
    members,
    expenses,
    balances,
    loading
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}


export const useHousehold = () => useContext(HouseholdContext);

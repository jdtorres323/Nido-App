import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
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
    });

    // Listen to Members (Users who belong to this household)
    const membersQuery = query(collection(db, 'users'), where('householdIds', 'array-contains', householdId));
    const unsubscribeMembers = onSnapshot(membersQuery, (querySnap) => {
      const membersData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersData);
    });

    // Listen to Expenses
    const expensesQuery = query(
      collection(db, 'expenses'), 
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnap) => {
      const expensesData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
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

import { doc } from 'firebase/firestore'; // Fix for the missing import in the snippet above

export const useHousehold = () => useContext(HouseholdContext);

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
      const splitMode = exp.splitMode || 'equal';
      const participants = exp.participants || members.map(m => m.id);
      
      if (splitMode === 'custom' && exp.customSplits) {
        // Use manual assignments
        Object.entries(exp.customSplits).forEach(([pId, share]) => {
          if (netBalances[pId] !== undefined) {
            netBalances[pId] -= parseFloat(share);
          }
        });
      } else {
        // Equal split among participants
        const share = amount / participants.length;
        participants.forEach(pId => {
          if (netBalances[pId] !== undefined) {
            netBalances[pId] -= share;
          }
        });
      }
    });

    return netBalances;
  }, [members, expenses]);

  // Helper to get currency symbol
  const currencySymbol = useMemo(() => {
    if (!activeHousehold?.currency) return '€';
    switch (activeHousehold.currency) {
      case 'EUR': return '€';
      case 'USD': return 'US$';
      case 'UYU': return '$U';
      case 'MXN': return '$';
      case 'ARS': return '$';
      case 'COP': return '$';
      default: return '$';
    }
  }, [activeHousehold?.currency]);

  // Helper to format amount
  const formatAmount = (amount) => {
    const val = parseFloat(amount) || 0;
    return val.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: activeHousehold?.currency || 'EUR',
      minimumFractionDigits: 2
    });
  };

  const value = {
    activeHousehold,
    members,
    expenses,
    balances,
    loading,
    currencySymbol,
    formatAmount
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}


export const useHousehold = () => useContext(HouseholdContext);

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
import { normalizeExpense, calculateBalances } from '../utils/expenseLogic';

const HouseholdContext = createContext();

export function HouseholdProvider({ children }) {
  const { userProfile } = useAuth();
  const [activeHousehold, setActiveHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);


  };

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
      const rawExpenses = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Normalize and Sort in memory to avoid needing a Firestore composite index immediately
      const normalizedExpenses = rawExpenses.map(exp => normalizeExpense(exp));
      
      normalizedExpenses.sort((a, b) => {
        // Sort by processedDate descending
        const dateA = a.processedDate || '0000-00-00';
        const dateB = b.processedDate || '0000-00-00';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        
        // Fallback to createdAt timestamp if dates are same
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
        return timeB - timeA;
      });

      setExpenses(normalizedExpenses);
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
    return calculateBalances(members, expenses);
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

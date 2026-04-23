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

  // Normalize expense data for consistent use across components
  const normalizeExpense = (exp) => {
    let processedDate = exp.date;
    if (!processedDate && exp.createdAt) {
      // Handle Firestore Timestamp or Date object/string
      const d = exp.createdAt.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt);
      processedDate = d.toLocaleDateString('sv'); // sv-SE uses YYYY-MM-DD
    }
    
    // Calculate total amount if it's an itemized expense, or use root amount
    let totalAmount = 0;
    if (exp.items && Array.isArray(exp.items) && exp.items.length > 0) {
      totalAmount = exp.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    } else {
      totalAmount = parseFloat(exp.amount) || 0;
    }

    return {
      ...exp,
      processedDate,
      totalAmount
    };
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
      const normalizedExpenses = rawExpenses.map(normalizeExpense);
      
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
    if (!members.length || !expenses.length) return {};

    const netBalances = {}; // userId -> amount (positive means they are owed, negative means they owe)
    members.forEach(m => netBalances[m.id] = 0);

    expenses.forEach(exp => {
      const amount = exp.totalAmount;
      const paidBy = exp.paidBy;
      
      // Amount paid by the user
      if (netBalances[paidBy] !== undefined) {
        netBalances[paidBy] += amount;
      }

      // If the expense has itemized lines, process each line's split
      if (exp.items && Array.isArray(exp.items) && exp.items.length > 0) {
        exp.items.forEach(item => {
          const itemAmount = parseFloat(item.amount) || 0;
          const itemSplitMode = item.splitMode || 'equal';
          const itemParticipants = item.participants || members.map(m => m.id);

          if (itemSplitMode === 'custom' && item.customSplits) {
            Object.entries(item.customSplits).forEach(([pId, share]) => {
              if (netBalances[pId] !== undefined) {
                netBalances[pId] -= parseFloat(share) || 0;
              }
            });
          } else {
            const share = itemAmount / itemParticipants.length;
            itemParticipants.forEach(pId => {
              if (netBalances[pId] !== undefined) {
                netBalances[pId] -= share;
              }
            });
          }
        });
      } else {
        // Fallback to global split if no items (Legacy/Simple expense)
        const splitMode = exp.splitMode || 'equal';
        const participants = exp.participants || members.map(m => m.id);
        
        if (splitMode === 'custom' && exp.customSplits) {
          Object.entries(exp.customSplits).forEach(([pId, share]) => {
            if (netBalances[pId] !== undefined) {
              netBalances[pId] -= parseFloat(share) || 0;
            }
          });
        } else {
          const share = amount / participants.length;
          participants.forEach(pId => {
            if (netBalances[pId] !== undefined) {
              netBalances[pId] -= share;
            }
          });
        }
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

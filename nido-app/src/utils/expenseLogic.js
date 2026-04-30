/**
 * Lógica pura de procesamiento de gastos y cálculos de deudas.
 * Separada para facilitar las pruebas unitarias.
 */

export const normalizeExpense = (exp) => {
  let processedDate = exp.date;
  if (processedDate && typeof processedDate === 'string' && processedDate.includes('T')) {
    processedDate = processedDate.split('T')[0];
  }
  
  if (!processedDate || !/^\d{4}-\d{2}-\d{2}/.test(processedDate)) {
    if (exp.createdAt) {
      const d = exp.createdAt.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt);
      processedDate = d.toLocaleDateString('sv');
    }
  } else {
    processedDate = processedDate.substring(0, 10);
  }

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

export const calculateBalances = (members, expenses) => {
  if (!members.length || !expenses.length) return {};

  const netBalances = {}; // userId -> amount (positive means they are owed, negative means they owe)
  members.forEach(m => netBalances[m.id] = 0);

  expenses.forEach(exp => {
    // Si el gasto ya está pagado (settled), no afecta a los balances
    if (exp.isPaid) return;

    const amount = exp.totalAmount;
    const paidBy = exp.paidBy;
    
    // Amount paid by the user (Credit)
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
      // Simple split
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
};

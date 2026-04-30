import { describe, it, expect } from 'vitest';
import { calculateBalances, normalizeExpense } from './expenseLogic';

describe('normalizeExpense', () => {
  it('should handle dates with ISO format (with T)', () => {
    const exp = { date: '2026-04-27T12:00:00Z', amount: 100 };
    const result = normalizeExpense(exp);
    expect(result.processedDate).toBe('2026-04-27');
  });

  it('should calculate totalAmount correctly for itemized expenses', () => {
    const exp = { 
      items: [
        { amount: 10.5 },
        { amount: '20.5' }
      ]
    };
    const result = normalizeExpense(exp);
    expect(result.totalAmount).toBe(31);
  });
});

describe('calculateBalances', () => {
  const members = [
    { id: 'user1', displayName: 'David' },
    { id: 'user2', displayName: 'Juan' }
  ];

  it('should split a simple expense equally', () => {
    const expenses = [
      { 
        paidBy: 'user1', 
        amount: 100, 
        totalAmount: 100, 
        isPaid: false 
      }
    ];
    const balances = calculateBalances(members, expenses);
    
    // user1 paid 100. user2 owes 50 to user1.
    // In our system: user1 has +50 (is owed), user2 has -50 (owes).
    expect(balances['user1']).toBe(50);
    expect(balances['user2']).toBe(-50);
  });

  it('should handle itemized expenses with custom splits', () => {
    const expenses = [
      {
        paidBy: 'user1',
        totalAmount: 100,
        isPaid: false,
        items: [
          { 
            concept: 'Only for David', 
            amount: 40, 
            splitMode: 'custom', 
            customSplits: { 'user1': 40, 'user2': 0 } 
          },
          { 
            concept: 'Shared', 
            amount: 60, 
            splitMode: 'equal' 
          }
        ]
      }
    ];
    
    const balances = calculateBalances(members, expenses);
    
    // Shared: 60 / 2 = 30 each.
    // Item1: David pays 40, owes 0 to Juan.
    // Total for Juan: -30.
    // Total for David: +30 (Juan owes him 30).
    expect(balances['user2']).toBe(-30);
    expect(balances['user1']).toBe(30);
  });

  it('should ignore settled expenses (isPaid: true)', () => {
    const expenses = [
      { paidBy: 'user1', totalAmount: 100, isPaid: true }
    ];
    const balances = calculateBalances(members, expenses);
    expect(balances['user1']).toBe(0);
    expect(balances['user2']).toBe(0);
  });
});

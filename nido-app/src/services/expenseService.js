import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const expenseService = {
  async addExpense(householdId, expenseData) {
    // expenseData: { concept, amount, category, paidBy, participants, date, paymentStatus }
    return await addDoc(collection(db, 'expenses'), {
      ...expenseData,
      householdId,
      createdAt: serverTimestamp(),
      // Ensure numerical amount
      amount: parseFloat(expenseData.amount)
    });
  },

  async deleteExpense(expenseId) {
    // Implement delete if needed
  },

  async updateExpense(expenseId, updates) {
    const expenseRef = doc(db, 'expenses', expenseId);
    return await updateDoc(expenseRef, updates);
  }
};

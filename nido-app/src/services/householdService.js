import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const householdService = {
  // Create a new household and add the owner
  async createHousehold(ownerUid, name) {
    const householdRef = await addDoc(collection(db, 'households'), {
      name,
      ownerUid,
      createdAt: serverTimestamp(),
      currency: 'EUR'
    });

    const householdId = householdRef.id;

    // Update user to include this household
    const userRef = doc(db, 'users', ownerUid);
    await updateDoc(userRef, {
      householdIds: arrayUnion(householdId),
      currentHouseholdId: householdId
    });

    return householdId;
  },

  // Switch between households
  async switchHousehold(uid, householdId) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      currentHouseholdId: householdId
    });
  },

  // Join an existing household via ID
  async joinHousehold(uid, householdId) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      householdIds: arrayUnion(householdId),
      currentHouseholdId: householdId
    });
  }
};

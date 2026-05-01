import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc,
  getDoc,
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
  },

  // Get household details by ID (used for validation)
  async getHousehold(householdId) {
    const householdRef = doc(db, 'households', householdId);
    const snap = await getDoc(householdRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Remove a member from the household
  async removeMember(uid, householdId) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const newHouseholdIds = (userData.householdIds || []).filter(id => id !== householdId);
    
    const updateData = {
      householdIds: newHouseholdIds
    };
    
    if (userData.currentHouseholdId === householdId) {
      updateData.currentHouseholdId = newHouseholdIds.length > 0 ? newHouseholdIds[0] : null;
    }
    
    await updateDoc(userRef, updateData);
  }
};

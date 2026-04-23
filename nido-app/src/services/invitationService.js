import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';

export const invitationService = {
  // Create a new invitation record
  sendInvitation: async (email, householdId, householdName, inviterName) => {
    try {
      // Check if there's already a pending invitation for this email to this household
      const q = query(
        collection(db, 'invitations'), 
        where('email', '==', email.toLowerCase()),
        where('householdId', '==', householdId),
        where('status', '==', 'pending')
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        throw new Error('Ya existe una invitación pendiente para este correo.');
      }

      await addDoc(collection(db, 'invitations'), {
        email: email.toLowerCase(),
        householdId,
        householdName,
        inviterName,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error sending invitation:", error);
      throw error;
    }
  },

  // Get pending invitations for a specific email
  getInvitationsForEmail: async (email) => {
    const q = query(
      collection(db, 'invitations'), 
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'pending')
    );
    const querySnap = await getDocs(q);
    return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Accept an invitation
  acceptInvitation: async (invitationId, userId, householdId) => {
    try {
      // 1. Update user profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        householdIds: arrayUnion(householdId),
        currentHouseholdId: householdId
      });

      // 2. Update invitation status
      const inviteRef = doc(db, 'invitations', invitationId);
      await updateDoc(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId
      });

      return true;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  },

  // Reject an invitation
  rejectInvitation: async (invitationId) => {
    const inviteRef = doc(db, 'invitations', invitationId);
    await updateDoc(inviteRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    });
  }
};

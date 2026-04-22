import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithRedirect,
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect success:", result.user);
      }
    }).catch((error) => {
      console.error("Error after redirect:", error);
      alert("Error en el retorno de Google: " + error.message);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser ? "User found" : "No user");
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Sync user profile in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              householdIds: [],
              currentHouseholdId: null,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(userSnap.data());
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
        // Still set the user if Firebase Auth succeeded, even if profile sync failed
        if (firebaseUser) setUser(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Error during Google Login redirect:", error);
      alert("No se pudo iniciar el inicio de sesión. Por favor, intenta de nuevo.");
    }
  };
  const logout = () => signOut(auth);

  const value = {
    user,
    userProfile,
    loading,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

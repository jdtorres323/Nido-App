import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser ? "User found" : "No user");
      
      // Cleanup previous profile listener if any
      unsubscribeProfile();

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Sync user profile in Firestore with real-time listener
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            console.log("Profile updated:", docSnap.data());
            setUserProfile(docSnap.data());
          } else {
            // Create profile if it doesn't exist
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
          }
          setLoading(false);
        }, (error) => {
          console.error("Error in profile listener:", error);
          setLoading(false);
        });

      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      console.log("Starting Google Login with Popup...");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error during Google Login:", error);
      // Fallback to redirect if popup is blocked or fails
      if (error.code === 'auth/popup-blocked') {
        try {
          // await signInWithRedirect(auth, googleProvider);
          alert("Por favor, permite las ventanas emergentes para iniciar sesión.");
        } catch (redirectError) {
          console.error("Error during fallback redirect:", redirectError);
        }
      } else {
        alert("No se pudo iniciar sesión: " + error.message);
      }
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

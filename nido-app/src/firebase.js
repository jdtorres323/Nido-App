import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJeoxJN1aExUjXJvUFx3qDmdWM1UTW0rg",
  authDomain: "nido-organic-app-jd.firebaseapp.com",
  projectId: "nido-organic-app-jd",
  storageBucket: "nido-organic-app-jd.firebasestorage.app",
  messagingSenderId: "655332034234",
  appId: "1:655332034234:web:cfe3c13a6c9e4afd9d2483"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { app, db, auth, googleProvider, storage };



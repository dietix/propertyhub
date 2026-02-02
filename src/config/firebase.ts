// Firebase configuration
// Replace these values with your Firebase project configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyAq8wu5yOILhjnQvzV175hFPmtoflhb8zQ",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "airbnb-e18c9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "airbnb-e18c9",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "airbnb-e18c9.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "847875942531",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:847875942531:web:1234567890abcdef",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore com cache persistente para melhor performance
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;

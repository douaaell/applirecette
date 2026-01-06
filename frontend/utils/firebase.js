import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';

// AsyncStorage n'est disponible que sur React Native
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage n'est pas disponible (web)
  AsyncStorage = null;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxpuy2dKrBu-LTXTOx4mBMNEc24WmhYoA",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "apllirecette.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "apllirecette",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "apllirecette.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "662929042236",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:662929042236:web:d86f78c90bb84f0334cc39"
};

let app;
let auth;
let isMock = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  try {
    // Pour React Native, utiliser initializeAuth avec AsyncStorage
    if (AsyncStorage) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      // Pour le web, utiliser getAuth directement
      auth = getAuth(app);
    }
  } catch (e) {
    try {
      auth = getAuth(app);
    } catch (e2) {
      console.error("❌ Impossible de récupérer Auth:", e2);
      throw e2;
    }
  }
} catch (error) {
  console.error("🔥 ERREUR FIREBASE:", error);
  isMock = true;
  auth = { currentUser: null };
}

const subscribeToAuthChanges = (callback) => {
  if (isMock || !auth) {
    console.log("⚠️ Mode Mock actif : Auth désactivée temporairement.");
    callback(null);
    return () => { };
  }

  try {
    return firebaseOnAuthStateChanged(auth, callback);
  } catch (e) {
    console.error("⚠️ Erreur subscribeToAuthChanges:", e);
    callback(null);
    return () => { };
  }
};

export { auth, subscribeToAuthChanges };
export default app;
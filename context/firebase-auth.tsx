import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { BACKEND_API_BASE_URL, FIREBASE_CONFIG } from '@/constants/firebase';

const firebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

/**
 * On React Native, getAuth() gives in-memory persistence only — the session is
 * gone the moment the app is closed, so the user is asked to sign in on every
 * launch. Persisting to AsyncStorage is what keeps them signed in.
 *
 * The web build already persists to browser storage, so getAuth is right there.
 */
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    // Not in the web type surface, so it is resolved off the module at runtime.
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };

    if (getReactNativePersistence) {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage) as never,
      });
    }
  } catch {
    // initializeAuth throws if it already ran, e.g. after a fast refresh.
  }

  return getAuth(firebaseApp);
}

const firebaseAuth = createAuth();

export function getFirebaseAuth() {
  return firebaseAuth;
}

type BackendUser = {
  id: string;
  displayName: string;
  email: string | null;
  phone: { countryCode: string; number: string };
  provider: string;
  settings: {
    darkMode: boolean;
    remindersEnabled: boolean;
    verseNotificationsEnabled: boolean;
    streakBadgeEnabled: boolean;
    reminderTime: string;
    fontSize: string;
  };
  photoURL: string | null;
  emailVerified: boolean;
};

type FirebaseAuthContextValue = {
  firebaseUser: User | null;
  backendUser: BackendUser | null;
  idToken: string | null;
  isReady: boolean;
  refreshIdToken: () => Promise<string | null>;
  syncWithBackend: () => Promise<void>;
  signOut: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

async function syncUserToBackend(token: string) {
  const response = await fetch(`${BACKEND_API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken: token }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to sync Firebase user to backend');
  }

  return response.json() as Promise<{ user: BackendUser }>;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setFirebaseUser(nextUser);

      if (!nextUser) {
        setBackendUser(null);
        setIdToken(null);
        setIsReady(true);
        return;
      }

      const token = await nextUser.getIdToken();
      setIdToken(token);

      try {
        const payload = await syncUserToBackend(token);
        setBackendUser(payload.user);
      } catch {
        setBackendUser(null);
      } finally {
        setIsReady(true);
      }
    });
  }, [auth]);

  const refreshIdToken = async () => {
    if (!firebaseUser) {
      return null;
    }

    const token = await firebaseUser.getIdToken(true);
    setIdToken(token);
    return token;
  };

  const syncWithBackend = async () => {
    const token = idToken || (await refreshIdToken());
    if (!token) {
      throw new Error('No Firebase token available');
    }

    const payload = await syncUserToBackend(token);
    setBackendUser(payload.user);
  };

  const signOut = async () => {
    if (idToken) {
      await fetch(`${BACKEND_API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }).catch(() => null);
    }

    await firebaseSignOut(auth);
    setFirebaseUser(null);
    setBackendUser(null);
    setIdToken(null);
    setIsReady(true);
  };

  const value: FirebaseAuthContextValue = {
    firebaseUser,
    backendUser,
    idToken,
    isReady,
    refreshIdToken,
    syncWithBackend,
    signOut,
  };

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }

  return context;
}

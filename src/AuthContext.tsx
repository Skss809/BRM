import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  setPersistence, 
  browserLocalPersistence,
  getRedirectResult,
  signInWithRedirect
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Set persistence to LOCAL immediately to handle partitioned storage better
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    // 2. Check if we just came back from a redirect (common in mobile WebViews)
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect error catch:", error);
      // Usually "missing initial state" happens here in partitioned environments
    });

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    // Force account selection to avoid state reuse issues
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // In many PWA/APK wrappers, Popup works better if initiated by a clean click.
      // signInWithRedirect is the source of the "missing initial state" error because
      // WebViews often clear sessionStorage during the redirect cycle.
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login attempt failed:", error);
      
      if (error.code === 'auth/popup-blocked') {
        alert("Login popup was blocked. Please enable popups in your app settings or try opening the link in your Chrome browser.");
      } else if (error.message?.includes('sessionStorage') || error.message?.includes('initial state')) {
        // If we still hit state errors, it's a storage partitioning issue.
        alert("Storage Error: Your app wrapper is blocking authentication. Please try opening this app directly in Chrome.");
      } else {
        alert("Authentication failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

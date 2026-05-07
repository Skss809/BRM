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
    provider.setCustomParameters({ prompt: 'select_account' });
    
    // Detect environment
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      await setPersistence(auth, browserLocalPersistence);
      
      if (isStandalone || isMobile) {
        // In mobile/standalone, we try redirect as it's more stable if configured correctly,
        // but it's where the state issue occurs. 
        // We'll catch errors and alert the user with tips.
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login attempt failed:", error);
      
      if (error.message?.includes('missing initial state') || error.code === 'auth/web-storage-unsupported') {
        alert("Authentication Error: Your browser/app is blocking local storage or clearing session state. Please try opening this app in your Chrome browser directly.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup blocked! Please allow popups or try the 'Chrome' browser.");
        // Fallback to redirect
        try {
          await signInWithRedirect(auth, provider);
        } catch (reErr) {
          console.error("Followup redirect failed", reErr);
        }
      } else {
        alert("Login error: " + (error.message || "Unknown error"));
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

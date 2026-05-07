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
    
    // Detect environment
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isStandalone || isMobile) {
        // In APKs/PWAs, popups often fail or lose state. Try redirect but set persistence first.
        await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, provider);
      } else {
        // Desktop browser
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Login attempt failed:", error);
      // Fallback: If one fails, try the other as a last resort
      try {
        await signInWithPopup(auth, provider);
      } catch (innerError) {
        alert("Authentication failed. Please check if cookies are enabled or try using a regular browser tab.");
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

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
    // 1. Force persistence to LOCAL to survive storage-clearing on mobile redirects
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    // 2. Proactively check if we returned from a redirect
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Logged in via redirect successfully");
        }
      } catch (error: any) {
        console.error("Redirect recovery failed:", error);
        // This is where "missing initial state" usually manifests as an error object
        if (error.message?.includes('initial state') || error.code === 'auth/internal-error') {
          console.warn("Storage partitioning issue detected. Local storage might be isolated.");
        }
      }
    };
    checkRedirect();

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
      
      // In PWA APKs (TWAs), popups are actually often more reliable than redirects 
      // if the WebView is configured to handle them, because redirects lose sessionStorage.
      // But many users have popups blocked. 
      // We will try Popup first for mobile, and fallback to redirect only if blocked.
      if (isStandalone || isMobile) {
        try {
          await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-by-user') {
            await signInWithRedirect(auth, provider);
          } else {
            throw popupError;
          }
        }
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login process failed:", error);
      
      if (error.message?.includes('missing initial state') || error.code === 'auth/web-storage-unsupported') {
        alert("Authentication Error: Your app is blocking local state. Please open this app in Chrome to log in once, then return here.");
      } else {
        alert("Login failed: " + (error.message || "Unknown error"));
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

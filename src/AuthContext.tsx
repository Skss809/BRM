import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  setPersistence, 
  browserLocalPersistence,
  getRedirectResult,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  emailLogin: (email: string, pass: string) => Promise<void>;
  emailSignUp: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
      
      if (isStandalone || isMobile) {
        try {
          // Attempt popup first as it shares storage better if the wrapper allows it
          await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          console.warn("Popup blocked or failed, falling back to redirect:", popupError);
          // If popup is blocked, cancelled, or not supported, use redirect
          const codes = ['auth/popup-blocked', 'auth/cancelled-by-user', 'auth/operation-not-supported-in-this-environment'];
          if (codes.includes(popupError.code)) {
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
      
      const isStateError = error.message?.includes('initial state') || error.code === 'auth/internal-error';
      if (isStateError || error.code === 'auth/web-storage-unsupported') {
        alert("Domain/Storage Error: Your app is blocking auth state. Please ensure 'brm-one.vercel.app' is added to Authorized Domains in Firebase Console.");
      } else {
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const emailLogin = async (email: string, pass: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const emailSignUp = async (email: string, pass: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email sign up failed:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, emailLogin, emailSignUp, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

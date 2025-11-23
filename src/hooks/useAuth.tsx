import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAdmin(false);
      if (u) {
        try {
          const token = await u.getIdToken();
          const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
          if (apiBase) {
            const res = await fetch(`${apiBase}/api/admin/is-admin`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const data = await res.json();
              setIsAdmin(Boolean(data?.isAdmin));
            }
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await createUserWithEmailAndPassword(getAuth(), email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    await fbSignOut(getAuth());
    navigate('/home');
  };

  return {
    user,
    session: null,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };
};

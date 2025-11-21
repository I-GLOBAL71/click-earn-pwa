import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, type User } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyChPS-qDvgxzkUIoSjHmPjd-kwjto7RyCo", 
  authDomain: "meme-prix.firebaseapp.com", 
  projectId: "meme-prix", 
  storageBucket: "meme-prix.firebasestorage.app", 
  messagingSenderId: "52882360918", 
  appId: "1:52882360918:web:e41624d47629660b76c9f7", 
  measurementId: "G-30C38NEYFW" 
};

initializeApp(firebaseConfig);

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(false);
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
    navigate('/auth');
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

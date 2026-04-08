import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    console.log("[AUTH] Initializing Auth Provider...");
    
    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("[AUTH] Redirect result found user:", result.user.email);
          setUser(result.user);
        } else {
          console.log("[AUTH] No redirect result user found.");
        }
      })
      .catch((error) => {
        console.error("[AUTH] Redirect error:", error.code, error.message);
        setAuthError(error.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("[AUTH] State changed. User:", firebaseUser ? firebaseUser.email : "null");
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

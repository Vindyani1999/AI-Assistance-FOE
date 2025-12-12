import React, { createContext, useContext, useEffect, useState } from "react";

const Auth_Base_URL = process.env.REACT_APP_API_BASE_AUTH;

type AuthContextValue = {
  isAuthenticated: boolean;
  authChecked: boolean;
  userProfile: any;
  checkAuth: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const checkAuth = async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      setIsAuthenticated(false);
      setUserProfile(null);
      setAuthChecked(true);
      return;
    }
    try {
      const response = await fetch(`${Auth_Base_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const newToken = response.headers.get("x-access-token");
      if (newToken) {
        localStorage.setItem("auth_token", newToken);
      }
      if (response.ok) {
        const profile = await response.json();
        setIsAuthenticated(true);
        setUserProfile(profile);
      } else {
        localStorage.removeItem("auth_token");
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    } catch (err) {
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
      setUserProfile(null);
    }
    setAuthChecked(true);
  };

  const loginWithToken = async (token: string) => {
    if (!token) return;
    localStorage.setItem("auth_token", token);
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setUserProfile(null);
    // emit global logout event for legacy listeners
    try {
      window.dispatchEvent(new Event("auth:logout"));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // Initial check
    checkAuth();

    // Re-check when another tab changes localStorage (auth_token)
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "auth_token") {
        checkAuth();
      }
    };

    // Re-check when window regains focus (user may have logged in/out elsewhere)
    const onFocus = () => {
      checkAuth();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authChecked,
        userProfile,
        checkAuth,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;

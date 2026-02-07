"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AuthSession,
  getSession,
  setSession,
  clearSession,
} from "../../lib/auth";
import {
  signup as apiSignup,
  login as apiLogin,
  logout as apiLogout,
} from "../../lib/api";
import { useRouter } from "next/navigation";

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getSession();
    setSessionState(stored);
    setIsLoading(false);
  }, []);

  const handleSignup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const result = await apiSignup(email, password, displayName);
      setSession(result.session);
      setSessionState(result.session);
      router.push("/profile");
    },
    [router],
  );

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await apiLogin(email, password);
      setSession(result.session);
      setSessionState(result.session);
      router.push("/request/new");
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    apiLogout();
    clearSession();
    setSessionState(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signup: handleSignup,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

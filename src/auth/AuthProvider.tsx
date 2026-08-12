import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, usersApi } from "../api/endpoints";
import {
  apiRequest,
  persistRefreshToken,
  readRefreshToken,
  setAccessToken,
  setOnSessionExpired,
} from "../api/client";
import type { PublicUser } from "../api/types";

type AuthContextValue = {
  user: PublicUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    agreeToTerms: true;
    address?: string;
    city?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function applyAuthResult(result: {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}) {
  setAccessToken(result.accessToken);
  await persistRefreshToken(result.refreshToken);
  return result.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    await persistRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      void clearSession();
    });
    return () => setOnSessionExpired(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const refreshToken = await readRefreshToken();
        if (!refreshToken) return;

        const tokens = await apiRequest<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>("/auth/refresh", {
          method: "POST",
          body: { refreshToken },
          skipRefresh: true,
        });
        setAccessToken(tokens.accessToken);
        await persistRefreshToken(tokens.refreshToken);
        const me = await usersApi.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) await clearSession();
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(await applyAuthResult(result));
  }, []);

  const register = useCallback(
    async (input: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      agreeToTerms: true;
      address?: string;
      city?: string;
    }) => {
      const result = await authApi.registerCustomer(input);
      setUser(await applyAuthResult(result));
    },
    [],
  );

  const signOut = useCallback(async () => {
    const refreshToken = (await readRefreshToken()) ?? undefined;
    try {
      if (user) await authApi.logout(refreshToken);
    } catch {
      // clear local session anyway
    }
    await clearSession();
  }, [clearSession, user]);

  const refreshProfile = useCallback(async () => {
    setUser(await usersApi.me());
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      signIn,
      register,
      signOut,
      refreshProfile,
    }),
    [user, isReady, signIn, register, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

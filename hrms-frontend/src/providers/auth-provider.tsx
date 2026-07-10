"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthSession, AuthUser } from "@/types/auth.types";
import * as authService from "@/services/auth.service";
import { setAccessToken } from "@/lib/token-store";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  applySession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const queryClient = useQueryClient();
  // Tracks whose data is currently cached, so switching accounts inside the
  // same tab (logout -> different login, no full page reload) can't leak
  // the previous user's query cache (profile, balances, dashboards, ...)
  // into the new session.
  const lastUserIdRef = useRef<string | null>(null);

  const applySession = useCallback(
    (session: AuthSession) => {
      if (lastUserIdRef.current && lastUserIdRef.current !== session.user.id) {
        queryClient.clear();
      }
      lastUserIdRef.current = session.user.id;
      setAccessToken(session.accessToken);
      setUserState(session.user);
      setStatus("authenticated");
    },
    [queryClient]
  );

  useEffect(() => {
    let cancelled = false;

    authService
      .refresh()
      .then((res) => {
        if (cancelled) return;
        applySession(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setAccessToken(null);
        setUserState(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      applySession(res.data);
      return res.data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort — clear local state regardless of API outcome
    }
    setAccessToken(null);
    setUserState(null);
    setStatus("unauthenticated");
    lastUserIdRef.current = null;
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user, status, login, logout, applySession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

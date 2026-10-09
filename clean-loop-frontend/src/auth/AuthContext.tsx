import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../api/client";
import type { Role, User, UserCreate } from "../api/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (u: UserCreate) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore session from stored token
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const t = await api.login(email, password);
    tokenStore.set(t.access_token);
    setUser(await api.me());
  }, []);

  const register = useCallback(
    async (u: UserCreate) => {
      await api.register(u);
      await login(u.email, u.password);
    },
    [login],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isStaff: user?.role === "municipal_staff" || user?.role === "admin",
      login,
      register,
      logout,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, loading, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

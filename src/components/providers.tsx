"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { api } from "@/lib/client-api";

type Auth = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<Auth>({
  user: null,
  loading: true,
  setUser: () => {},
  refresh: async () => {},
});
export const useAuth = () => useContext(AuthContext);
export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: User | null }>("/auth/me");
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh().catch(() => setUser(null));
  }, [refresh]);
  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

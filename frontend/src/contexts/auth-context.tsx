import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, AgentStatus } from "@/types";
import { auth as authApi, setToken, getToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  setStatus: (status: AgentStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi.me()
      .then((apiUser: Record<string, unknown>) => {
        setUser({
          id: apiUser.id as string,
          email: apiUser.email as string,
          name: apiUser.name as string,
          role: apiUser.role as "admin" | "supervisor" | "agent",
          tenantId: apiUser.tenantId as string,
          tenantName: (apiUser.tenantName || apiUser.tenantId) as string,
          status: (apiUser.status as AgentStatus) || "online",
        });
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: apiUser } = await authApi.login(email, password);
      setToken(token);
      setUser({
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        role: apiUser.role,
        tenantId: apiUser.tenantId,
        tenantName: apiUser.tenantName || apiUser.tenantId,
        status: apiUser.status || "online",
      });
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const setStatus = useCallback((status: AgentStatus) => {
    setUser((prev) => (prev ? { ...prev, status } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        setStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

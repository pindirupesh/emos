"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE } from "../config";

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("emos-user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("emos-user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const authUser = { id: data.id, name: data.name, email: data.email };
        setUser(authUser);
        localStorage.setItem("emos-user", JSON.stringify(authUser));
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.detail || "Invalid credentials" };
      }
    } catch {
      return { success: false, error: "Network error. Is the backend running?" };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const authUser = { id: data.id, name: data.name, email: data.email };
        setUser(authUser);
        localStorage.setItem("emos-user", JSON.stringify(authUser));
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.detail || "Signup failed" };
      }
    } catch {
      return { success: false, error: "Network error. Is the backend running?" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("emos-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

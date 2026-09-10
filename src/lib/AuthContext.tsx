import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  username: string;
  fullname: string;
  role: "PPIC" | "IN" | "OUT";
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("bca_user");
    if (saved) return JSON.parse(saved);
    return null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("bca_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bca_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

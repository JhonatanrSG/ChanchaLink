import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const fetchMe = async () => {
    try {
      const response = await api.get("/auth/me/");
      setUser(response.data);
      return response.data;
    } catch (error) {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    try {
      const response = await api.get("/auth/me/");
      setUser(response.data);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshMe,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
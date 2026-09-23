"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Static export pre-renders once with no browser — start empty, then
  // read real localStorage after mount so server and client agree on the
  // very first render (avoids a hydration mismatch).
  const [authToken, setAuthToken] = useState(null);
  const [myStylistId, setMyStylistId] = useState(null);
  const [myAccount, setMyAccount] = useState(null);
  const [customerToken, setCustomerToken] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAuthToken(localStorage.getItem("sheeba:token"));
    setMyStylistId(localStorage.getItem("sheeba:my-stylist-id"));
    setCustomerToken(localStorage.getItem("sheeba:customer-token"));
    setCustomerName(localStorage.getItem("sheeba:customer-name"));
    setHydrated(true);
  }, []);

  const refreshMyAccount = useCallback(async () => {
    if (!authToken) { setMyAccount(null); return; }
    try {
      const me = await apiFetch("/stylists/me");
      setMyStylistId(me._id);
      localStorage.setItem("sheeba:my-stylist-id", me._id);
      setMyAccount(me);
    } catch (e) {
      setAuthToken(null); setMyStylistId(null); setMyAccount(null);
      localStorage.removeItem("sheeba:token");
      localStorage.removeItem("sheeba:my-stylist-id");
    }
  }, [authToken]);

  const login = useCallback(async (phone, password) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) });
    setAuthToken(data.token); localStorage.setItem("sheeba:token", data.token);
    setMyStylistId(data.stylist._id); localStorage.setItem("sheeba:my-stylist-id", data.stylist._id);
    setMyAccount(data.stylist);
    return data.stylist;
  }, []);

  const register = useCallback(async (phone, password, name) => {
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ phone, password, name }) });
    setAuthToken(data.token); localStorage.setItem("sheeba:token", data.token);
    setMyStylistId(data.stylist._id); localStorage.setItem("sheeba:my-stylist-id", data.stylist._id);
    setMyAccount(data.stylist);
    return data.stylist;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null); setMyStylistId(null); setMyAccount(null);
    localStorage.removeItem("sheeba:token");
    localStorage.removeItem("sheeba:my-stylist-id");
  }, []);

  const customerLogin = useCallback(async (phone, password) => {
    const data = await apiFetch("/customers/login", { method: "POST", body: JSON.stringify({ phone, password }) });
    setCustomerToken(data.token); localStorage.setItem("sheeba:customer-token", data.token);
    setCustomerName(data.customer.name); localStorage.setItem("sheeba:customer-name", data.customer.name);
    return data.customer;
  }, []);

  const customerRegister = useCallback(async (phone, password, name) => {
    const data = await apiFetch("/customers/register", { method: "POST", body: JSON.stringify({ phone, password, name }) });
    setCustomerToken(data.token); localStorage.setItem("sheeba:customer-token", data.token);
    setCustomerName(data.customer.name); localStorage.setItem("sheeba:customer-name", data.customer.name);
    return data.customer;
  }, []);

  const customerLogout = useCallback(() => {
    setCustomerToken(null); setCustomerName(null);
    localStorage.removeItem("sheeba:customer-token");
    localStorage.removeItem("sheeba:customer-name");
  }, []);

  const isAdmin = !!(myAccount && myAccount.isAdmin);

  return (
    <AuthContext.Provider value={{
      authToken, myStylistId, myAccount, isAdmin, hydrated, refreshMyAccount, login, register, logout,
      customerToken, customerName, customerLogin, customerRegister, customerLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

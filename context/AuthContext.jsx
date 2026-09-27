"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { clearPendingInvite } from "../lib/invite";

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
  // Which view to show when one phone is logged in as BOTH a professional
  // and a customer: the one logged into most recently ("pro" | "customer").
  const [role, setRole] = useState(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- deliberate: saved logins can only be read in the browser, after load */
    setAuthToken(localStorage.getItem("sheeba:token"));
    setMyStylistId(localStorage.getItem("sheeba:my-stylist-id"));
    setCustomerToken(localStorage.getItem("sheeba:customer-token"));
    setCustomerName(localStorage.getItem("sheeba:customer-name"));
    setRole(localStorage.getItem("sheeba:role"));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const chooseRole = useCallback((r) => {
    setRole(r);
    try { if (r) localStorage.setItem("sheeba:role", r); else localStorage.removeItem("sheeba:role"); } catch (e) { /* private mode */ }
  }, []);

  // Shared by the two ways an account gets loaded (below).
  const applyAccount = useCallback((me) => {
    setMyStylistId(me._id);
    localStorage.setItem("sheeba:my-stylist-id", me._id);
    setMyAccount(me);
  }, []);
  // Same stale-session recovery as before: a saved login that no longer
  // matches a real account is cleared rather than left half-working.
  const clearStaleSession = useCallback(() => {
    setAuthToken(null); setMyStylistId(null); setMyAccount(null);
    localStorage.removeItem("sheeba:token");
    localStorage.removeItem("sheeba:my-stylist-id");
  }, []);

  // For pages that want a fresh copy on demand (e.g. after an edit).
  const refreshMyAccount = useCallback(async () => {
    if (!authToken) return; // no saved login: nothing to load
    try { applyAccount(await apiFetch("/stylists/me")); }
    catch (e) { clearStaleSession(); }
  }, [authToken, applyAccount, clearStaleSession]);

  // Load the professional account on every page as soon as a saved login
  // exists, so the whole site knows who you are (e.g. whether to show the
  // Admin link) without having to visit My Shop first. The `cancelled` flag
  // stops a slow response from bringing back an account you just logged out of.
  useEffect(() => {
    if (!hydrated || !authToken) return;
    let cancelled = false;
    apiFetch("/stylists/me")
      .then((me) => { if (!cancelled) applyAccount(me); })
      .catch(() => { if (!cancelled) clearStaleSession(); });
    return () => { cancelled = true; };
  }, [hydrated, authToken, applyAccount, clearStaleSession]);

  const login = useCallback(async (phone, password) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) });
    setAuthToken(data.token); localStorage.setItem("sheeba:token", data.token);
    setMyStylistId(data.stylist._id); localStorage.setItem("sheeba:my-stylist-id", data.stylist._id);
    setMyAccount(data.stylist);
    chooseRole("pro");
    sessionStorage.setItem("sheeba:welcome", "1"); // dashboard shows a one-time welcome pop-up
    return data.stylist;
  }, [chooseRole]);

  const register = useCallback(async (phone, password, name, inviteCode, country, extra = {}) => {
    // extra: { role: "APPRENTICE", supervisorCode } for professionals in training
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ phone, password, name, inviteCode: inviteCode || undefined, country, ...extra }) });
    clearPendingInvite(); // an invite only ever counts once, at signup
    setAuthToken(data.token); localStorage.setItem("sheeba:token", data.token);
    setMyStylistId(data.stylist._id); localStorage.setItem("sheeba:my-stylist-id", data.stylist._id);
    setMyAccount(data.stylist);
    chooseRole("pro");
    sessionStorage.setItem("sheeba:welcome", "1"); // dashboard shows a one-time welcome pop-up
    return data.stylist;
  }, [chooseRole]);

  const logout = useCallback(() => {
    setAuthToken(null); setMyStylistId(null); setMyAccount(null);
    localStorage.removeItem("sheeba:token");
    localStorage.removeItem("sheeba:my-stylist-id");
    chooseRole(localStorage.getItem("sheeba:customer-token") ? "customer" : null);
  }, [chooseRole]);

  const customerLogin = useCallback(async (phone, password) => {
    const data = await apiFetch("/customers/login", { method: "POST", body: JSON.stringify({ phone, password }) });
    setCustomerToken(data.token); localStorage.setItem("sheeba:customer-token", data.token);
    setCustomerName(data.customer.name); localStorage.setItem("sheeba:customer-name", data.customer.name);
    chooseRole("customer");
    return data.customer;
  }, [chooseRole]);

  const customerRegister = useCallback(async (phone, password, name, inviteCode, country, extra = {}) => {
    const data = await apiFetch("/customers/register", { method: "POST", body: JSON.stringify({ phone, password, name, inviteCode: inviteCode || undefined, country, ...extra }) });
    clearPendingInvite();
    setCustomerToken(data.token); localStorage.setItem("sheeba:customer-token", data.token);
    setCustomerName(data.customer.name); localStorage.setItem("sheeba:customer-name", data.customer.name);
    chooseRole("customer");
    return data.customer;
  }, [chooseRole]);

  const customerLogout = useCallback(() => {
    setCustomerToken(null); setCustomerName(null);
    localStorage.removeItem("sheeba:customer-token");
    localStorage.removeItem("sheeba:customer-name");
    chooseRole(localStorage.getItem("sheeba:token") ? "pro" : null);
  }, [chooseRole]);

  const isAdmin = !!(myAccount && myAccount.isAdmin);
  const activeRole = role === "pro" && authToken ? "pro" : role === "customer" && customerToken ? "customer"
    : authToken ? "pro" : customerToken ? "customer" : null;
  const hasBothRoles = !!(authToken && customerToken);

  return (
    <AuthContext.Provider value={{
      authToken, myStylistId, myAccount, isAdmin, hydrated, refreshMyAccount, login, register, logout,
      customerToken, customerName, customerLogin, customerRegister, customerLogout,
      activeRole, hasBothRoles, switchRole: chooseRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

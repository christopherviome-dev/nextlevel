"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// One login form for professional accounts, used by My Shop and Admin.
// (Admin isn't a separate kind of account: it's a professional account
// with admin permission, so both pages log in the same way.)
export default function ProLoginForm({ title = "Log In", note }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await login(phone, password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-12">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">{title}</div>
      {note && <p className="text-sm text-plum/80 mb-3">{note}</p>}
      <form onSubmit={submit} className="space-y-3">
        {/* autoComplete lets phones offer saved logins */}
        <input type="tel" autoComplete="username" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-line" />
        <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-line" />
        {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
        <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40" type="submit" disabled={busy || !phone || !password}>
          {busy ? "One sec…" : "Log In"}
        </button>
      </form>
    </div>
  );
}

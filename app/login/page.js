"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Nav from "../../components/Nav";
import Link from "next/link";

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(phone, password);
      else await register(phone, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
    <Nav />
    <div className="max-w-md mx-auto px-5 pt-12">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">
        {mode === "login" ? "Log In" : "Create Your Shop"}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        )}
        <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
        <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold" type="submit" disabled={busy}>
          {busy ? "One sec…" : mode === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
      {mode === "login" && <Link href="/forgot-password?type=stylist" className="block mt-3 text-sm text-hibiscus-deep font-semibold">Forgot password?</Link>}
      <button className="mt-3 px-4 py-2 rounded-full border border-line bg-card text-sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "New here? Create a shop" : "Already have an account? Log in"}
      </button>
    </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Nav from "../Nav";

// Customer-only pages: show them to logged-in customers, otherwise a clear way in.
export default function CustomerGate({ title, children }) {
  const { customerToken, hydrated } = useAuth();
  if (!hydrated) return null;
  if (!customerToken) {
    return (
      <div>
        <Nav />
        <div className="max-w-md mx-auto px-5 pt-10 text-center">
          <div className="bg-card border border-line rounded-2xl p-6">
            <div className="font-bold text-ink">{title}</div>
            <p className="text-sm text-muted mt-1">Log in or create a free customer account to see this.</p>
            <Link href="/requests" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold">Log in or sign up</Link>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

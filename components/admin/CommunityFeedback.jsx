"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";

function Status() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => apiFetch("/telegram/status").then(setS).catch(() => setS(null)), []);
  useEffect(() => { load(); }, [load]);
  const connect = async () => { setMsg("Connecting…"); try { await apiFetch("/telegram/connect", { method: "POST" }); setMsg(null); load(); } catch (e) { setMsg(e.message); } };
  if (!s) return null;
  if (s.connected) return <div className="rounded-2xl p-3 bg-ok-bg border border-ok-line text-ok-fg text-sm font-bold">✓ Telegram is connected{s.bot ? `: @${s.bot}` : ""}. New messages arrive here and you can answer them.</div>;
  const missing = [!s.tokenSet && "TELEGRAM_BOT_TOKEN", !s.secretSet && "TELEGRAM_WEBHOOK_SECRET"].filter(Boolean);
  return (
    <div className="rounded-2xl p-3 bg-warn-bg border border-warn-line text-sm space-y-2">
      <div className="font-bold text-warn-fg">Telegram isn't connected yet.</div>
      {missing.length > 0
        ? <div className="text-muted-strong">Add {missing.join(" and ")} on Render (Environment), then come back and press Connect.</div>
        : <div className="text-muted-strong">Everything is set. Press Connect to link the bot to Sheeba.{s.lastError ? ` (Last problem: ${s.lastError})` : ""}</div>}
      {missing.length === 0 && <button onClick={connect} className="px-4 py-2 rounded-full bg-violet text-white font-bold">Connect</button>}
      {msg && <div className="text-muted-strong">{msg}</div>}
    </div>
  );
}

function Item({ f, onChange }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const reply = async () => {
    setBusy(true); setError(null);
    try { await apiFetch(`/telegram/feedback/${f._id}/reply`, { method: "POST", body: JSON.stringify({ text }) }); setText(""); onChange(); }
    catch (e) { setError(e.message); }
    setBusy(false);
  };
  const done = async () => { await apiFetch(`/telegram/feedback/${f._id}/handled`, { method: "PUT" }); onChange(); };
  return (
    <div className="p-4 space-y-2">
      <div className="text-sm"><b className="text-plum">{f.senderName}</b> <span className="text-xs text-muted">· {new Date(f.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
      <p className="text-ink whitespace-pre-line">{f.text}</p>
      {(f.replies || []).map((r, i) => <div key={i} className="ml-4 text-sm rounded-xl bg-violet/10 p-2"><b className="text-violet">{r.byName}:</b> {r.text}</div>)}
      {!f.handled && (
        <div className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} rows={2} placeholder={`Answer ${f.senderName} in the group…`} className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
          <div className="flex gap-2 justify-end">
            <button onClick={done} disabled={busy} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold text-plum">No answer needed</button>
            <button onClick={reply} disabled={busy || text.trim().length < 2} className="px-4 py-1.5 rounded-full bg-violet text-white text-xs font-bold disabled:opacity-50">{busy ? "Sending…" : "Send answer"}</button>
          </div>
          {error && <p className="text-xs text-bad-fg">{error}</p>}
        </div>
      )}
    </div>
  );
}

// What people post in the Sheeba Telegram community, answered from here.
export default function CommunityFeedback() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const load = useCallback(() => apiFetch("/telegram/feedback").then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!list) return <p className="text-muted">Loading…</p>;
  const open = list.filter((f) => !f.handled), handled = list.filter((f) => f.handled);
  return (
    <div className="space-y-4">
      <Status />
      <p className="text-sm text-muted">Questions and comments from the Sheeba Telegram group. Your answer is posted in the group as a reply to that person.</p>
      {open.length === 0 ? <p className="text-muted">Nothing waiting. 🎉</p> : <div className="bg-card border border-line rounded-2xl divide-y divide-line">{open.map((f) => <Item key={f._id} f={f} onChange={load} />)}</div>}
      {handled.length > 0 && <button onClick={() => setShowDone((x) => !x)} className="text-sm font-bold text-hibiscus-deep">{showDone ? "Hide" : "Show"} answered ({handled.length})</button>}
      {showDone && <div className="bg-card border border-line rounded-2xl divide-y divide-line opacity-80">{handled.map((f) => <Item key={f._id} f={f} onChange={load} />)}</div>}
    </div>
  );
}

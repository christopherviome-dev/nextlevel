"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../lib/api";
import { fitImage } from "../lib/image";

const SYSTEM_TEXT = {
  REQUEST_ACCEPTED: "✓ Request accepted",
  REQUEST_DECLINED: "Request declined",
  SERVICE_COMPLETED: "✓ Service completed",
  REQUEST_CREATED: "New request sent",
};
const PHOTO = { maxDim: 1000, maxChars: 290 * 1024 };
const time = (t) => new Date(t).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

// Messages between a customer and a professional. Phones: the list OR one
// conversation. Larger screens: both side by side. New messages appear
// every 10 seconds while a conversation is open.
export default function MessagesPanel({ side, initialId = null }) {
  const actor = side === "customer" ? "customer" : null;
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(initialId);

  const loadList = useCallback(() => {
    apiFetch(`/conversations/${side === "customer" ? "customer" : "stylist"}`, {}, actor).then(setList).catch((e) => setError(e.message));
  }, [side, actor]);
  useEffect(() => { loadList(); }, [loadList]);

  const nameOf = (c) => (side === "customer" ? c.stylistName : c.customerName) || "Conversation";
  const unread = (c) => (side === "customer" ? c.customerUnread : c.stylistUnread);
  const open = list && list.find((c) => String(c._id) === String(openId));

  return (
    <div className="lg:grid lg:grid-cols-[18rem_1fr] lg:gap-4">
      <div className={openId ? "hidden lg:block" : ""}>
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        {!list && !error && <p className="text-sm text-muted">Loading conversations…</p>}
        {list && list.length === 0 && (
          <p className="text-sm text-muted bg-card border border-line rounded-2xl p-4">
            {side === "customer" ? "No messages yet. You can message a professional from their shop page." : "No messages yet. Customers can message you from your shop page."}
          </p>
        )}
        {list && list.map((c) => (
          <button key={c._id} onClick={() => setOpenId(c._id)}
            className={"w-full text-left bg-card border rounded-2xl p-3 mb-2 " + (String(c._id) === String(openId) ? "border-hibiscus" : "border-line")}>
            <div className="flex items-center justify-between gap-2">
              <span className={"truncate " + (unread(c) ? "font-extrabold text-ink" : "font-bold text-ink")}>{nameOf(c)}</span>
              {unread(c) && <span className="w-2.5 h-2.5 rounded-full bg-hibiscus shrink-0" aria-label="Unread" />}
            </div>
            {c.lastMessageAt && <div className="text-xs text-muted">{time(c.lastMessageAt)}</div>}
          </button>
        ))}
      </div>
      {openId && (
        <Thread key={openId} id={openId} side={side} actor={actor} title={open ? nameOf(open) : "Conversation"}
          onBack={() => { setOpenId(null); loadList(); }} onRead={loadList} />
      )}
      {!openId && list && list.length > 0 && <div className="hidden lg:flex items-center justify-center text-sm text-muted">Choose a conversation</div>}
    </div>
  );
}

function Thread({ id, side, actor, title, onBack, onRead }) {
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const load = useCallback(() => {
    apiFetch(`/conversations/${id}/messages`, {}, actor).then(setMessages).catch((e) => setError(e.message));
  }, [id, actor]);
  useEffect(() => {
    load();
    apiFetch(`/conversations/${id}/read`, { method: "PUT" }, actor).then(onRead).catch(() => {});
    const t = setInterval(load, 10000); // new messages every 10 seconds while open
    return () => clearInterval(t);
  }, [id, actor, load, onRead]);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: "end" }); }, [messages]);

  const choose = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    try { setPhoto(await fitImage(f, PHOTO)); } catch (err) { setError(err.message); }
  };
  const send = async () => {
    setBusy(true); setError(null);
    try {
      await apiFetch(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ text, photo: photo || undefined }) }, actor);
      setText(""); setPhoto(null); load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="bg-card border border-line rounded-2xl flex flex-col min-h-[60vh]">
      <div className="flex items-center gap-2 p-3 border-b border-line">
        <button onClick={onBack} className="lg:hidden w-9 h-9 rounded-full border border-line" aria-label="Back to conversations">‹</button>
        <div className="font-bold text-ink truncate">{title}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[60vh]">
        <p className="text-[11px] text-muted text-center">Keep it about the booking. Sheeba will never ask for your password or ID number.</p>
        {!messages && <p className="text-sm text-muted">Loading…</p>}
        {messages && messages.map((m, i) => {
          if (m.messageType === "structured" || m.senderType === "system") {
            return <div key={i} className="text-center text-xs text-muted">{SYSTEM_TEXT[m.structuredType] || "Update"} · {time(m.createdAt)}</div>;
          }
          const mine = m.senderType === (side === "customer" ? "customer" : "stylist");
          return (
            <div key={i} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[80%] rounded-2xl px-3 py-2 text-sm " + (mine ? "bg-hibiscus text-white" : "bg-surface-2 text-ink")}>
                {m.photo && <img src={m.photo} alt="Photo in message" className="rounded-lg mb-1 max-h-60" />}
                {m.text && <div className="whitespace-pre-line">{m.text}</div>}
                <div className={"text-[10px] mt-0.5 " + (mine ? "text-white/80" : "text-muted")}>{time(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {error && <p className="text-sm text-bad-fg px-3">{error}</p>}
      {photo && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <img src={photo} alt="Photo to send" className="w-14 h-14 rounded-lg object-cover" />
          <button onClick={() => setPhoto(null)} className="text-xs underline">Remove</button>
        </div>
      )}
      <div className="flex gap-2 p-3 border-t border-line">
        <label className="w-11 h-11 shrink-0 rounded-full border border-line flex items-center justify-center cursor-pointer" aria-label="Add a photo">
          <input type="file" accept="image/*" onChange={choose} className="sr-only" />📷
        </label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder="Write a message"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-surface resize-none" />
        <button onClick={send} disabled={busy || (!text.trim() && !photo)} className="px-4 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">Send</button>
      </div>
    </div>
  );
}

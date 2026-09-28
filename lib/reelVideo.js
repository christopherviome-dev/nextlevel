"use client";
import { BRAND } from "./lookCard";

// Turn a Look Reel into a short MP4 video for WhatsApp Status, on the phone
// itself. Only MP4 is used, because WhatsApp Status accepts it; phones that
// can't record MP4 simply don't see the "Share as video" button.
function mp4Type() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return null;
  return ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || null;
}
export const canMakeVideo = () => !!mp4Type();

const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

export async function makeReelVideo({ frames, title, byline }) {
  const type = mp4Type();
  if (!type) throw new Error("This phone can't make videos here.");
  const W = 720, H = 1280, HOLD = 950, FADE = 250, END = 1800;
  const imgs = await Promise.all(frames.map(load));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const cover = (img, alpha) => {
    const s = Math.max(W / img.width, H / img.height);
    ctx.globalAlpha = alpha; ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s); ctx.globalAlpha = 1;
  };
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const endCard = () => {
    ctx.fillStyle = "#1a0b16"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff"; ctx.font = font(800, 56); ctx.textAlign = "center";
    ctx.fillText(title.length > 24 ? title.slice(0, 23) + "…" : title, W / 2, H / 2 - 60);
    if (byline) { ctx.fillStyle = "#f3e6ee"; ctx.font = font(600, 36); ctx.fillText(`by ${byline}`, W / 2, H / 2); }
    ctx.fillStyle = "#e91e63"; ctx.beginPath(); ctx.roundRect(W / 2 - 200, H / 2 + 60, 400, 84, 42); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = font(800, 36); ctx.fillText("Book this look", W / 2, H / 2 + 114);
    ctx.fillStyle = "#f3e6ee"; ctx.font = font(800, 40); ctx.fillText(BRAND, W / 2, H - 120); ctx.textAlign = "left";
  };
  const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 2500000 });
  const parts = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) parts.push(e.data); };
  const done = new Promise((ok) => { rec.onstop = ok; });
  rec.start();
  const total = imgs.length * HOLD + END, t0 = performance.now();
  await new Promise((finish) => {
    const tick = () => {
      const t = performance.now() - t0;
      if (t >= total) { finish(); return; }
      if (t >= imgs.length * HOLD) endCard();
      else {
        const k = Math.floor(t / HOLD), into = t - k * HOLD;
        cover(imgs[k], 1);
        if (into > HOLD - FADE && k + 1 < imgs.length) cover(imgs[k + 1], (into - (HOLD - FADE)) / FADE);
        ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, H - 110, W, 110);
        ctx.fillStyle = "#ffffff"; ctx.font = font(700, 34); ctx.fillText(`${title}${byline ? ` · ${byline}` : ""}`.slice(0, 40), 32, H - 45);
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop(); await done;
  return new File([new Blob(parts, { type: "video/mp4" })], "look.mp4", { type: "video/mp4" });
}

export async function shareReelVideo(opts) {
  const file = await makeReelVideo(opts);
  const text = `${opts.title}${opts.byline ? ` by ${opts.byline}` : ""}. Book this look: ${opts.link}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); return "shared"; } catch (e) { return "closed"; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = "look.mp4"; a.click();
  return "saved";
}

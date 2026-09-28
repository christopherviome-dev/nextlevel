"use client";
// "Fresh Look" share cards: a beautiful image sized for WhatsApp Status and
// Instagram Stories (1080×1920), drawn on the phone itself, with a link that
// opens booking for that exact look. The brand name lives in ONE place here,
// so a rename changes every card.
export const BRAND = "Sheeba";

function loadImage(src) {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/); const lines = []; let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"; }
  return lines;
}

export async function makeLookCard({ photo, title, byline, place, price, link, kicker = "Fresh look" }) {
  const W = 1080, H = 1920, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  // Background: deep plum, softly lit
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#2a1233"); g.addColorStop(1, "#12070f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.8, 200, 50, W * 0.8, 200, 700); glow.addColorStop(0, "rgba(233,30,99,0.35)"); glow.addColorStop(1, "rgba(233,30,99,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // Kicker
  ctx.fillStyle = "#f7c6d9"; ctx.font = font(800, 44); ctx.fillText(kicker.toUpperCase(), 80, 150);
  // Measure the words first, then give the photo whatever space is left, so
  // nothing crowds the footer, whatever the length of the style name.
  const fy = H - 170;                       // footer button top
  ctx.font = font(800, 76);
  const titleLines = wrap(ctx, title, W - 160, 2);
  const meta = [place, price].filter(Boolean).join("  ·  ");
  const textH = titleLines.length * 86 + (byline ? 64 : 0) + (meta ? 56 : 0);
  const px = 80, py = 200, pw = W - 160, ph = fy - 70 - textH - 60 - py;
  const img = await loadImage(photo);
  ctx.save(); roundRect(ctx, px, py, pw, ph, 48); ctx.clip();
  const s = Math.max(pw / img.width, ph / img.height), dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  ctx.restore();
  // Title, who, where, price
  let y = py + ph + 100;
  ctx.fillStyle = "#ffffff"; ctx.font = font(800, 76);
  for (const l of titleLines) { ctx.fillText(l, 80, y); y += 86; }
  if (byline) { ctx.fillStyle = "#f3e6ee"; ctx.font = font(600, 46); ctx.fillText(`by ${byline}`, 80, y); y += 64; }
  if (meta) { ctx.fillStyle = "#c9a9bd"; ctx.font = font(500, 40); ctx.fillText(meta, 80, y); }
  // Footer: the call to action and where to go
  ctx.fillStyle = "#e91e63"; roundRect(ctx, 80, fy, 470, 104, 52); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.font = font(800, 44); ctx.fillText("Book this look", 128, fy + 67);
  ctx.fillStyle = "#f3e6ee"; ctx.font = font(800, 52); ctx.textAlign = "right"; ctx.fillText(BRAND, W - 80, fy + 70);
  if (link) { ctx.fillStyle = "#9d7f92"; ctx.font = font(500, 30); ctx.textAlign = "left"; ctx.fillText(link.replace(/^https?:\/\//, "").replace(/#.*$/, ""), 80, H - 30); }
  const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));
  return new File([blob], "look.jpg", { type: "image/jpeg" });
}

// Share the card through the phone's own share sheet (WhatsApp Status,
// Instagram, …); where that isn't possible, save the image and copy the link.
export async function shareLookCard(opts) {
  const file = await makeLookCard(opts);
  const text = `${opts.title}${opts.byline ? ` by ${opts.byline}` : ""}. Book this look: ${opts.link}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return "shared"; } catch (e) { return "closed"; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = "look.jpg"; a.click();
  try { await navigator.clipboard.writeText(opts.link); } catch (e) { /* not allowed */ }
  return "saved";
}

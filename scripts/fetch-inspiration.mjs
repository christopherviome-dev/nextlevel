// Downloads the inspiration photos listed in lib/inspiration.json into
// public/inspiration/, so Sheeba serves them itself: faster for customers,
// no third-party requests, and they can't disappear if a page is removed.
// Photos are from Pexels (free licence) and are credited in the app.
// Run once, and again whenever lib/inspiration.json gets new photos:
//   node scripts/fetch-inspiration.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const list = JSON.parse(fs.readFileSync(path.join(root, "lib", "inspiration.json"), "utf8"));
const outDir = path.join(root, "public", "inspiration");
fs.mkdirSync(outDir, { recursive: true });

const photos = Object.values(list).flat();
let saved = 0, skipped = 0;
const failed = [];
for (const p of photos) {
  const file = path.join(outDir, `${p.id}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) { skipped++; continue; }
  // Pexels' standard image address for a photo id, resized to 800px wide and compressed.
  const url = `https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&w=800`;
  try {
    const res = await fetch(url);
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/")) throw new Error(`HTTP ${res.status} ${type}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(file, buf);
    saved++;
    console.log(`saved ${p.id}.jpg (${Math.round(buf.length / 1024)} KB), photo by ${p.photographer}`);
  } catch (e) {
    failed.push(`${p.id} (${p.page}): ${e.message}`);
  }
}
console.log(`\n${saved} downloaded, ${skipped} already present, ${failed.length} failed of ${photos.length}.`);
if (failed.length) { console.log("Failed:\n" + failed.join("\n")); process.exit(1); }

// タミヤ公式「発売月製品一覧」(電動RCカー=2010・エンジンRCカー=2050)を全月取得する
// 2000年代より前の月はほとんど載っていない(現行品の再販だけが載る)ので、古い年代の初出には使わない
import { writeFileSync, existsSync, readFileSync } from "node:fs";
const UA = { "User-Agent": "Mozilla/5.0 (personal fan site research; 1 req/s)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = new TextDecoder("shift_jis");
const text = (s) => s.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
// 定期更新用: --file data/catalog/tamiya-monthly.json --refresh 202610,202611 で、指定した月だけ取り直す
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const FILE = arg("--file") ?? "data/catalog/tamiya-monthly.json";
const FROM = arg("--from") ?? "197601";
const GENRES = ["2010", "2050"];
const out = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
for (const key of arg("--refresh")?.split(",") ?? []) delete out[key];
const LAST = arg("--to") ?? `${new Date().getFullYear() + 1}12`;
for (let y = Number(FROM.slice(0, 4)); y <= Number(LAST.slice(0, 4)); y++) for (let m = 1; m <= 12; m++) {
  const key = `${y}${String(m).padStart(2, "0")}`;
  if (key < FROM || key > LAST || out[key]) continue;
  const all = [];
  for (const genre of GENRES) for (let page = 1; page <= 10; page++) {
    let s = "";
    for (let i = 0; i < 4; i++) { try { const r = await fetch(`https://www.tamiya.com/japan/newitems_month/list.html?current=${key}&genre_item=${genre}&page=${page}`, { headers: UA }); s = dec.decode(await r.arrayBuffer()); break; } catch { await sleep(3000); } }
    const t = text(s);
    const found = [...t.matchAll(/ITEM (\d{5}) (.+?) ([\d,]+)円/g)].map((x) => [x[1], x[2].trim(), genre]);
    const fresh = found.filter(([it]) => !all.some(([a]) => a === it));
    all.push(...fresh);
    await sleep(1100);
    if (fresh.length < 20) break;
  }
  out[key] = all;
  if (all.length) console.error(key, all.length);
  writeFileSync(FILE, JSON.stringify(out));
}
console.log("months", Object.keys(out).length, "items", Object.values(out).reduce((n, a) => n + a.length, 0));

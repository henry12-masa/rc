// 全車種名簿(data/catalog/roster.mjs)を、サイトが読む形に分割して public/catalog-data/ に書き出す。
//   public/catalog-data/index.json            カテゴリごとの件数と年ごとの件数
//   public/catalog-data/<カテゴリ>/<年>.json  その年に初出の車種 [[初出年月(年だけのこともある), 車種名, シャーシ, 限定なら1, 厳選slug], ...]
//   年の分からない車種は <カテゴリ>/0.json にまとめる(ページでは「年不明」と表示)。
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { loadRoster } from "../data/catalog/roster.mjs";
import { games } from "../data/catalog.mjs";
import { GRADES, SERIES } from "../data/taxonomies.mjs";
import { coreName } from "../data/kit-key.mjs";

const raw = loadRoster();
// 名簿の更新日(日本時間)
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const OUT = new URL("../public/catalog-data/", import.meta.url);

const ORDER = Object.keys(GRADES);
const SHORT = Object.fromEntries(Object.entries(GRADES).map(([k, v]) => [k, v.replace(/[(（].*$/, "").trim()]));
// 名簿のシャーシ欄は短い名前で出す
const CHASSIS_LABEL = Object.fromEntries(Object.entries(SERIES).map(([k, v]) => [k, v.replace(/[(（].*$/, "").trim()]));
CHASSIS_LABEL.vintage = "";
CHASSIS_LABEL.other = "";

// 厳選マシンの索引: 品番と車種名のキー
const byItem = new Map(games.filter((g) => g.model).map((g) => [g.model, g]));
const byName = new Map(games.map((g) => [coreName(g.title), g]));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const index = [];
let linked = 0;
for (const slug of ORDER) {
	const list = raw.filter((k) => k.s === slug).sort((a, b) => (a.d || "9999").localeCompare(b.d || "9999") || a.n.localeCompare(b.n, "ja"));
	if (!list.length) continue;
	const byYear = new Map();
	for (const k of list) {
		const year = k.d ? k.d.slice(0, 4) : "0";
		const hit = (k.item && byItem.get(k.item)) || byName.get(coreName(k.n));
		// 同じ名前の元の車種と復刻版がある場合、年が違う厳選には結び付けない
		const ok = hit && (!k.d || hit.released.slice(0, 4) === k.d.slice(0, 4));
		const row = [k.d || "", k.n, CHASSIS_LABEL[k.c] ?? "", k.l ? 1 : 0];
		if (ok) { row.push(hit.slug); linked++; }
		if (!byYear.has(year)) byYear.set(year, []);
		byYear.get(year).push(row);
	}
	mkdirSync(new URL(`${slug}/`, OUT), { recursive: true });
	const years = [];
	for (const [year, rows] of [...byYear].sort(([a], [b]) => (a === "0" ? 1 : b === "0" ? -1 : a.localeCompare(b)))) {
		writeFileSync(new URL(`${slug}/${year}.json`, OUT), JSON.stringify(rows));
		years.push([Number(year), rows.length]);
	}
	index.push({ slug, label: GRADES[slug], short: SHORT[slug], count: list.length, dl: list.filter((k) => k.l).length, years });
}
const total = index.reduce((n, p) => n + p.count, 0);
writeFileSync(new URL("index.json", OUT), JSON.stringify({ updated: TODAY, total, grades: index }));
console.log(`全車種名簿: ${total}車種 / ${index.length}カテゴリ(厳選マシンへのリンク ${linked}件 / 厳選${games.length}台)`);

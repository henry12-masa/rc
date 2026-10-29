// マシンデータの初出年月を、全車種名簿(data/catalog/roster.mjs)と照合する。
// 使い方: node scripts/check-years.mjs data/kits-*.mjs
// 名簿の年月はタミヤ公式「発売月製品一覧」と、ウィキペディア「タミヤのRC製品一覧」(年だけ)・各車種の記事による。
// 名簿が年だけのときは、年が合っていれば一致とみなす。
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { coreName as core } from "../data/kit-key.mjs";
import { loadRoster } from "../data/catalog/roster.mjs";

const raw = loadRoster();
let bad = 0, miss = 0, ok = 0, nodate = 0;
const same = (kit, r) => r.d === kit.released || (r.d.length === 4 && kit.released.startsWith(r.d)) || (kit.released.length === 4 && r.d.startsWith(kit.released));
for (const file of process.argv.slice(2)) {
	const list = (await import(pathToFileURL(resolve(file)).href)).default;
	for (const kit of list) {
		const c = core(kit.title);
		const byItem = kit.model ? raw.filter((r) => r.item === kit.model) : [];
		const exact = byItem.length ? byItem : raw.filter((r) => core(r.n) === c);
		const cands = exact.length ? exact : raw.filter((r) => core(r.n).startsWith(c) || (c.startsWith(core(r.n)) && core(r.n).length >= 4));
		if (!cands.length) { miss++; console.log(`?? ${kit.slug} 「${kit.title}」${kit.released} 名簿に見つからない`); continue; }
		const dated = cands.filter((r) => r.d);
		if (!dated.length) { nodate++; console.log(`-- ${kit.slug} 「${kit.title}」${kit.released} 名簿に年月がない(別の出典を確認すること)`); continue; }
		if (dated.some((r) => same(kit, r))) { ok++; continue; }
		bad++; console.log(`NG ${kit.slug} 「${kit.title}」掲載${kit.released} / 名簿 ${dated.slice(0, 4).map((r) => `${r.d} ${r.n}${r.src ? ` (${r.src})` : ""}`).join(" | ")}`);
	}
}
console.log(`一致 ${ok} / 年月が違う ${bad} / 名簿に年月なし ${nodate} / 名簿で見つからない ${miss}`);

// 日本語版ウィキペディア「タミヤのRC製品一覧」の「歴代モデル > 電動RCカー」(1976〜2009年)を年ごとに読み出す。
// 入力: data/catalog/wiki-rc-list.wiki(wikitext)  出力: data/catalog/wiki-list.json [{n, y, c, note}]
// 「(復刻版として再発売)」などの注記は、のちに復刻されたことを示すだけなので、年はそのまま初出として使う。
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync(new URL("../../data/catalog/wiki-rc-list.wiki", import.meta.url), "utf8");
const start = src.indexOf("===電動RCカー===", src.indexOf("==歴代モデル=="));
const end = src.indexOf("===その他===", start);
const body = src.slice(start, end);
// ウィキペディアの表記を、タミヤの商品名や名簿のほかの行に合わせる分
const NAME_FIX = {
	"ティレル・P34": { n: "タイレルP34シックスホイーラー", item: "58003" },
	"ランチボックス・ダッジバン": { n: "ランチボックス" },
	"4×4モンスターピックアップ TXT-1": { n: "4×4モンスタートラック TXT-1" },
	"ホットショット4WD": { n: "ホットショット" },
};
const out = [];
let year = 0;
for (const raw of body.split("\n")) {
	const ym = raw.match(/^====\s*(\d{4})年\s*====/);
	if (ym) { year = Number(ym[1]); continue; }
	if (!/^\s*\*/.test(raw) || !year) continue;
	let s = raw.replace(/^\s*\*+\s*/, "")
		.replace(/<ref[^>]*\/>/g, "").replace(/<ref[\s\S]*?<\/ref>/g, "")
		.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1").replace(/\[\[([^\]#]*)(#[^\]]*)?\]\]/g, "$1")
		.replace(/\[http[^\]]*\]/g, "").replace(/'''?/g, "").replace(/\s+/g, " ").trim();
	// 「 - 説明」は名前から外す
	s = s.replace(/\s+-\s+.*$/, "");
	const note = (s.match(/[（(]([^)）]*(復刻|再発売)[^)）]*)[)）]/) ?? [])[1] ?? "";
	s = s.replace(/[（(][^)）]*(復刻|再発売)[^)）]*[)）]/g, "").trim();
	const item = (s.match(/^(\d{5})\s+/) ?? [])[1] ?? "";
	s = s.replace(/^\d{5}\s+/, "");
	const c = (s.match(/[（(]([^)）]*)[)）]\s*$/) ?? [])[1] ?? "";
	if (!s) continue;
	const fix = NAME_FIX[s];
	out.push({ n: fix?.n ?? s, y: year, c, item: fix?.item ?? item, note });
}
writeFileSync(new URL("../../data/catalog/wiki-list.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("wiki-list", out.length, "件", out[0], out.at(-1));

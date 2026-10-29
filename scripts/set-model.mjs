// 厳選マシンの品番を書き換える: node scripts/set-model.mjs <ファイル> '{"slug":"58001",...}'
import fs from "node:fs";
const [file, json] = process.argv.slice(2);
let s = fs.readFileSync(file, "utf8");
for (const [slug, num] of Object.entries(JSON.parse(json))) {
	const head = `k("${slug}", "`;
	const i = s.indexOf(head);
	if (i < 0) { console.log("not found", slug); continue; }
	const t = s.indexOf('", "', i + head.length) + 4; // 車種名の後ろ
	const e = s.indexOf('"', t);
	s = s.slice(0, t) + num + s.slice(e);
}
fs.writeFileSync(file, s);

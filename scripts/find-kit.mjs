// 全車種名簿から車種名を探す: node scripts/find-kit.mjs <正規表現> [カテゴリ]
import { loadRoster } from "../data/catalog/roster.mjs";
const kits = loadRoster();
const [re, grade] = process.argv.slice(2);
const r = new RegExp(re, "i");
for (const k of kits) if (r.test(k.n.normalize("NFKC")) && (!grade || k.s === grade)) console.log(`${k.d || "----"}\t${k.s}\t${k.l ? "限定\t" : "\t"}${k.item ? `ITEM ${k.item}\t` : "\t"}${k.n}\t${k.c}\t${k.src || ""}`);

// 全車種名簿を組み立てる。build-catalog / check-years / find-kit が共通で使う。
//   tamiya-monthly.json  タミヤ公式「発売月製品一覧」(電動RCカー・エンジンRCカー)。月は初出の月として使う(scripts/catalog/monthly.mjs)
//   wiki-list.json       日本語版ウィキペディア「タミヤのRC製品一覧」の年別の一覧(1976〜2009年、年だけ)(scripts/catalog/wiki-list.mjs)
//   date-fixes.json      ウィキペディアの各車種の記事などで月まで確かめられた分 [{n, d, src}]
//   additions.json       どちらの資料にもない車種を手で足す分 [{n, d, c, s, item, src}]
// 1行の形: { n: 車種名, s: カテゴリslug, c: シャーシslug, d: "YYYY-MM" か "YYYY", l: 限定なら1, item: 品番, src: 出典 }
import { readFileSync, existsSync } from "node:fs";
import { coreName, chassisOfName } from "../kit-key.mjs";

const read = (name, fallback = []) => {
	const url = new URL(name, import.meta.url);
	return existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : fallback;
};

/** 名簿に載せない商品(ボディだけ・パーツ・トレーラーなど) */
const NOT_A_CAR = /ボディ(パーツ)?セット|スペアボディ|ボディ\s*\(|セミトレーラー|トレーラー用|パーツセット|オプション|ホイール|タイヤ|ダンパー|モーター(?!.*RC)|ギヤ|ギア|ステッカー|ドライバー人形|アップグレード|コンバージョン|ハイキャパシティ|メカレス(?!セット)/;

/** 品番から限定品を見分ける(84xxx・47xxx・49xxx は限定・特別企画) */
const isLimited = (item) => /^(84|47|49)\d{3}$/.test(item ?? "");

/** 商品名と品番からカテゴリを決める */
export function categoryOf(name, chassis, item = "") {
	const full = name.normalize("NFKC");
	const isEngine = /^1\/\d+\s*RCE\b/.test(full) || /^44\d{3}$/.test(item);
	const n = full.replace(/^1\/\d+\s*(RCE?|R\/C)\s*/, "").replace(/[・\s]/g, "");
	if (/^1\/14/.test(full) || /トレーラーヘッド|トラクター|ダンプ|ビッグトラック/.test(n)) return "bigtruck";
	if (isEngine || /エンジン|TNX|TG10|TGM|TGX|テラクラッシャー|マッドバイソン/.test(n) || /^1\/8/.test(full) || chassis === "engine") return "engine";
	if (/タムテック|1\/16|1\/24|ミニ$|Qステア/.test(n) || chassis === "tamtech") return "mini";
	if (/ウイリー|ウィリー|コミカル|ウイリス/.test(n) || chassis === "wr02") return "wheelie";
	if (/(?<![0-9A-Z])F-?1(?![0-9])|F189|フォーミュラ|グランプリ|フェラーリ\s*(312|F2001|F310|F189|412|640)|マクラーレン\s*MP|ウィリアムズ\s*FW|ウイリアムズ\s*(BMW\s*)?FW|ロータス\s*(79|99T|102|107)|ジョーダン|ティレル|タイレル|ベネトン|ブラバム|リジェ|ザウバー|ザウパー|フットワーク|ローラT9|マーチ|マルティニMk|ラルト|インディ/.test(n) || chassis === "f1") return "formula";
	if (/クラッド|ブルヘッド|モンスター|ブラックフット|ビートル(?!.*\(M)|ジャガ(ー)?ノート|TXT|デトネーター|ブレイズ|ダガー|ハイリフト|マッドブル|ランチボックス|パンプキン|アグリオス|ビッグフット|マッドブラスター|ブッシュデビル/.test(n) || chassis === "txt" || chassis === "twin") return "monster";
	if (/ジムニー|ランドクルーザー|ウニモグ|ブロンコ|ラングラー|パジェロ|ミュー|CR-V|FJクルーザー|ロックソッカー|G\s*500|Gクラス|メルセデス・ベンツ\s*G|ハイラックス|ディフェンダー|クローラー|レンジャー|ブレイザー|トゥアレグ|4×4|4x4/.test(n) || ["cc01", "cc02", "cr01"].includes(chassis)) return "crawler";
	if (/WRC|ラリー|Rally|サファリ|037|ストラトス|デルタ|クアトロ|クワトロ|アスコナ|Ra\)|ダカール|パリダカ/.test(n)) return "rally";
	if (chassis === "m" || /ミニクーパー|ミニ\s*クーパー|ミニ JCW|フィアット|アバルト|デミオ|ロードスター(?!.*TT)|スイフト|ビートル.*\(M|アルピーヌ|ホンダ\s*シティ|ルノー\s*5|ジュリア|ワゴンR|S800/.test(n)) return "compact";
	if (/バギー|ホッパー|ホーネット|ショット|ブーメラン|フロッグ|ファルコン|フォックス|アバンテ|イグレス|バンキッシュ|VQS|マンタレイ|トップフォース|スコーチャー|ドラゴン|アスチュート|ストライカー|セイバー|ゲイター|バイパー|インパクト|ホーク|ドゥルガ|バルドル|ファイター|チャンプ|オフローダー|ワイルドワン|スタジアム|ダート|デューン|ブリッツァー|プラズマエッジ|ネオ|ベアホーク|コンカラー|ダイナ|ブッシュ|マッドキャップ|ソニック|ビッグウィッグ|サンド|スーパーセイバー|BBX|アストラル|レイダー|キング|ブラット|ラフライダー|レーシングトラック|ヴァジュラ|レバント/.test(n) || ["dt", "df", "db", "bb01"].includes(chassis)) return "buggy";
	return "onroad";
}

function fromMonthly() {
	const monthly = read("tamiya-monthly.json", {});
	const rows = [];
	for (const [ym, list] of Object.entries(monthly)) {
		for (const [item, rawName, genre] of list) {
			const name = rawName.replace(/\s*発売日[:：].*$/, "").replace(/&#215;/g, "×").replace(/&amp;/g, "&").trim();
			if (NOT_A_CAR.test(name) && !/シャーシキット/.test(name)) continue;
			// XB(組み立て済み完成品)とフルセットは、同じ車種のキットが載るので外す
			if (/^XB\s|フルセット/.test(name.replace(/^1\/\d+\s*RC\s*/, "")) && !/フルオペレーション/.test(name)) continue;
			const c = chassisOfName(name);
			rows.push({
				n: name.replace(/^1\/\d+\s*(RCE?|R\/C)\s*/, ""),
				s: genre === "2050" ? "engine" : categoryOf(name, c, item),
				c,
				d: `${ym.slice(0, 4)}-${ym.slice(4)}`,
				l: isLimited(item) ? 1 : 0,
				item,
				src: `tamiya-month:${item}`,
			});
		}
	}
	return rows;
}

/**
 * 月別一覧の月が再販の月になっている行を見つけて直す。
 * 58xxx・56xxx・44xxx の品番はほぼ発売順に付いているので、自分より大きい品番にずっと古い月があれば、自分の月は再販の月とみなす。
 * そのときは、前後の品番(月が正しい行)の年が同じならその年を、違えば年不明("")にする。
 */
function fixReissueMonths(rows) {
	for (const series of ["58", "56", "44"]) {
		const list = rows.filter((r) => r.item?.startsWith(series)).sort((a, b) => a.item.localeCompare(b.item));
		let min = "9999-99";
		const bad = new Set();
		for (let i = list.length - 1; i >= 0; i--) {
			const r = list[i];
			const [y, m] = r.d.split("-").map(Number);
			const [my, mm] = min.split("-").map(Number);
			if (min !== "9999-99" && (y - my) * 12 + (m - mm) > 12) bad.add(r);
			else if (r.d < min) min = r.d;
		}
		const good = list.filter((r) => !bad.has(r));
		for (const r of bad) {
			const prev = good.filter((g) => g.item < r.item).at(-1);
			const next = good.find((g) => g.item > r.item);
			const year = prev && next && prev.d.slice(0, 4) === next.d.slice(0, 4) ? prev.d.slice(0, 4) : "";
			r.reissue = r.d;
			r.d = year;
			r.src = year ? "tamiya-order:" + r.item : "";
		}
	}
	return rows;
}

function fromWiki() {
	return read("wiki-list.json").map((w) => {
		const c = chassisOfName(w.n) || (w.y <= 1990 ? "vintage" : "");
		return { n: w.n, s: categoryOf(w.n, c, w.item), c, d: String(w.y), l: 0, item: w.item, src: "wikipedia:タミヤのRC製品一覧" };
	});
}

let cache;
export function loadRoster() {
	if (cache) return cache;
	const fixes = new Map(read("date-fixes.json").map((f) => [coreName(f.n), f]));
	const out = [];
	const seen = new Map(); // coreName → 行
	const items = new Set();
	// 1) 公式の月別一覧(品番と月がある)
	for (const r of fixReissueMonths(fromMonthly())) {
		if (items.has(r.item)) continue;
		items.add(r.item);
		out.push(r);
		seen.set(coreName(r.n), r);
	}
	// 2) ウィキペディアの年別の一覧(公式にないものだけ)
	for (const r of fromWiki()) {
		if (r.item && items.has(r.item)) continue;
		const key = coreName(r.n);
		const hit = seen.get(key);
		if (hit) {
			if (hit.d && r.d >= hit.d.slice(0, 4)) continue; // 同じか新しい年: 同じ商品
			if (!hit.d || hit.reissue || r.d >= String(Number(hit.d.slice(0, 4)) - 2)) {
				// 旧品番が再販の月で載っていた(または年不明)ので、ウィキペディアの年を初出にする
				hit.d = r.d; hit.src = r.src;
				continue;
			}
			// 公式の行は新しい品番の復刻版。元の車種は別の行として残す
		}
		seen.set(key, r);
		out.push(r);
	}
	// 3) 手で足す分
	for (const a of read("additions.json")) {
		const key = coreName(a.n);
		if (seen.has(key)) continue;
		const r = { l: 0, c: "", item: "", ...a, s: a.s ?? categoryOf(a.n, a.c ?? "") };
		seen.set(key, r);
		out.push(r);
	}
	// 4) 月まで確かめられた分で年を補う(年が一致するときだけ。force は公式の商品ページの発売日で月を直す分)
	for (const r of out) {
		const f = fixes.get(coreName(r.n));
		if (f && (f.force || r.d === "" || (r.d.length === 4 && f.d.startsWith(r.d)))) { r.d = f.d; r.src = f.src; }
	}
	// 5) まだ発売されていない月の商品は載せない(公式の一覧には発売予定の月も載る)
	const now = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7);
	cache = out.filter((r) => !r.d || r.d.slice(0, 7) <= now);
	return cache;
}

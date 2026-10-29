// data/ のマシンデータを、稼働中のEmDashサイトに反映する(マシンの追加・更新、用語・メニューの追加)。
// seed は空のデータベースにしか適用されないため、公開後のデータ更新はこのスクリプトで行う。
//
// 使い方:
//   ローカル:  node scripts/sync-remote.mjs --url http://localhost:4340   (開発用の dev-bypass で認証)
//   本番:      npx emdash login --url https://rc.napoblog.com   (最初に一度)
//              node scripts/sync-remote.mjs --url https://rc.napoblog.com
//   --dry-run を付けると、書き込まずに差分の件数だけ表示する。--posts-only で特集と固定ページだけを同期する。
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ERAS, GRADES, SERIES, eraForYear } from "../data/taxonomies.mjs";
import { games, bodyToPortableText } from "../data/catalog.mjs";
import { features, aboutPage } from "../data/features.mjs";

const args = process.argv.slice(2);
const argValue = (name) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
const BASE = (argValue("--url") ?? "http://localhost:4340").replace(/\/$/, "");
const DRY = args.includes("--dry-run");
// --only slug1,slug2 で、指定したものだけを同期する(定期更新で全件を書き直さないため)
const ONLY = argValue("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);

// ---- 認証
const headers = { "content-type": "application/json", "X-EmDash-Request": "1" };

function findStoredToken() {
	const candidates = [
		join(homedir(), ".config", "emdash", "auth.json"),
		join(process.env.XDG_CONFIG_HOME ?? "", "emdash", "auth.json"),
		join(process.env.APPDATA ?? "", "emdash", "auth.json"),
	];
	for (const file of candidates) {
		if (!file || !existsSync(file)) continue;
		const json = JSON.parse(readFileSync(file, "utf8"));
		// 保存形式の違いに備えて、URLをキーにした形と単一の形の両方を探す
		const entry = json[BASE] ?? json[new URL(BASE).origin] ?? json.instances?.[BASE] ?? json;
		const token = entry?.accessToken ?? entry?.token ?? entry?.access_token;
		if (token) return token;
	}
	return null;
}

async function authenticate() {
	if (process.env.EMDASH_TOKEN) {
		headers.authorization = `Bearer ${process.env.EMDASH_TOKEN}`;
		return "EMDASH_TOKEN";
	}
	const stored = findStoredToken();
	if (stored) {
		headers.authorization = `Bearer ${stored}`;
		return "emdash login の資格情報";
	}
	if (isLocal) {
		const res = await fetch(`${BASE}/_emdash/api/setup/dev-bypass?redirect=/`, { redirect: "manual" });
		const cookies = res.headers.getSetCookie?.() ?? [];
		if (!cookies.length) throw new Error("dev-bypass でセッションを取得できませんでした");
		headers.cookie = cookies.map((c) => c.split(";")[0]).join("; ");
		return "dev-bypass";
	}
	throw new Error("認証情報がありません。先に `npx emdash login --url " + BASE + "` を実行してください。");
}

async function api(method, path, body) {
	const res = await fetch(`${BASE}/_emdash/api${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let json;
	try {
		json = JSON.parse(text);
	} catch {
		json = { raw: text.slice(0, 300) };
	}
	if (!res.ok) {
		const err = new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
		err.status = res.status;
		throw err;
	}
	return json.data ?? json;
}

// ---- 1. 項目(amazon_query)
async function ensureFields() {
	const result = await api("GET", "/schema/collections/kits/fields");
	const fields = result.items ?? result.fields ?? result;
	const slugs = new Set((Array.isArray(fields) ? fields : []).map((f) => f.slug));
	if (slugs.has("amazon_query")) return "既存";
	if (DRY) return "追加予定";
	await api("POST", "/schema/collections/kits/fields", {
		slug: "amazon_query",
		label: "Amazon検索語(空なら自動、none でリンクなし)",
		type: "string",
		validation: null,
	});
	return "追加";
}

// ---- 2. 用語(年代・カテゴリ・シャーシ)
async function ensureTerms() {
	const wanted = {
		era: ERAS.map((e) => ({ slug: e.slug, label: e.label })),
		grade: Object.entries(GRADES).map(([slug, label]) => ({ slug, label })),
		series: Object.entries(SERIES).map(([slug, label]) => ({ slug, label })),
	};
	const added = [];
	for (const [name, terms] of Object.entries(wanted)) {
		const result = await api("GET", `/taxonomies/${name}/terms?limit=500`);
		const existing = new Set((result.items ?? result.terms ?? result).map((t) => t.slug));
		for (const term of terms) {
			if (existing.has(term.slug)) continue;
			added.push(`${name}:${term.slug}`);
			if (!DRY) await api("POST", `/taxonomies/${name}/terms`, term);
		}
	}
	return added;
}

// ---- 3. マシン
async function listAllGames() {
	const map = new Map();
	let cursor;
	do {
		const qs = new URLSearchParams({ limit: "100", status: "all" });
		if (cursor) qs.set("cursor", cursor);
		const result = await api("GET", `/content/kits?${qs}`);
		for (const item of result.items ?? []) map.set(item.slug, item);
		cursor = result.nextCursor;
	} while (cursor);
	return map;
}

function payloadFor(game) {
	return {
		data: {
			title: game.title,
			model_number: game.model,
			release_year: game.year,
			released: game.released,
			scale: game.scale,
			tier: game.tier,
			summary: game.summary,
			curator_note: game.note,
			content: bodyToPortableText(game.slug, game.body),
			amazon_query: game.amazonQuery,
		},
		taxonomies: {
			era: [eraForYear(game.year).slug],
			grade: game.grades,
			series: game.series,
		},
	};
}

async function syncGames() {
	const existing = await listAllGames();
	let created = 0;
	let updated = 0;
	const failures = [];
	const targets = ONLY ? games.filter((g) => ONLY.includes(g.slug)) : games;
	if (ONLY) {
		const missing = ONLY.filter((slug) => !targets.some((g) => g.slug === slug));
		if (missing.length) throw new Error(`--only に data/ にない slug があります: ${missing.join(", ")}`);
	}
	for (const [i, game] of targets.entries()) {
		const payload = payloadFor(game);
		const current = existing.get(game.slug);
		try {
			// 作成・更新は下書きとして保存されるため、続けて公開する
			if (current) {
				if (!DRY) {
					await api("PUT", `/content/kits/${current.id}`, payload);
					await api("POST", `/content/kits/${current.id}/publish`, {});
				}
				updated++;
			} else {
				if (!DRY) {
					const result = await api("POST", "/content/kits", { ...payload, slug: game.slug });
					const id = result.item?.id ?? result.id;
					await api("POST", `/content/kits/${id}/publish`, {});
				}
				created++;
			}
		} catch (error) {
			failures.push(`${game.slug}: ${error.message}`);
		}
		if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${targets.length}`);
	}
	return { created, updated, failures, total: targets.length };
}

// ---- 4. 特集(posts)と固定ページ(pages)
async function listAll(collection) {
	const map = new Map();
	let cursor;
	do {
		const qs = new URLSearchParams({ limit: "100", status: "all" });
		if (cursor) qs.set("cursor", cursor);
		const result = await api("GET", `/content/${collection}?${qs}`);
		for (const item of result.items ?? []) map.set(item.slug, item);
		cursor = result.nextCursor;
	} while (cursor);
	return map;
}

async function upsert(collection, existing, slug, payload) {
	const current = existing.get(slug);
	if (DRY) return current ? "updated" : "created";
	if (current) {
		await api("PUT", `/content/${collection}/${current.id}`, payload);
		await api("POST", `/content/${collection}/${current.id}/publish`, {});
		return "updated";
	}
	const result = await api("POST", `/content/${collection}`, { ...payload, slug });
	const id = result.item?.id ?? result.id;
	await api("POST", `/content/${collection}/${id}/publish`, {});
	return "created";
}

async function syncPosts() {
	const count = { created: 0, updated: 0 };
	const failures = [];
	const posts = await listAll("posts");
	// 筆者「組み継ぐ編集部」(seed の byline-editorial)を付ける。見つからなければ筆者なしで保存する
	let bylines;
	try {
		const result = await api("GET", "/admin/bylines?limit=100");
		const editorial = (result.items ?? result.bylines ?? result).find?.((b) => b.slug === "editorial");
		if (editorial) bylines = [{ bylineId: editorial.id }];
	} catch {}
	for (const f of features) {
		const payload = {
			data: { title: f.title, excerpt: f.excerpt, content: f.content },
			taxonomies: { category: [f.category], tag: f.tags },
			...(bylines ? { bylines } : {}),
		};
		try {
			count[await upsert("posts", posts, f.slug, payload)]++;
		} catch (error) {
			failures.push(`${f.slug}: ${error.message}`);
		}
	}
	const pages = await listAll("pages");
	try {
		count[await upsert("pages", pages, aboutPage.slug, { data: aboutPage.data })]++;
	} catch (error) {
		failures.push(`page ${aboutPage.slug}: ${error.message}`);
	}
	return { ...count, failures };
}

// ---- 5. メニュー
async function ensureMenuItem(label, url, after) {
	const menu = await api("GET", "/menus/primary");
	const items = menu.items ?? [];
	if (items.some((item) => (item.customUrl ?? item.url) === url)) return "既存";
	if (DRY) return "追加予定";
	const anchor = items.find((item) => (item.customUrl ?? item.url) === after);
	await api("POST", "/menus/primary/items", {
		type: "custom",
		label,
		customUrl: url,
		sortOrder: anchor ? (anchor.sortOrder ?? 1) + 1 : items.length,
	});
	return "追加";
}

const how = await authenticate();
console.log(`同期先: ${BASE}(認証: ${how})${DRY ? " [dry-run]" : ""}`);
console.log(`項目 amazon_query: ${await ensureFields()}`);
const terms = await ensureTerms();
console.log(`用語の追加: ${terms.length ? terms.join(", ") : "なし"}`);
const skipKits = args.includes("--menu-only") || args.includes("--posts-only");
const result = skipKits ? { created: 0, updated: 0, failures: [], total: 0 } : await syncGames();
console.log(`マシン: 新規 ${result.created} / 更新 ${result.updated} / 全 ${result.total}`);
if (result.failures.length) {
	console.log(`失敗 ${result.failures.length}件:`);
	for (const f of result.failures.slice(0, 20)) console.log("  " + f);
}
// --only のときは特集・固定ページを書き直さない
if (!args.includes("--menu-only") && !ONLY) {
	const posts = await syncPosts();
	console.log(`特集・固定ページ: 新規 ${posts.created} / 更新 ${posts.updated}`);
	for (const f of posts.failures) console.log("  失敗 " + f);
}
console.log(`メニュー「シャーシガイド」: ${await ensureMenuItem("シャーシガイド", "/chassis", "/timeline")}`);
console.log(`メニュー「全車種名簿」: ${await ensureMenuItem("全車種名簿", "/catalog", "/chassis")}`);

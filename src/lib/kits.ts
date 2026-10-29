import { getAllTermsForEntries, getEmDashCollection } from "emdash";
import { ERAS, GRADES, SERIES, TIERS } from "../../data/taxonomies.mjs";

export { ERAS, GRADES, SERIES, TIERS };

export type Tier = keyof typeof TIERS;
export type Era = (typeof ERAS)[number];

export interface Term {
	slug: string;
	label: string;
}

export interface Kit {
	slug: string;
	id: string;
	title: string;
	/** 品番(RX-78-2 など) */
	model: string;
	year: number;
	/** 発売年月「2015-08」 */
	released: string;
	/** スケール「1/10」 */
	scale: string;
	tier: Tier;
	summary: string;
	note: string;
	cover: unknown;
	content: unknown;
	officialUrl: string;
	amazonQuery: string;
	era: Term | null;
	grades: Term[];
	series: Term[];
}

/** 既存のページ部品が Game という名前で使っているので別名も出しておく */
export type Game = Kit;

const TIER_ORDER: Record<string, number> = { essential: 0, recommended: 1, deep: 2 };

/**
 * 公開中のキットをすべて読み込み、年代・カテゴリ・シャーシのタームを付けて返す。
 * 掲載数は数百件規模なので、絞り込みと並べ替えはサーバー側のJSで行う。
 */
export async function loadGames() {
	const { entries, error, cacheHint } = await getEmDashCollection("kits", {
		limit: 1000,
		orderBy: { release_year: "asc" },
	});
	if (error) throw error;

	const termsByEntry = await getAllTermsForEntries(
		"kits",
		entries.map((e) => e.data.id),
	);
	const pick = (t: { slug: string; label: string }) => ({ slug: t.slug, label: t.label });

	const games: Kit[] = entries.map((entry) => {
		const d = entry.data as Record<string, any>;
		const terms = termsByEntry.get(d.id) ?? {};
		return {
			slug: entry.id,
			id: d.id,
			title: d.title ?? "",
			model: d.model_number ?? "",
			year: Number(d.release_year) || 0,
			released: d.released ?? "",
			scale: d.scale ?? "",
			tier: (d.tier ?? "recommended") as Tier,
			summary: d.summary ?? "",
			note: d.curator_note ?? "",
			cover: d.cover ?? null,
			content: d.content ?? null,
			officialUrl: d.official_url ?? "",
			amazonQuery: d.amazon_query ?? "",
			era: terms.era?.[0] ? pick(terms.era[0]) : null,
			grades: (terms.grade ?? []).map(pick),
			series: (terms.series ?? []).map(pick),
		};
	});

	games.sort(byRelease);
	return { games, cacheHint };
}

function byRelease(a: Kit, b: Kit) {
	return (a.released || String(a.year)).localeCompare(b.released || String(b.year)) || a.title.localeCompare(b.title, "ja");
}

/** 「2015-08」→「2015年8月」 */
export function formatReleased(kit: Pick<Kit, "released" | "year">) {
	const [y, m] = (kit.released || String(kit.year)).split("-");
	return m ? `${y}年${Number(m)}月` : `${y}年`;
}

export type SortKey = "old" | "new" | "tier" | "title";

export function sortGames(games: Kit[], sort: SortKey) {
	const list = [...games];
	switch (sort) {
		case "new":
			return list.sort((a, b) => byRelease(b, a));
		case "tier":
			return list.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || byRelease(a, b));
		case "title":
			return list.sort((a, b) => a.title.localeCompare(b.title, "ja"));
		default:
			return list.sort(byRelease);
	}
}

export function eraBySlug(slug: string | null | undefined) {
	return ERAS.find((e) => e.slug === slug) ?? null;
}

/** 一覧ページの絞り込みURLを作る */
export function kitsUrl(params: Record<string, string | undefined>) {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
	const qs = search.toString();
	return qs ? `/kits?${qs}` : "/kits";
}

/** 同じシャーシ(なければ同じカテゴリ)の他のマシン */
export function relatedGames(kit: Kit, all: Kit[], limit = 6) {
	const seriesSlugs = new Set(kit.series.map((s) => s.slug));
	const gradeSlugs = new Set(kit.grades.map((g) => g.slug));
	return all
		.filter((k) => k.slug !== kit.slug)
		.map((k) => ({
			kit: k,
			score:
				k.series.filter((x) => seriesSlugs.has(x.slug)).length * 2 +
				k.grades.filter((x) => gradeSlugs.has(x.slug)).length,
		}))
		.filter((x) => x.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				TIER_ORDER[a.kit.tier] - TIER_ORDER[b.kit.tier] ||
				Math.abs(a.kit.year - kit.year) - Math.abs(b.kit.year - kit.year),
		)
		.slice(0, limit)
		.map((x) => x.kit)
		.sort(byRelease);
}

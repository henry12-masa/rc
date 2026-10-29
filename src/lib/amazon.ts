import { CHASSIS_GUIDE, GRADE_GUIDE, TOOLS } from "../../data/grades.mjs";

/** Amazonアソシエイトのトラッキングid */
export const AMAZON_TAG = "hitomi0303-22";

export function amazonSearchUrl(query: string) {
	return `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

export interface AmazonLink {
	label: string;
	url: string;
}

/** 検索語に使う商品名: 名簿由来の［4］のような番号を外す */
function cleanTitle(title: string) {
	return title.replace(/［\d+］|\[\d+\]/g, "").trim();
}

/**
 * マシンのAmazonリンク。管理画面の amazon_query が "none" ならリンクなし、
 * 入力があればそれを検索語にする。空なら商品名で検索する。
 */
export function amazonForGame(kit: { title: string; amazonQuery?: string }): AmazonLink | null {
	const override = kit.amazonQuery?.trim();
	if (override === "none") return null;
	const query = override || `タミヤ RC ${cleanTitle(kit.title)}`;
	return { label: `「${query}」をAmazonで探す`, url: amazonSearchUrl(query) };
}

export interface GradeInfo {
	slug: string;
	since: number | null;
	scale: string;
	level: number;
	desc: string;
	tip: string;
	amazon: AmazonLink | null;
}

export function gradeInfo(slug: string): GradeInfo | null {
	const g = (GRADE_GUIDE as Record<string, any>)[slug];
	if (!g) return null;
	return {
		slug,
		since: g.since,
		scale: g.scale,
		level: g.level,
		desc: g.desc,
		tip: g.tip,
		amazon: g.amazon ? { label: g.amazon.label, url: amazonSearchUrl(g.amazon.query) } : null,
	};
}

/** 道具のAmazonリンク */
export function toolLinks(): AmazonLink[] {
	return TOOLS.map((t) => ({ label: t.label, url: amazonSearchUrl(t.query) }));
}

/** 全車種名簿の1行のAmazon検索リンク(限定品は一般の店頭にないので出さない) */
export function amazonCatalogUrl(name: string, limited: number): string | null {
	if (limited) return null;
	return amazonSearchUrl(`タミヤ RC ${cleanTitle(name)}`);
}

export interface ChassisInfo {
	slug: string;
	first: string;
	desc: string;
}

export function chassisInfo(slug: string): ChassisInfo | null {
	const c = (CHASSIS_GUIDE as Record<string, any>)[slug];
	return c ? { slug, first: c.first, desc: c.desc } : null;
}

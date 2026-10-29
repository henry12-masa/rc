import { env } from "cloudflare:workers";

/** 全車種名簿の1行: [初出年月(年だけのこともある), 車種名, シャーシ, 限定品なら1, 厳選マシンのslug] */
export type CatalogRow = [string, string, string, number, string?];

export interface CatalogPlatform {
	slug: string;
	label: string;
	short: string;
	count: number;
	/** 限定品の件数 */
	dl: number;
	years: Array<[number, number]>;
}

export interface CatalogIndex {
	updated: string;
	total: number;
	grades: CatalogPlatform[];
}

/** public/catalog-data/ のJSONを、Workerのバンドルに含めずに静的アセットから読む */
async function readAsset<T>(path: string, origin: string): Promise<T | null> {
	const assets = (env as unknown as { ASSETS?: { fetch: (r: Request) => Promise<Response> } }).ASSETS;
	const url = new URL(`/catalog-data/${path}`, origin);
	const res = assets ? await assets.fetch(new Request(url)) : await fetch(url);
	if (!res.ok) return null;
	return (await res.json()) as T;
}

export function loadCatalogIndex(origin: string) {
	return readAsset<CatalogIndex>("index.json", origin);
}

export function loadCatalogYear(platform: string, year: number, origin: string) {
	return readAsset<CatalogRow[]>(`${platform}/${year}.json`, origin);
}

/** 「2015-08」→「8月」、年だけの日付は「時期不明」 */
export function formatCatalogDate(d: string) {
	if (!d) return "—";
	const [, m] = d.split("-");
	if (m) return `${Number(m)}月`;
	return "月不明";
}

/** 検索用: 全角半角・大文字小文字・空白の違いを無視して比べる */
export function normalizeForSearch(s: string) {
	return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

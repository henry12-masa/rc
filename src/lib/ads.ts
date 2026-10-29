// AdSense の広告ユニット(サイトごとに AdSense 管理画面で作成)
export const AD_CLIENT = "ca-pub-8398161859137802";
export const AD_SLOTS = {
	/** ディスプレイ・縦長レスポンシブ:記事のサイドバー、作品ページの本文横 */
	side: "1323129371",
	/** 記事内広告:本文の途中 */
	article: "3721227851",
} as const;

type Block = { _type?: string; style?: string };

/**
 * 本文(Portable Text)を n 個目の見出しの直前で2つに分ける。
 * 見出しは h2 があれば h2、なければ h3 を数える。足りなければ後半は空。
 */
export function splitAtHeading<T extends Block>(blocks: T[], n = 2): [T[], T[]] {
	const level = blocks.some((b) => b.style === "h2") ? "h2" : "h3";
	let seen = 0;
	const at = blocks.findIndex((b) => b._type === "block" && b.style === level && ++seen === n);
	return at > 0 ? [blocks.slice(0, at), blocks.slice(at)] : [blocks, []];
}

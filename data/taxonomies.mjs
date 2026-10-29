// 年代・カテゴリ・シャーシ・推し度の定義。seed/seed.json は scripts/build-seed.mjs がここから生成する。
// 内部のタクソノミー名は grade = カテゴリ、series = シャーシ(組み継ぐ・走り継ぐと共通のコードを使うため)。

// 年代は「初出の発売年」で自動判定する(from〜to を含む)
export const ERAS = [
	{ slug: "dawn", label: "黎明(1976〜1978)", short: "黎明", from: 1976, to: 1978,
		lead: "1976年のポルシェ934ターボRSRから始まった。プラモデルの金型を生かした1/12のスケールモデルが、走るようになった時代。" },
	{ slug: "buggy", label: "バギーの夜明け(1979〜1983)", short: "夜明け", from: 1979, to: 1983,
		lead: "1979年のバギーチャンプで、RCカーは土の上を走り出した。ハイラックス、ワイルドウイリス、マイティフロッグと、オフロードの名車が続いた。" },
	{ slug: "boom", label: "RCブーム(1984〜1990)", short: "ブーム", from: 1984, to: 1990,
		lead: "グラスホッパー、ホーネット、ホットショット、アバンテ。『ラジコンボーイ』とタミヤRCカーグランプリに、子どもたちが熱中した時代。" },
	{ slug: "touring", label: "ツーリングカーの時代(1991〜2003)", short: "ツーリング", from: 1991, to: 2003,
		lead: "1991年のTA01で、4WDツーリングカーが主役になった。TA02、TA03、TL-01、TB-01、TT-01と、オンロードのシャーシが次々に生まれた。" },
	{ slug: "revival", label: "復刻と新世代(2004〜2016)", short: "復刻", from: 2004, to: 2016,
		lead: "2004年のホーネットから、ブームの名車が次々に復刻された。同じころ、TT-02やDT-02、CC-01など、今も続くシャーシが登場した。" },
	{ slug: "now", label: "現行(2017〜)", short: "現行", from: 2017, to: 2100,
		lead: "TA08、M-08、BB-01、CC-02、ホーネットEVO。2026年にタミヤRCは50周年を迎え、新作と復刻が同じ店先に並んでいる。" },
];

// カテゴリ
export const GRADES = {
	onroad: "オンロード(ツーリング・GT)",
	rally: "ラリー",
	compact: "コンパクトカー(Mシャーシ)",
	formula: "フォーミュラ",
	buggy: "オフロードバギー",
	monster: "ビッグタイヤ・モンスタートラック",
	crawler: "4×4・クローラー",
	wheelie: "ウイリー・コミカル",
	bigtruck: "1/14 ビッグトラック",
	engine: "エンジンRCカー",
	mini: "小型RC(タムテックギアなど)",
	special: "限定・特別企画",
};

// シャーシ(おおよそ登場順)
export const SERIES = {
	vintage: "専用シャーシ(初期・復刻)",
	f1: "F1シャーシ(F10x・F201)",
	ta01: "TA01・TA02",
	ff: "FFシャーシ(FF01〜FF-04)",
	m: "Mシャーシ",
	ta03: "TA03",
	tl01: "TL-01",
	tb: "TB-01〜TB-05",
	tbevo: "TBエボリューション",
	ta04: "TA04",
	trf: "TRFシリーズ",
	tt01: "TT-01",
	dt: "DTシリーズ(DT-01〜DT-04)",
	df: "DFシリーズ(DF-01〜DF-03)",
	db: "DBシリーズ(DB01・DB02)",
	ta05: "TA05",
	cc01: "CC-01",
	cr01: "CR-01",
	ta06: "TA06",
	xv01: "XV-01",
	tt02: "TT-02",
	txt: "TXT-1・TXT-2",
	wr02: "WR-02(ウイリー)",
	twin: "ツインモーター",
	ta07: "TA07",
	cc02: "CC-02",
	ta08: "TA08",
	bb01: "BB-01",
	bigtruck: "1/14 トラックシャーシ",
	engine: "エンジンカーのシャーシ(TG・TNX)",
	tamtech: "タムテックギア(GB-01など)",
	other: "その他",
};

export const TIERS = {
	essential: "定番",
	recommended: "推し",
	deep: "通好み",
};

export function eraForYear(year) {
	return ERAS.find((e) => year >= e.from && year <= e.to);
}

// 車種名の表記ゆれを吸収した比較用のキー(スケール・シャーシ表記・記号を外す)。
// 全車種名簿と厳選マシンを突き合わせるときに使う。復刻の年「(2011)」は別の商品として残す。
export const coreName = (t) =>
	t.normalize("NFKC").toLowerCase()
		.replace(/^1\/\d+\s*(rc|r\/c)?\s*/, "")
		.replace(/[(（][^)）]*(シャーシ|chassis)[^)）]*[)）]/g, "")
		.replace(/[\s・:：\-－―‐~〜!！?？'’"「」『』()（）\[\]【】.,、。&＆/]/g, "");

/** 商品名からシャーシ表記を取り出して、サイトのシャーシslugにする(見つからなければ "") */
export function chassisOfName(name) {
	const n = name.normalize("NFKC").toUpperCase().replace(/^1\/\d+\s*(RCE?|R\/C)\s*/, "");
	const m = n.match(/[(（]([^)）]*?)シャーシ[^)）]*[)）]/) ?? n.match(/[(（]([A-Z]{1,4}-?\d{2,3}[A-Z0-9 .\-]*)[)）]/);
	const c = (m ? m[1] : n).replace(/\s+/g, "");
	const rules = [
		[/^TT-?02/, "tt02"], [/^TT-?01/, "tt01"], [/^TL-?01/, "tl01"],
		[/^TA-?0[12]/, "ta01"], [/^TA-?03/, "ta03"], [/^TA-?04/, "ta04"], [/^TA-?05/, "ta05"], [/^TA-?06/, "ta06"], [/^TA-?07/, "ta07"], [/^TA-?08/, "ta08"],
		[/^TB-?EVO|^TBエボ/, "tbevo"], [/^TB-?0\d/, "tb"], [/^TRF/, "trf"],
		[/^FF-?0\d/, "ff"], [/^M[BF]?-?0\d/, "m"], [/^F10\d|^F201/, "f1"],
		[/^DT-?0\d/, "dt"], [/^DF-?0\d/, "df"], [/^DB-?0\d/, "db"],
		[/^CC-?01/, "cc01"], [/^CC-?02/, "cc02"], [/^CR-?01/, "cr01"], [/^XV-?01/, "xv01"], [/^TXT/, "txt"],
		[/^WR-?02/, "wr02"], [/^WT-?01/, "twin"], [/^BB-?01/, "bb01"],
		[/^GB-?01|^G6-?01/, "tamtech"], [/^TNX|^TG/, "engine"],
	];
	for (const [re, slug] of rules) if (re.test(c)) return slug;
	return "";
}

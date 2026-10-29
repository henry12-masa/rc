// マシンデータの書き方。解説本文は4つの見出しで組み立てる。
export const SECTIONS = ["どんなマシン", "走らせどころ", "タミヤRC史の中で", "こんな人におすすめ"];

/**
 * k(slug, 車種名, 品番, 初出"YYYY-MM"(月が確かめられないときは"YYYY"), シャーシ(空白区切り), カテゴリ(空白区切り), 推し度, ひとこと紹介, 一言, [本文4段落], Amazon検索語?, スケール?)
 * 初出の年月は全車種名簿(data/catalog/roster.mjs)と scripts/check-years.mjs で照合する。
 * 復刻版は別の車種として扱い、車種名に「(2011)」のように復刻の年を付ける。
 */
export const k = (slug, title, model, released, chassis, grade, tier, summary, note, parts, amazonQuery = "", scale = "1/10") => ({
	slug,
	title,
	model,
	released,
	year: Number(released.slice(0, 4)),
	scale,
	grades: grade.split(" "),
	series: chassis.split(" "),
	tier,
	summary,
	note,
	body: parts.map((text, i) => `## ${SECTIONS[i]}\n${text}`).join("\n\n"),
	amazonQuery,
});

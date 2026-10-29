// 全マシンをひとつの配列にまとめる。
// seed生成(scripts/build-seed.mjs)と本番への同期(scripts/sync-remote.mjs)の両方がここを読む。
import classic from "./kits-classic.mjs";
import modern from "./kits-modern.mjs";
import updates from "./kits-updates.mjs";

export const games = [...classic, ...modern, ...updates].sort(
	(a, b) => a.released.localeCompare(b.released) || a.title.localeCompare(b.title, "ja"),
);

let keyCounter = 0;
const key = (prefix) => `${prefix}${(keyCounter++).toString(36)}`;

/** 本文を Portable Text のブロック配列にする。「## 」で始まる行は小見出し(h3)、空行で段落を区切る */
export function bodyToPortableText(slug, body) {
	const blocks = [];
	for (const chunk of body.trim().split(/\n\s*\n/)) {
		const para = [];
		for (const line of chunk.split("\n")) {
			if (line.startsWith("## ")) blocks.push({ style: "h3", text: line.slice(3).trim() });
			else para.push(line.trim());
		}
		if (para.join("")) blocks.push({ style: "normal", text: para.join("") });
	}
	return blocks.map((b, i) => ({
		_type: "block",
		_key: `${slug}-b${i}`,
		style: b.style,
		markDefs: [],
		children: [{ _type: "span", _key: key(`${slug}-s`), text: b.text, marks: [] }],
	}));
}

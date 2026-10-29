import type { APIRoute } from "astro";
import { loadCatalogIndex } from "../lib/catalog";

// EmDash のサイトマップに入らない固定ページと、全車種名簿のページ
export const GET: APIRoute = async ({ url }) => {
	const index = await loadCatalogIndex(url.origin);
	const paths = ["/kits", "/timeline", "/chassis", "/catalog"];
	for (const pf of index?.grades ?? []) {
		paths.push(`/catalog/${pf.slug}`);
		for (const [year] of pf.years) paths.push(`/catalog/${pf.slug}/${year}`);
	}
	const lastmod = index?.updated ?? "";
	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		paths.map((p) => `  <url><loc>${url.origin}${p}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n") +
		`\n</urlset>\n`;
	return new Response(body, {
		headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
	});
};

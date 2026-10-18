import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*on Instagram\s*:?\s*"?$/i, "")
    .replace(/^"?|"?$/g, "")
    .trim();
}

export const instagramAdapter: PlatformAdapter = {
  name: "instagram",
  domains: ["instagram.com", "instagr.am"],

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return (
        host === "instagram.com" ||
        host.endsWith(".instagram.com") ||
        host === "instagr.am"
      );
    } catch {
      return false;
    }
  },

  async fetchMeta(url: string): Promise<FetchedMeta> {
    const html = await fetchHtml(url, this.domains);
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const title = cleanTitle(ogTitle || $("title").first().text());
    const cover = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");

    if (!title) throw new Error("未能解析标题");

    const canonicalUrl = absolutize(ogUrl || url, url);

    return {
      title,
      cover: cover ? absolutize(cover, canonicalUrl) : undefined,
      canonicalUrl,
    };
  },
};

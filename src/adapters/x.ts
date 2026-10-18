import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*on X\s*:?\s*"?$/i, "")
    .replace(/\s*on Twitter\s*:?\s*"?$/i, "")
    .replace(/^"?|"?$/g, "")
    .trim();
}

export const xAdapter: PlatformAdapter = {
  name: "x",
  domains: ["twitter.com", "x.com"],

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return (
        host === "x.com" ||
        host === "twitter.com" ||
        host.endsWith(".twitter.com")
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

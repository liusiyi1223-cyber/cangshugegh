import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/_哔哩哔哩_bilibili$/u, "")
    .replace(/_哔哩哔哩$/u, "")
    .replace(/^【[^】]*】/u, "")
    .trim();
}

export const bilibiliAdapter: PlatformAdapter = {
  name: "bilibili",

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host === "bilibili.com" || host.endsWith(".bilibili.com");
    } catch {
      return false;
    }
  },

  async fetchMeta(url: string): Promise<FetchedMeta> {
    const html = await fetchHtml(url);
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const title = cleanTitle(ogTitle || $("title").first().text());
    const cover = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");
    const author = $('meta[name="author"]').attr("content");

    if (!title) throw new Error("未能解析标题");

    const canonicalUrl = absolutize(ogUrl || url, url);

    return {
      title,
      cover: cover ? absolutize(cover, canonicalUrl) : undefined,
      author: author && author !== "哔哩哔哩" ? author : undefined,
      canonicalUrl,
    };
  },
};

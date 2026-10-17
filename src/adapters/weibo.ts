import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw.replace(/\s*[-_｜|]\s*微博\s*$/u, "").trim();
}

export const weiboAdapter: PlatformAdapter = {
  name: "weibo",

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return (
        host === "weibo.com" ||
        host.endsWith(".weibo.com") ||
        host === "weibo.cn" ||
        host.endsWith(".weibo.cn")
      );
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

    if (!title) throw new Error("未能解析标题");
    if (/页面不存在|404|微博登录|登录微博/i.test(title)) {
      throw new Error("抓取失败：页面不可用");
    }

    const canonicalUrl = absolutize(ogUrl || url, url);

    return {
      title,
      cover: cover ? absolutize(cover, canonicalUrl) : undefined,
      canonicalUrl,
    };
  },
};

import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-_｜|]\s*(百度|好看视频|百家号)\s*$/u, "")
    .trim();
}

export const baiduAdapter: PlatformAdapter = {
  name: "baidu",
  domains: ["baidu.com"],

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host === "baidu.com" || host.endsWith(".baidu.com");
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
    if (/页面不存在|404|抱歉|出错/i.test(title)) {
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

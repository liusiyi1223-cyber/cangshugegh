import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-_]\s*抖音短视频\s*$/u, "")
    .replace(/\s*[-_]\s*抖音\s*$/u, "")
    .trim();
}

export const douyinAdapter: PlatformAdapter = {
  name: "douyin",

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host === "douyin.com" || host.endsWith(".douyin.com");
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
    if (/页面不存在|404|验证码|安全验证|Sorry/i.test(title)) {
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

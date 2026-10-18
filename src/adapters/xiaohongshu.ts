import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[-_]\s*小红书\s*$/u, "")
    .replace(/\s*[-_]\s*小红书 App\s*$/u, "")
    .trim();
}

export const xiaohongshuAdapter: PlatformAdapter = {
  name: "xiaohongshu",
  domains: ["xiaohongshu.com", "xhslink.com", "xhslink.cn"],

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return (
        host === "xiaohongshu.com" ||
        host.endsWith(".xiaohongshu.com") ||
        host === "xhslink.com" ||
        host.endsWith(".xhslink.com") ||
        host === "xhslink.cn" ||
        host.endsWith(".xhslink.cn")
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
    if (/页面不见了|Sorry|不存在|404/i.test(title)) {
      throw new Error("抓取失败：页面不存在");
    }

    const canonicalUrl = absolutize(ogUrl || url, url);

    return {
      title,
      cover: cover ? absolutize(cover, canonicalUrl) : undefined,
      canonicalUrl,
    };
  },
};

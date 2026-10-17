import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

export const wechatAdapter: PlatformAdapter = {
  name: "wechat",

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host === "weixin.qq.com" || host.endsWith(".weixin.qq.com");
    } catch {
      return false;
    }
  },

  async fetchMeta(url: string): Promise<FetchedMeta> {
    const html = await fetchHtml(url);
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const title = (ogTitle || $("title").first().text()).trim();
    const cover = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");

    if (!title) throw new Error("未能解析标题");
    if (/违规|无法查看|参数错误|404|不存在/i.test(title)) {
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

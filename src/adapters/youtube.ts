import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { absolutize, fetchHtml } from "./utils";

export const youtubeAdapter: PlatformAdapter = {
  name: "youtube",
  domains: ["youtube.com"],

  match(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host === "youtube.com" || host.endsWith(".youtube.com");
    } catch {
      return false;
    }
  },

  async fetchMeta(url: string): Promise<FetchedMeta> {
    const html = await fetchHtml(url, this.domains);
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const title = (ogTitle || $("title").first().text()).trim();
    const cover = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");

    if (!title) throw new Error("未能解析标题");
    if (/unavailable|not available|视频不可用/i.test(title)) {
      throw new Error("抓取失败：视频不可用");
    }

    const canonicalUrl = absolutize(ogUrl || url, url);

    return {
      title,
      cover: cover ? absolutize(cover, canonicalUrl) : undefined,
      canonicalUrl,
    };
  },
};

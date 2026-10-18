import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";
import { MAX_BYTES, readBodyLimited, safeFetch } from "../lib/net";

// 通用网页适配器：作为兜底，识别任意 http/https 链接（如 Safari 分享的网页）
export const safariAdapter: PlatformAdapter = {
  name: "other",
  domains: [],

  match(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  },

  async fetchMeta(url: string): Promise<FetchedMeta> {
    const parsed = new URL(url);
    const res = await safeFetch(url, { allowedDomains: [parsed.hostname] });
    if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
    const html = await readBodyLimited(res, MAX_BYTES);
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const title = (ogTitle || $("title").first().text()).trim();
    const cover = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");

    if (!title) throw new Error("未能解析标题");

    const canonicalUrl = ogUrl || url;

    return {
      title,
      cover,
      canonicalUrl,
    };
  },
};

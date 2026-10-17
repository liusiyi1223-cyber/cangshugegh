import { load } from "cheerio";
import type { FetchedMeta, PlatformAdapter } from "./types";

const TIMEOUT_MS = 10_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function cleanTitle(raw: string): string {
  return raw
    .replace(/_哔哩哔哩_bilibili$/u, "")
    .replace(/_哔哩哔哩$/u, "")
    .replace(/^【[^】]*】/u, "")
    .trim();
}

function absolutize(url: string, base: string): string {
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": UA, accept: "text/html" },
      });
      if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
      html = await res.text();
    } finally {
      clearTimeout(timer);
    }

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

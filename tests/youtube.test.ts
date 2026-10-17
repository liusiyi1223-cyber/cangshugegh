import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { youtubeAdapter } from "../src/adapters/youtube";

const pageHtml = readFileSync(
  new URL("./fixtures/youtube/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("youtubeAdapter.match", () => {
  it("匹配 www.youtube.com", () => {
    expect(youtubeAdapter.match("https://www.youtube.com/watch?v=AbCdEf12345")).toBe(true);
  });

  it("不匹配短链 youtu.be（需先还原）", () => {
    expect(youtubeAdapter.match("https://youtu.be/AbCdEf12345")).toBe(false);
  });

  it("不匹配其他域名", () => {
    expect(youtubeAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("youtubeAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => pageHtml }))
    );

    const meta = await youtubeAdapter.fetchMeta(
      "https://www.youtube.com/watch?v=AbCdEf12345"
    );

    expect(meta.title).toBe("视频标题");
    expect(meta.canonicalUrl).toBe("https://www.youtube.com/watch?v=AbCdEf12345");
    expect(meta.cover).toBe("https://i.ytimg.com/vi/AbCdEf12345/hqdefault.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, text: async () => "" }))
    );

    await expect(
      youtubeAdapter.fetchMeta("https://www.youtube.com/watch?v=AbCdEf12345")
    ).rejects.toThrow("抓取失败");
  });
});

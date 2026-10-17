import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { douyinAdapter } from "../src/adapters/douyin";

const pageHtml = readFileSync(
  new URL("./fixtures/douyin/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("douyinAdapter.match", () => {
  it("匹配 www.douyin.com", () => {
    expect(douyinAdapter.match("https://www.douyin.com/video/7123456789012345678")).toBe(true);
  });

  it("匹配短链域名 v.douyin.com", () => {
    expect(douyinAdapter.match("https://v.douyin.com/xxxxx/")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(douyinAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("douyinAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => pageHtml }))
    );

    const meta = await douyinAdapter.fetchMeta(
      "https://www.douyin.com/video/7123456789012345678"
    );

    expect(meta.title).toBe("视频标题");
    expect(meta.canonicalUrl).toBe("https://www.douyin.com/video/7123456789012345678");
    expect(meta.cover).toBe("https://p3-pc-sign.douyinpic.com/tos-cn/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, text: async () => "" }))
    );

    await expect(
      douyinAdapter.fetchMeta("https://www.douyin.com/video/7123456789012345678")
    ).rejects.toThrow("抓取失败");
  });
});

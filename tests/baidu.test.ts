import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { baiduAdapter } from "../src/adapters/baidu";

const pageHtml = readFileSync(
  new URL("./fixtures/baidu/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("baiduAdapter.match", () => {
  it("匹配 haokan.baidu.com", () => {
    expect(
      baiduAdapter.match("https://haokan.baidu.com/v?vid=1234567890123456789")
    ).toBe(true);
  });

  it("匹配 baijiahao.baidu.com", () => {
    expect(
      baiduAdapter.match("https://baijiahao.baidu.com/s?id=9876543210123456789")
    ).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(baiduAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("baiduAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await baiduAdapter.fetchMeta(
      "https://haokan.baidu.com/v?vid=1234567890123456789"
    );

    expect(meta.title).toBe("视频标题");
    expect(meta.canonicalUrl).toBe(
      "https://haokan.baidu.com/v?vid=1234567890123456789"
    );
    expect(meta.cover).toBe("https://pic.rmb.bdstatic.com/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      baiduAdapter.fetchMeta("https://haokan.baidu.com/v?vid=1234567890123456789")
    ).rejects.toThrow("抓取失败");
  });
});

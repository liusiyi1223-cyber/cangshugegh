import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { weiboAdapter } from "../src/adapters/weibo";

const pageHtml = readFileSync(
  new URL("./fixtures/weibo/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("weiboAdapter.match", () => {
  it("匹配 www.weibo.com", () => {
    expect(weiboAdapter.match("https://weibo.com/1657470871/AbCdEf1234")).toBe(true);
  });

  it("匹配 m.weibo.cn", () => {
    expect(weiboAdapter.match("https://m.weibo.cn/status/AbCdEf1234")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(weiboAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("weiboAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await weiboAdapter.fetchMeta(
      "https://weibo.com/1657470871/AbCdEf1234"
    );

    expect(meta.title).toBe("今天天气不错，分享给大家");
    expect(meta.canonicalUrl).toBe("https://weibo.com/1657470871/AbCdEf1234");
    expect(meta.cover).toBe("https://wx1.sinaimg.cn/large/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      weiboAdapter.fetchMeta("https://weibo.com/1657470871/AbCdEf1234")
    ).rejects.toThrow("抓取失败");
  });
});

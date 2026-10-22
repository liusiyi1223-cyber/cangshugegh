import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { xiaohongshuAdapter } from "../src/adapters/xiaohongshu";

const pageHtml = readFileSync(
  new URL("./fixtures/xiaohongshu/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("xiaohongshuAdapter.match", () => {
  it("匹配 www.xiaohongshu.com", () => {
    expect(
      xiaohongshuAdapter.match("https://www.xiaohongshu.com/explore/abc")
    ).toBe(true);
  });

  it("匹配短链 xhslink.com", () => {
    expect(xiaohongshuAdapter.match("https://xhslink.com/a/AbCdEf")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(xiaohongshuAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(
      false
    );
  });
});

describe("xiaohongshuAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await xiaohongshuAdapter.fetchMeta(
      "https://www.xiaohongshu.com/explore/64f8a1b2000000001e02abcd"
    );

    expect(meta.title).toBe("旅行攻略｜去云南一定要去这几个地方");
    expect(meta.canonicalUrl).toBe(
      "https://www.xiaohongshu.com/explore/64f8a1b2000000001e02abcd"
    );
    expect(meta.cover).toBe("http://sns-webpic-qc.xhscdn.com/202310/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      xiaohongshuAdapter.fetchMeta(
        "https://www.xiaohongshu.com/explore/64f8a1b2000000001e02abcd"
      )
    ).rejects.toThrow("抓取失败");
  });
});

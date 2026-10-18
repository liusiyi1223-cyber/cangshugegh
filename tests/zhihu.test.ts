import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { zhihuAdapter } from "../src/adapters/zhihu";

const pageHtml = readFileSync(
  new URL("./fixtures/zhihu/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("zhihuAdapter.match", () => {
  it("匹配 www.zhihu.com", () => {
    expect(zhihuAdapter.match("https://www.zhihu.com/question/123456")).toBe(true);
  });

  it("匹配 zhuanlan.zhihu.com", () => {
    expect(zhihuAdapter.match("https://zhuanlan.zhihu.com/p/987654")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(zhihuAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("zhihuAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await zhihuAdapter.fetchMeta("https://www.zhihu.com/question/123456");

    expect(meta.title).toBe("如何评价某某事件？");
    expect(meta.canonicalUrl).toBe("https://www.zhihu.com/question/123456");
    expect(meta.cover).toBe("https://pic1.zhimg.com/50/abcdef.jpg");
    expect(meta.author).toBeUndefined();
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      zhihuAdapter.fetchMeta("https://www.zhihu.com/question/123456")
    ).rejects.toThrow("抓取失败");
  });
});

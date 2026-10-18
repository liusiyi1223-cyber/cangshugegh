import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { bilibiliAdapter } from "../src/adapters/bilibili";

const pageHtml = readFileSync(
  new URL("./fixtures/bilibili/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("bilibiliAdapter.match", () => {
  it("匹配 www.bilibili.com", () => {
    expect(bilibiliAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(true);
  });

  it("匹配 m.bilibili.com", () => {
    expect(bilibiliAdapter.match("https://m.bilibili.com/video/BV1xx")).toBe(true);
  });

  it("匹配裸域 bilibili.com", () => {
    expect(bilibiliAdapter.match("https://bilibili.com/video/BV1xx")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(bilibiliAdapter.match("https://www.zhihu.com/question/1")).toBe(false);
  });

  it("不匹配 b23.tv 短链（需先还原）", () => {
    expect(bilibiliAdapter.match("https://b23.tv/abc")).toBe(false);
  });
});

describe("bilibiliAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl/作者", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await bilibiliAdapter.fetchMeta(
      "https://www.bilibili.com/video/BV1xx411c7mD"
    );

    expect(meta.title).toBe("测试视频标题");
    expect(meta.canonicalUrl).toBe("https://www.bilibili.com/video/BV1xx411c7mD");
    expect(meta.cover).toBe("https://i0.hdslb.com/bfs/archive/abcd.jpg");
    expect(meta.author).toBe("某UP主");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      bilibiliAdapter.fetchMeta("https://www.bilibili.com/video/BV1xx411c7mD")
    ).rejects.toThrow("抓取失败");
  });
});

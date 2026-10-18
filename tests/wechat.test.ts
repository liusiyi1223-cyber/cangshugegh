import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { wechatAdapter } from "../src/adapters/wechat";

const pageHtml = readFileSync(
  new URL("./fixtures/wechat/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("wechatAdapter.match", () => {
  it("匹配 mp.weixin.qq.com", () => {
    expect(wechatAdapter.match("https://mp.weixin.qq.com/s/AbCdEf123456")).toBe(true);
  });

  it("不匹配其他域名", () => {
    expect(wechatAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("wechatAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await wechatAdapter.fetchMeta(
      "https://mp.weixin.qq.com/s/AbCdEf123456"
    );

    expect(meta.title).toBe("这是一篇测试文章");
    expect(meta.canonicalUrl).toBe("https://mp.weixin.qq.com/s/AbCdEf123456");
    expect(meta.cover).toBe("https://mmbiz.qpic.cn/mmbiz_jpg/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      wechatAdapter.fetchMeta("https://mp.weixin.qq.com/s/AbCdEf123456")
    ).rejects.toThrow("抓取失败");
  });
});

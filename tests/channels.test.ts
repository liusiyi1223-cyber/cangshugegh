import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { channelsAdapter } from "../src/adapters/channels";

const pageHtml = readFileSync(
  new URL("./fixtures/channels/page.html", import.meta.url),
  "utf-8"
);

afterEach(() => vi.unstubAllGlobals());

describe("channelsAdapter.match", () => {
  it("匹配 channels.weixin.qq.com", () => {
    expect(channelsAdapter.match("https://channels.weixin.qq.com/AbCdEf")).toBe(true);
  });

  it("匹配 weixin.qq.com/sph/", () => {
    expect(channelsAdapter.match("https://weixin.qq.com/sph/AbCdEf")).toBe(true);
  });

  it("不匹配公众号 mp.weixin.qq.com", () => {
    expect(channelsAdapter.match("https://mp.weixin.qq.com/s/AbCdEf123456")).toBe(false);
  });

  it("不匹配其他域名", () => {
    expect(channelsAdapter.match("https://www.bilibili.com/video/BV1xx")).toBe(false);
  });
});

describe("channelsAdapter.fetchMeta", () => {
  it("从 og 标签解析标题/封面/canonicalUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(pageHtml, { status: 200 }))
    );

    const meta = await channelsAdapter.fetchMeta("https://channels.weixin.qq.com/AbCdEf");

    expect(meta.title).toBe("视频号视频标题");
    expect(meta.canonicalUrl).toBe("https://channels.weixin.qq.com/AbCdEf");
    expect(meta.cover).toBe("https://findermp.video.qq.com/abcdef.jpg");
  });

  it("非 2xx 响应抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 403 }))
    );

    await expect(
      channelsAdapter.fetchMeta("https://channels.weixin.qq.com/AbCdEf")
    ).rejects.toThrow("抓取失败");
  });
});

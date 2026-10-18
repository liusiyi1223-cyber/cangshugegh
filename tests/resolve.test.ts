import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveUrl } from "../src/lib/resolve";

afterEach(() => vi.unstubAllGlobals());

function response(status: number, url: string, location?: string) {
  return {
    status,
    url,
    headers: { get: () => location ?? null },
  };
}

describe("resolveUrl", () => {
  it("返回短链还原后的最终 URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.startsWith("https://b23.tv")) {
          return response(302, url, "https://www.bilibili.com/video/BV1xx411c7mD");
        }
        return response(200, url);
      })
    );
    const result = await resolveUrl("https://b23.tv/abc123");
    expect(result).toBe("https://www.bilibili.com/video/BV1xx411c7mD");
  });

  it("无重定向时返回原 URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => response(200, url)));
    const result = await resolveUrl("https://www.bilibili.com/video/BV1xx");
    expect(result).toBe("https://www.bilibili.com/video/BV1xx");
  });

  it("拒绝内网 IP", async () => {
    await expect(resolveUrl("http://127.0.0.1/")).rejects.toThrow(
      "域名不在白名单内"
    );
  });

  it("拒绝重定向到内网", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.startsWith("https://b23.tv")) {
          return response(302, url, "http://127.0.0.1/");
        }
        return response(200, url);
      })
    );
    await expect(resolveUrl("https://b23.tv/abc123")).rejects.toThrow(
      "域名不在白名单内"
    );
  });

  it("拒绝非 http 协议", async () => {
    await expect(resolveUrl("file:///etc/passwd")).rejects.toThrow(
      "不支持的协议"
    );
  });
});

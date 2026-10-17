import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveUrl } from "../src/lib/resolve";

afterEach(() => vi.unstubAllGlobals());

describe("resolveUrl", () => {
  it("返回重定向后的最终 URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        url: "https://www.bilibili.com/video/BV1xx411c7mD",
      }))
    );
    const result = await resolveUrl("https://b23.tv/abc123");
    expect(result).toBe("https://www.bilibili.com/video/BV1xx411c7mD");
  });

  it("无重定向时返回原 URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ url: "https://www.bilibili.com/video/BV1xx" }))
    );
    const result = await resolveUrl("https://www.bilibili.com/video/BV1xx");
    expect(result).toBe("https://www.bilibili.com/video/BV1xx");
  });

  it("response.url 为空时回退到入参", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ url: "" })));
    const result = await resolveUrl("https://example.com/x");
    expect(result).toBe("https://example.com/x");
  });
});

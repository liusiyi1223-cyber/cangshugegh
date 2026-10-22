import { describe, it, expect } from "vitest";
import { normalizeUrl } from "../src/lib/normalize-url";

describe("normalizeUrl", () => {
  it("剔除 tracking 参数，保留其余 query", () => {
    expect(
      normalizeUrl("https://b23.tv/abc?spm_id_from=333&p=2")
    ).toBe("https://b23.tv/abc?p=2");
  });

  it("http 统一为 https", () => {
    expect(normalizeUrl("http://example.com/x")).toBe("https://example.com/x");
  });

  it("hostname 小写", () => {
    expect(normalizeUrl("https://Example.com/x")).toBe("https://example.com/x");
  });

  it("去掉末尾斜杠", () => {
    expect(normalizeUrl("https://example.com/x/")).toBe("https://example.com/x");
  });

  it("去掉 fragment", () => {
    expect(normalizeUrl("https://example.com/x#sec")).toBe(
      "https://example.com/x"
    );
  });

  it("保留有效 query 参数", () => {
    expect(normalizeUrl("https://example.com/x?v=123")).toBe(
      "https://example.com/x?v=123"
    );
  });

  it("综合归一", () => {
    expect(
      normalizeUrl("http://Example.com/video/1/?utm_source=a&p=2#sec")
    ).toBe("https://example.com/video/1?p=2");
  });

  it("非法 URL 原样返回", () => {
    expect(normalizeUrl("不是链接")).toBe("不是链接");
  });
});

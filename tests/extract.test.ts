import { describe, it, expect } from "vitest";
import { extractUrls } from "../src/lib/extract";

describe("extractUrls", () => {
  it("提取单个链接", () => {
    expect(extractUrls("看这个 https://b23.tv/abc123")).toEqual([
      "https://b23.tv/abc123",
    ]);
  });

  it("链接紧跟中文标点时截断", () => {
    expect(extractUrls("【标题】 https://b23.tv/abc123。复制到浏览器")).toEqual([
      "https://b23.tv/abc123",
    ]);
  });

  it("多个链接去重", () => {
    const text = "第一个 https://a.com/1 第二个 https://a.com/1 第三个 https://b.com/2";
    expect(extractUrls(text)).toEqual(["https://a.com/1", "https://b.com/2"]);
  });

  it("去掉尾部英文句点", () => {
    expect(extractUrls("see https://example.com/foo.")).toEqual([
      "https://example.com/foo",
    ]);
  });

  it("保留查询串", () => {
    expect(extractUrls("https://www.bilibili.com/video/BV1xx?spm_id_from=333.999")).toEqual([
      "https://www.bilibili.com/video/BV1xx?spm_id_from=333.999",
    ]);
  });

  it("无链接返回空数组", () => {
    expect(extractUrls("这里没有链接")).toEqual([]);
  });
});

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("node:dns", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "node:dns";
import {
  isBlockedIp,
  isAllowedHost,
  assertPublicHost,
  safeFetch,
  readBodyLimited,
} from "../src/lib/net";

const mockedLookup = vi.mocked(lookup);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("isBlockedIp", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "169.254.1.1",
    "172.16.0.1",
    "172.31.255.255",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
  ])("拒绝内网/保留 IPv4：%s", (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "114.114.114.114"])(
    "放行公网 IPv4：%s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(false);
    }
  );

  it.each([
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd00::1",
    "::ffff:127.0.0.1",
    "::ffff:192.168.1.1",
  ])("拒绝内网/链路本地 IPv6：%s", (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(["2606:4700::1111", "2001:4860:4860::8888"])(
    "放行公网 IPv6：%s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(false);
    }
  );
});

describe("isAllowedHost", () => {
  const domains = ["bilibili.com"];

  it("精确域名匹配", () => {
    expect(isAllowedHost("bilibili.com", domains)).toBe(true);
  });

  it("子域名匹配", () => {
    expect(isAllowedHost("www.bilibili.com", domains)).toBe(true);
    expect(isAllowedHost("m.bilibili.com", domains)).toBe(true);
  });

  it("大小写不敏感", () => {
    expect(isAllowedHost("WWW.BILIBILI.COM", domains)).toBe(true);
  });

  it("拒绝相似但不属于该域的域名", () => {
    expect(isAllowedHost("evilbilibili.com", domains)).toBe(false);
    expect(isAllowedHost("bilibili.com.evil.com", domains)).toBe(false);
  });
});

describe("assertPublicHost", () => {
  it("解析到内网 IP 时拒绝（防 DNS 重绑定）", async () => {
    (mockedLookup as any).mockImplementation(
      (_hostname: string, _options: unknown, cb: any) => {
        cb(null, [
          { address: "8.8.8.8", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ]);
      }
    );

    await expect(assertPublicHost("example.com")).rejects.toThrow(
      "拒绝访问内网地址"
    );
  });

  it("全部为公网 IP 时通过", async () => {
    (mockedLookup as any).mockImplementation(
      (_hostname: string, _options: unknown, cb: any) => {
        cb(null, [{ address: "8.8.8.8", family: 4 }]);
      }
    );

    await expect(assertPublicHost("example.com")).resolves.toBeUndefined();
  });
});

describe("safeFetch", () => {
  beforeEach(() => {
    (mockedLookup as any).mockImplementation(
      (_hostname: string, _options: unknown, cb: any) => {
        cb(null, [{ address: "8.8.8.8", family: 4 }]);
      }
    );
  });

  it("拒绝非 http/https 协议", async () => {
    await expect(
      safeFetch("ftp://example.com/x", { allowedDomains: ["example.com"] })
    ).rejects.toThrow("不支持的协议");
    await expect(
      safeFetch("file:///etc/passwd", { allowedDomains: ["example.com"] })
    ).rejects.toThrow("不支持的协议");
  });

  it("拒绝非白名单域名", async () => {
    await expect(
      safeFetch("https://evil.com/x", { allowedDomains: ["bilibili.com"] })
    ).rejects.toThrow("域名不在白名单内");
  });

  it("拒绝重定向到内网", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 302,
        headers: { get: () => "http://127.0.0.1/" },
        url: "https://bilibili.com/video/1",
      }))
    );
    await expect(
      safeFetch("https://bilibili.com/video/1", { allowedDomains: ["bilibili.com"] })
    ).rejects.toThrow("域名不在白名单内");
  });

  it("超过最大跳数拒绝", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 302,
        headers: { get: () => "https://bilibili.com/x" },
        url: "https://bilibili.com/x",
      }))
    );
    await expect(
      safeFetch("https://bilibili.com/x", {
        allowedDomains: ["bilibili.com"],
        maxRedirects: 2,
      })
    ).rejects.toThrow("重定向次数过多");
  });

  it("正常请求返回响应", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        ok: true,
        headers: { get: () => null },
        url: "https://bilibili.com/video/1",
      }))
    );
    const res = await safeFetch("https://bilibili.com/video/1", {
      allowedDomains: ["bilibili.com"],
    });
    expect(res.status).toBe(200);
  });
});

describe("readBodyLimited", () => {
  it("响应体超过上限拒绝", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(100));
        controller.close();
      },
    });
    const res = new Response(stream);
    await expect(readBodyLimited(res, 10)).rejects.toThrow("超过大小上限");
  });

  it("正常读取响应体", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("hello"));
        controller.close();
      },
    });
    const res = new Response(stream);
    expect(await readBodyLimited(res, 100)).toBe("hello");
  });
});

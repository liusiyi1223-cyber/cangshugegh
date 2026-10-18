import { lookup } from "node:dns";
import { Agent } from "undici";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export const TIMEOUT_MS = 10_000;
export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_REDIRECTS = 5;

// 短链/跳转域名：还原短链阶段需要先访问它们，还原后再落到平台域名
export const SHORTLINK_DOMAINS = [
  "b23.tv",
  "youtu.be",
  "xhslink.com",
  "xhslink.cn",
  "instagr.am",
  "t.co",
];

function isBlockedIpV4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 本机回环
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 链路本地
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a >= 224) return true; // 224.0.0.0/4 组播 + 240.0.0.0/4 保留
  return false;
}

export function isBlockedIp(address: string): boolean {
  const ip = address.toLowerCase().split("%")[0]; // 去掉 IPv6 zone id
  if (ip.includes(":")) {
    if (ip === "::" || ip === "::1") return true; // 未指定 + 回环
    if (ip.startsWith("::ffff:")) return isBlockedIpV4(ip.slice(7)); // IPv4 映射
    if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // fc00::/7 ULA
    if (/^fe[89ab]/.test(ip)) return true; // fe80::/10 链路本地
    return false;
  }
  return isBlockedIpV4(ip);
}

export function isAllowedHost(hostname: string, domains: string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((d) => {
    const domain = d.toLowerCase();
    return host === domain || host.endsWith("." + domain);
  });
}

// 供 undici Agent 在连接时做 DNS 解析：解析出全部 IP，任一命中内网即拒绝，防 DNS 重绑定
export function safeLookup(
  hostname: string,
  _options: unknown,
  callback: (err: Error | null, address?: string, family?: number) => void
): void {
  const lookupWithAll = lookup as unknown as (
    hostname: string,
    options: { all: true },
    cb: (
      err: NodeJS.ErrnoException | null,
      addresses: { address: string; family: number }[]
    ) => void
  ) => void;

  lookupWithAll(hostname, { all: true }, (err, addresses) => {
    if (err) {
      callback(err as Error);
      return;
    }
    for (const item of addresses) {
      if (isBlockedIp(item.address)) {
        callback(new Error(`拒绝访问内网地址: ${item.address}`));
        return;
      }
    }
    const first = addresses[0];
    callback(null, first.address, first.family);
  });
}

let agent: Agent | null = null;

function getAgent(): Agent {
  if (!agent) {
    agent = new Agent({
      connect: {
        lookup: safeLookup as never,
      },
    });
  }
  return agent;
}

export interface SafeFetchOptions {
  allowedDomains: string[];
  maxBytes?: number;
  maxRedirects?: number;
  timeoutMs?: number;
  accept?: string;
}

function assertSafeUrl(url: string, allowedDomains: string[]): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`无效的 URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`不支持的协议: ${parsed.protocol}`);
  }
  if (!isAllowedHost(parsed.hostname, allowedDomains)) {
    throw new Error(`域名不在白名单内: ${parsed.hostname}`);
  }
  return parsed;
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions
): Promise<Response> {
  const { allowedDomains } = options;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let current = url;
    for (let i = 0; i <= maxRedirects; i++) {
      assertSafeUrl(current, allowedDomains);

      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": UA, accept: options.accept ?? "text/html" },
        dispatcher: getAgent(),
      } as RequestInit & { dispatcher: Agent });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return res;
        current = new URL(location, current).toString();
        continue;
      }
      return res;
    }
    throw new Error("重定向次数过多");
  } finally {
    clearTimeout(timer);
  }
}

export async function readBodyLimited(
  res: Response,
  maxBytes: number
): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`响应体超过大小上限 ${maxBytes} 字节`);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function readBodyLimitedBuffer(
  res: Response,
  maxBytes: number
): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`响应体超过大小上限 ${maxBytes} 字节`);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return merged;
}

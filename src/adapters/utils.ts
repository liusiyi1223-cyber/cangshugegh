import { MAX_BYTES, readBodyLimited, safeFetch } from "../lib/net";

export function absolutize(url: string, base: string): string {
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export async function fetchHtml(
  url: string,
  allowedDomains: string[]
): Promise<string> {
  const res = await safeFetch(url, { allowedDomains });
  if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
  return await readBodyLimited(res, MAX_BYTES);
}

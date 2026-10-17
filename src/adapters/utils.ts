const TIMEOUT_MS = 10_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export function absolutize(url: string, base: string): string {
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html" },
    });
    if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// 匹配 https:// 开头的 URL，直到遇到空白、中文字符或全角标点
const URL_RE = /https?:\/\/[^\s一-鿿　-〿＀-￯]+/g;
const TRAILING = /[.,;:!?)\]}>»]+$/;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const url = raw.replace(TRAILING, "");
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

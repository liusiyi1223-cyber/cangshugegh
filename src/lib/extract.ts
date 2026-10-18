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

// 从分享文本里提取标题文字：取链接前的文字，去掉常见噪音
export function extractTitle(text: string): string {
  const match = text.match(URL_RE);
  if (!match) return "";
  const urlIndex = text.indexOf(match[0]);
  let before = text.slice(0, urlIndex);

  before = before
    .replace(/^\d+(\.\d+)?\s*/, "") // 开头数字（抖音的 7.43）
    .replace(/复制打开[^，。]*[，。]?/g, "")
    .replace(/看看[^，。]*[，。]?/g, "")
    .replace(/分享\s*@?[^\s]*\s*的一条(微博|视频|笔记)?\s*/g, "")
    .replace(/打开【[^】]*】[^，。]*[，。]?/g, "")
    .replace(/【([^】]*)】/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[，。！？；：、]+/, "")
    .replace(/[，。！？；：、]+$/, "");

  return before;
}

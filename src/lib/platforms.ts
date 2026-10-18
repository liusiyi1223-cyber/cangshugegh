export const PLATFORMS = [
  { key: "bilibili", name: "哔哩哔哩" },
  { key: "zhihu", name: "知乎" },
  { key: "xiaohongshu", name: "小红书" },
  { key: "douyin", name: "抖音" },
  { key: "weibo", name: "微博" },
  { key: "baidu", name: "百度" },
  { key: "wechat", name: "微信公众号" },
  { key: "channels", name: "微信视频号" },
  { key: "youtube", name: "YouTube" },
  { key: "instagram", name: "Instagram" },
  { key: "x", name: "X（推特）" },
  { key: "other", name: "其他" },
];

export function platformName(key?: string | null): string {
  return PLATFORMS.find((p) => p.key === key)?.name ?? key ?? "未知";
}

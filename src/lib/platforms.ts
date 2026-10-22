import type { ComponentType } from "react";
import {
  SiBaidu,
  SiBilibili,
  SiInstagram,
  SiSinaweibo,
  SiTiktok,
  SiWechat,
  SiX,
  SiXiaohongshu,
  SiYoutube,
  SiZhihu,
} from "@icons-pack/react-simple-icons";
import { Globe } from "lucide-react";

export const PLATFORMS = [
  { key: "bilibili", name: "哔哩哔哩" },
  { key: "zhihu", name: "知乎" },
  { key: "xiaohongshu", name: "小红书" },
  { key: "douyin", name: "抖音" },
  { key: "weibo", name: "微博" },
  { key: "baidu", name: "百度" },
  { key: "wechat", name: "公众号" },
  { key: "channels", name: "视频号" },
  { key: "youtube", name: "YouTube" },
  { key: "instagram", name: "Instagram" },
  { key: "x", name: "X（推特）" },
  { key: "other", name: "其他" },
];

export function platformName(key?: string | null): string {
  return PLATFORMS.find((p) => p.key === key)?.name ?? key ?? "未知";
}

type IconType = ComponentType<{ size?: number | string; className?: string }>;

const platformIcons: Record<string, IconType> = {
  bilibili: SiBilibili,
  baidu: SiBaidu,
  zhihu: SiZhihu,
  xiaohongshu: SiXiaohongshu,
  douyin: SiTiktok,
  weibo: SiSinaweibo,
  wechat: SiWechat,
  channels: SiWechat,
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
};

export function platformIcon(key?: string | null): IconType {
  return platformIcons[key ?? ""] ?? Globe;
}

const platformColors: Record<string, string> = {
  bilibili: "#FB7299",
  baidu: "#2932E1",
  zhihu: "#0084FF",
  xiaohongshu: "#FF2442",
  douyin: "#000000",
  weibo: "#E6162D",
  wechat: "#07C160",
  channels: "#07C160",
  youtube: "#FF0000",
  instagram: "#E4405F",
  x: "#000000",
};

export function platformColor(key?: string | null): string {
  return platformColors[key ?? ""] ?? "#647584";
}

const appIcons: Record<string, string> = {
  bilibili: "/icons/bilibili.png",
  zhihu: "/icons/zhihu.jpg",
  xiaohongshu: "/icons/xiaohongshu.jpg",
  douyin: "/icons/douyin.jpg",
  weibo: "/icons/weibo.jpg",
  baidu: "/icons/baidu.jpg",
  wechat: "/icons/wechat.jpg",
  channels: "/icons/wechat.jpg",
  youtube: "/icons/youtube.jpg",
  instagram: "/icons/instagram.jpg",
  x: "/icons/x.jpg",
};

export function platformAppIcon(key?: string | null): string | undefined {
  return appIcons[key ?? ""];
}

// 根据链接域名识别平台（纯前端可用，不依赖抓取）。返回 platform key 或 undefined
export function detectPlatform(url: string): string | undefined {
  let host: string;
  let path: string;
  try {
    const u = new URL(url);
    host = u.hostname;
    path = u.pathname;
  } catch {
    return undefined;
  }

  // 视频号（channels）优先于公众号（wechat），两者域名都是 weixin.qq.com
  if (
    host === "channels.weixin.qq.com" ||
    (host === "weixin.qq.com" && path.startsWith("/sph"))
  ) {
    return "channels";
  }

  const rules: [string, string[]][] = [
    ["bilibili", ["bilibili.com"]],
    ["zhihu", ["zhihu.com"]],
    ["xiaohongshu", ["xiaohongshu.com", "xhslink.com", "xhslink.cn"]],
    ["douyin", ["douyin.com"]],
    ["weibo", ["weibo.com", "weibo.cn"]],
    ["baidu", ["baidu.com"]],
    ["wechat", ["weixin.qq.com"]],
    ["youtube", ["youtube.com", "youtu.be"]],
    ["instagram", ["instagram.com", "instagr.am"]],
    ["x", ["twitter.com", "x.com"]],
  ];

  for (const [name, domains] of rules) {
    if (domains.some((d) => host === d || host.endsWith("." + d))) {
      return name;
    }
  }
  return undefined;
}

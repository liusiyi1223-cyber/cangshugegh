import type { ComponentType } from "react";
import {
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

type IconType = ComponentType<{ size?: number | string; className?: string }>;

const platformIcons: Record<string, IconType> = {
  bilibili: SiBilibili,
  zhihu: SiZhihu,
  xiaohongshu: SiXiaohongshu,
  douyin: SiTiktok,
  weibo: SiSinaweibo,
  wechat: SiWechat,
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
};

export function platformIcon(key?: string | null): IconType {
  return platformIcons[key ?? ""] ?? Globe;
}

const platformColors: Record<string, string> = {
  bilibili: "#FB7299",
  zhihu: "#0084FF",
  xiaohongshu: "#FF2442",
  douyin: "#000000",
  weibo: "#E6162D",
  wechat: "#07C160",
  youtube: "#FF0000",
  instagram: "#E4405F",
  x: "#000000",
};

export function platformColor(key?: string | null): string {
  return platformColors[key ?? ""] ?? "#647584";
}

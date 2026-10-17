import type { PlatformAdapter } from "./types";
import { bilibiliAdapter } from "./bilibili";
import { douyinAdapter } from "./douyin";
import { weiboAdapter } from "./weibo";
import { xiaohongshuAdapter } from "./xiaohongshu";
import { zhihuAdapter } from "./zhihu";

export const adapters: PlatformAdapter[] = [
  bilibiliAdapter,
  zhihuAdapter,
  xiaohongshuAdapter,
  douyinAdapter,
  weiboAdapter,
];

export function matchAdapter(url: string): PlatformAdapter | undefined {
  return adapters.find((adapter) => adapter.match(url));
}

import type { PlatformAdapter } from "./types";
import { baiduAdapter } from "./baidu";
import { bilibiliAdapter } from "./bilibili";
import { channelsAdapter } from "./channels";
import { douyinAdapter } from "./douyin";
import { wechatAdapter } from "./wechat";
import { weiboAdapter } from "./weibo";
import { xiaohongshuAdapter } from "./xiaohongshu";
import { zhihuAdapter } from "./zhihu";

export const adapters: PlatformAdapter[] = [
  bilibiliAdapter,
  zhihuAdapter,
  xiaohongshuAdapter,
  douyinAdapter,
  weiboAdapter,
  baiduAdapter,
  channelsAdapter,
  wechatAdapter,
];

export function matchAdapter(url: string): PlatformAdapter | undefined {
  return adapters.find((adapter) => adapter.match(url));
}

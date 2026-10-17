import type { PlatformAdapter } from "./types";
import { bilibiliAdapter } from "./bilibili";
import { zhihuAdapter } from "./zhihu";

export const adapters: PlatformAdapter[] = [bilibiliAdapter, zhihuAdapter];

export function matchAdapter(url: string): PlatformAdapter | undefined {
  return adapters.find((adapter) => adapter.match(url));
}

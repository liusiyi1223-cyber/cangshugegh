import type { PlatformAdapter } from "./types";
import { bilibiliAdapter } from "./bilibili";

export const adapters: PlatformAdapter[] = [bilibiliAdapter];

export function matchAdapter(url: string): PlatformAdapter | undefined {
  return adapters.find((adapter) => adapter.match(url));
}

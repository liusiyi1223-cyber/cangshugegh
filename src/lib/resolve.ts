import { PLATFORM_DOMAINS } from "../adapters/index";
import { safeFetch, SHORTLINK_DOMAINS } from "./net";

const RESOLVE_DOMAINS = [...new Set([...SHORTLINK_DOMAINS, ...PLATFORM_DOMAINS])];

export async function resolveUrl(url: string): Promise<string> {
  const res = await safeFetch(url, { allowedDomains: RESOLVE_DOMAINS });
  return res.url || url;
}

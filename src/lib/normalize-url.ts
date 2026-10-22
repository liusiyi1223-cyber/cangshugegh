const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "spm_id_from",
  "spm_id_for",
  "spm_id",
  "vd_source",
  "share_source",
  "share_medium",
  "share_plat",
  "share_session_id",
  "share_channel",
  "from_source",
  "from_spmid",
  "frm",
  "xsec_token",
  "refer",
  "ref",
]);

// 把「同一条链接的轻微写法差异」归一到同一个 key，用于本地确定性去重
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return trimmed;
  }
  u.protocol = "https:";
  u.hostname = u.hostname.toLowerCase();
  u.hash = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      u.searchParams.delete(key);
    }
  }
  return u.toString();
}
